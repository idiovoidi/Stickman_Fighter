import { TAU } from '../utils/math.js';

const GRID_STEP = 100;
const PILLAR_HEIGHT = 340;

/** The rooftop stage: perspective grid floor, neon edge and boundary light pillars. */
export class StagePainter {
    constructor({ arena }) {
        this.arena = arena;
    }

    drawFloor(ctx, view, camera) {
        const { width, height } = view;
        const floorY = camera.floorScreenY(view);

        const base = ctx.createLinearGradient(0, floorY, 0, height);
        base.addColorStop(0, '#1d1133');
        base.addColorStop(1, '#06040c');
        ctx.fillStyle = base;
        ctx.fillRect(0, floorY, width, height - floorY);

        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(180, 110, 255, 0.22)';
        const leftWorld = camera.x - width / camera.scale;
        const rightWorld = camera.x + width / camera.scale;
        ctx.beginPath();
        for (let wx = Math.floor(leftWorld / GRID_STEP) * GRID_STEP; wx <= rightWorld; wx += GRID_STEP) {
            const top = camera.screenX(wx, view);
            const bottom = width / 2 + (top - width / 2) * 2.2;
            ctx.moveTo(top, floorY);
            ctx.lineTo(bottom, height);
        }
        ctx.stroke();

        for (let i = 1; i <= 10; i++) {
            const t = (i / 10) ** 1.8;
            const y = floorY + (height - floorY) * t;
            ctx.strokeStyle = `rgba(180, 110, 255, ${0.05 + t * 0.18})`;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    /** Fades reflections into the distance and draws the glowing stage edge. */
    drawFloorOverlay(ctx, view, camera) {
        const { width, height } = view;
        const floorY = camera.floorScreenY(view);

        const fade = ctx.createLinearGradient(0, floorY, 0, floorY + (height - floorY) * 0.85);
        fade.addColorStop(0, 'rgba(12, 7, 24, 0)');
        fade.addColorStop(1, 'rgba(8, 5, 16, 0.85)');
        ctx.fillStyle = fade;
        ctx.fillRect(0, floorY, width, height - floorY);

        const left = Math.max(0, camera.screenX(0, view));
        const right = Math.min(width, camera.screenX(this.arena.width, view));
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 138, 240, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(width, floorY);
        ctx.stroke();

        ctx.shadowColor = '#ff4fd8';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#ff9cf2';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(left, floorY);
        ctx.lineTo(right, floorY);
        ctx.stroke();
        ctx.restore();
    }

    /** World-space light pillars marking the arena walls. */
    drawProps(ctx, time) {
        const pulse = 0.75 + 0.25 * Math.sin(time * 2.4);
        for (const x of [0, this.arena.width]) {
            ctx.save();
            ctx.fillStyle = '#120a22';
            ctx.fillRect(x - 7, -PILLAR_HEIGHT, 14, PILLAR_HEIGHT);

            ctx.shadowColor = '#4ff3ff';
            ctx.shadowBlur = 20 * pulse;
            ctx.strokeStyle = `rgba(79, 243, 255, ${0.65 * pulse + 0.25})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x, -PILLAR_HEIGHT + 12);
            ctx.lineTo(x, -8);
            ctx.stroke();

            ctx.fillStyle = `rgba(200, 252, 255, ${pulse})`;
            ctx.beginPath();
            ctx.arc(x, -PILLAR_HEIGHT, 9, 0, TAU);
            ctx.fill();
            ctx.restore();
        }
    }
}
