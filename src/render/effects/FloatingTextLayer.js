import { easeOutBack, easeOutCubic } from '../../utils/math.js';

const FONT_STACK = "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";

/** Pop-in world-space labels: damage numbers, combo counts, COUNTER!, etc. */
export class FloatingTextLayer {
    #items = [];

    clear() {
        this.#items = [];
    }

    spawn(text, x, y, { color = '#ffffff', size = 24, life = 0.8, rise = 70, drift = 0 } = {}) {
        if (this.#items.length > 40) this.#items.shift();
        this.#items.push({ text: String(text), x, y, color, size, life, rise, drift, age: 0 });
    }

    update(dt) {
        for (const item of this.#items) item.age += dt;
        this.#items = this.#items.filter((item) => item.age < item.life);
    }

    draw(ctx) {
        if (!this.#items.length) return;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        for (const item of this.#items) {
            const t = item.age / item.life;
            const pop = t < 0.18 ? easeOutBack(t / 0.18) : 1;
            ctx.globalAlpha = t > 0.6 ? 1 - (t - 0.6) / 0.4 : 1;
            ctx.font = `${Math.max(1, item.size * pop)}px ${FONT_STACK}`;
            const x = item.x + item.drift * easeOutCubic(t);
            const y = item.y - item.rise * easeOutCubic(t);
            ctx.lineWidth = Math.max(3, item.size * 0.18);
            ctx.strokeStyle = 'rgba(8, 4, 18, 0.85)';
            ctx.strokeText(item.text, x, y);
            ctx.fillStyle = item.color;
            ctx.fillText(item.text, x, y);
        }
        ctx.restore();
    }
}
