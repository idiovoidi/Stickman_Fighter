import { TAU, pick } from '../utils/math.js';

const SKYLINE_LAYERS = [
    { tileWidth: 1900, parallax: 0.16, minHeight: 0.16, maxHeight: 0.42, color: '#1d1238', windowChance: 0.16, neonChance: 0.08, windowAlpha: 0.45 },
    { tileWidth: 1600, parallax: 0.34, minHeight: 0.08, maxHeight: 0.3, color: '#0f0a20', windowChance: 0.22, neonChance: 0.18, windowAlpha: 0.85 },
];

const WINDOW_COLORS = ['#ffd38a', '#ffe7b8', '#7df9ff', '#ff8af0'];
const NEON_COLORS = ['#ff4fd8', '#4ff3ff', '#ffd166', '#7cf7c5'];

/** Screen-space sky: gradient, stars, moon, mountains and parallax skylines (pre-rendered on resize). */
export class BackdropPainter {
    constructor({ rng = Math.random } = {}) {
        this.rng = rng;
        this.stars = [];
        this.embers = [];
        this.layers = [];
        this.mountains = null;
        this.horizonY = 0;
    }

    resize(view, horizonY) {
        const { rng } = this;
        this.horizonY = horizonY;
        this.stars = Array.from({ length: 150 }, () => ({
            x: rng(), y: rng() * 0.6, radius: 0.4 + rng() ** 3 * 1.6, phase: rng() * TAU, speed: 0.5 + rng() * 2,
        }));
        this.embers = Array.from({ length: 36 }, () => ({
            x: rng(), y: rng(), speed: 8 + rng() * 22, drift: rng() * TAU, size: 0.8 + rng() * 1.8,
            color: pick(rng, ['255, 120, 220', '120, 240, 255', '255, 210, 140']),
        }));
        this.mountains = this.#buildMountains(Math.ceil(view.width), horizonY, view.dpr);
        this.layers = SKYLINE_LAYERS.map((spec) => ({ ...spec, canvas: this.#buildSkyline(spec, horizonY, view.dpr) }));
    }

    draw(ctx, view, camera, time) {
        const { width, height } = view;
        const horizon = this.horizonY;

        const sky = ctx.createLinearGradient(0, 0, 0, horizon);
        sky.addColorStop(0, '#04040c');
        sky.addColorStop(0.45, '#130b2e');
        sky.addColorStop(0.8, '#3b1252');
        sky.addColorStop(1, '#8c2a6a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        this.#drawStars(ctx, view, time);
        this.#drawMoon(ctx, view, camera);
        this.#drawTiled(ctx, this.mountains, width, width, horizon, camera, 0.05);
        for (const layer of this.layers) this.#drawTiled(ctx, layer.canvas, layer.tileWidth, width, horizon, camera, layer.parallax);

        const haze = ctx.createLinearGradient(0, horizon - height * 0.22, 0, horizon);
        haze.addColorStop(0, 'rgba(255, 79, 180, 0)');
        haze.addColorStop(1, 'rgba(255, 79, 180, 0.22)');
        ctx.fillStyle = haze;
        ctx.fillRect(0, horizon - height * 0.22, width, height * 0.22);

        this.#drawEmbers(ctx, view, time);
    }

    #drawStars(ctx, view, time) {
        for (const star of this.stars) {
            const twinkle = 0.45 + 0.55 * Math.sin(time * star.speed + star.phase);
            ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + twinkle * 0.6})`;
            ctx.beginPath();
            ctx.arc(star.x * view.width, star.y * this.horizonY, star.radius, 0, TAU);
            ctx.fill();
        }
    }

    #drawMoon(ctx, view, camera) {
        const radius = Math.min(view.width, view.height) * 0.085;
        const x = view.width * 0.76 - (camera.x - camera.arena.width / 2) * camera.scale * 0.02;
        const y = view.height * 0.22;

        const glow = ctx.createRadialGradient(x, y, radius * 0.6, x, y, radius * 4);
        glow.addColorStop(0, 'rgba(255, 190, 240, 0.35)');
        glow.addColorStop(1, 'rgba(255, 190, 240, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - radius * 4, y - radius * 4, radius * 8, radius * 8);

        const face = ctx.createLinearGradient(x, y - radius, x, y + radius);
        face.addColorStop(0, '#fff4fb');
        face.addColorStop(1, '#ffb3dc');
        ctx.fillStyle = face;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TAU);
        ctx.fill();

        ctx.fillStyle = 'rgba(190, 110, 170, 0.18)';
        for (const [cx, cy, r] of [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.24], [-0.05, 0.42, 0.12], [0.35, -0.38, 0.09]]) {
            ctx.beginPath();
            ctx.arc(x + cx * radius, y + cy * radius, r * radius, 0, TAU);
            ctx.fill();
        }
        // Synthwave stripes cut across the lower half of the moon.
        ctx.fillStyle = '#3b1252';
        for (let i = 0; i < 4; i++) {
            const stripeY = y + radius * (0.25 + i * 0.2);
            ctx.fillRect(x - radius, stripeY, radius * 2, 1.5 + i * 1.2);
        }
    }

    #drawEmbers(ctx, view, time) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const ember of this.embers) {
            const y = (((ember.y * view.height - time * ember.speed) % view.height) + view.height) % view.height;
            const x = ember.x * view.width + Math.sin(time * 0.6 + ember.drift) * 24;
            const flicker = 0.35 + 0.35 * Math.sin(time * 3 + ember.drift * 5);
            ctx.fillStyle = `rgba(${ember.color}, ${flicker * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, ember.size, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }

    #drawTiled(ctx, canvas, tileWidth, viewWidth, horizon, camera, parallax) {
        if (!canvas) return;
        const tileHeight = canvas.height / (canvas.width / tileWidth);
        const shift = -camera.x * camera.scale * parallax;
        let x = ((shift % tileWidth) + tileWidth) % tileWidth - tileWidth;
        for (; x < viewWidth; x += tileWidth) {
            ctx.drawImage(canvas, x, horizon - tileHeight, tileWidth, tileHeight);
        }
    }

    #offscreen(width, height, dpr) {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * dpr));
        canvas.height = Math.max(1, Math.round(height * dpr));
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { canvas, ctx };
    }

    #buildMountains(width, horizon, dpr) {
        const height = horizon * 0.5;
        const { canvas, ctx } = this.#offscreen(width, height, dpr);
        const waves = [[2, 0.35], [5, 0.18], [11, 0.08]].map(([cycles, amp]) => ({ cycles, amp, phase: this.rng() * TAU }));
        ctx.fillStyle = '#2a1446';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 6) {
            const t = x / width;
            const ridge = waves.reduce((sum, w) => sum + Math.sin(t * w.cycles * TAU + w.phase) * w.amp, 0);
            ctx.lineTo(x, height * (0.55 - ridge * 0.6));
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
        return canvas;
    }

    #buildSkyline(spec, horizon, dpr) {
        const { rng } = this;
        const height = horizon;
        const { canvas, ctx } = this.#offscreen(spec.tileWidth, height, dpr);
        let x = 0;
        while (x < spec.tileWidth - 30) {
            const w = Math.min(40 + rng() * 90, spec.tileWidth - x);
            const h = height * (spec.minHeight + rng() * (spec.maxHeight - spec.minHeight));
            const top = height - h;
            ctx.fillStyle = spec.color;
            ctx.fillRect(x, top, w + 1, h);
            if (rng() < 0.3) ctx.fillRect(x + w * 0.5 - 1, top - 18 - rng() * 20, 2, 40);

            ctx.globalAlpha = spec.windowAlpha;
            for (let wy = top + 8; wy < height - 6; wy += 9) {
                for (let wx = x + 5; wx < x + w - 6; wx += 8) {
                    if (rng() > spec.windowChance) continue;
                    ctx.fillStyle = pick(rng, WINDOW_COLORS);
                    ctx.fillRect(wx, wy, 3, 4);
                }
            }
            ctx.globalAlpha = 1;

            if (rng() < spec.neonChance) {
                const neon = pick(rng, NEON_COLORS);
                ctx.save();
                ctx.shadowColor = neon;
                ctx.shadowBlur = 12;
                ctx.fillStyle = neon;
                ctx.fillRect(x + w * 0.2, top + 10, 4, Math.min(60, h * 0.5));
                ctx.restore();
            }
            x += w + rng() * 6;
        }
        return canvas;
    }
}
