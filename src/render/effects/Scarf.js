const SEGMENTS = 9;
const SEGMENT_LENGTH = 7;
const GRAVITY = 700;
const DAMPING = 0.9;
const NOMINAL_DT = 1 / 60;

/** Headband tail: a short verlet chain pinned behind the head that trails and flutters. */
export class Scarf {
    constructor() {
        this.points = [];
        this.clock = 0;
        this.lastDt = NOMINAL_DT;
    }

    update(dt, fighter) {
        if (dt <= 0) return;
        const head = fighter.joints().head;
        const facing = fighter.body.facing;
        const anchor = { x: head.x - facing * 10, y: head.y - 2 };

        if (!this.points.length) {
            this.points = Array.from({ length: SEGMENTS }, (_, i) => {
                const x = anchor.x - facing * i * SEGMENT_LENGTH;
                return { x, y: anchor.y + i * 2, px: x, py: anchor.y + i * 2 };
            });
        }

        this.clock += dt;
        const ratio = dt / this.lastDt;
        this.lastDt = dt;
        const dt2 = dt * dt;

        const [root] = this.points;
        root.x = anchor.x;
        root.y = anchor.y;
        root.px = anchor.x;
        root.py = anchor.y;

        for (let i = 1; i < this.points.length; i++) {
            const p = this.points[i];
            const wind = -facing * 420 + Math.sin(this.clock * 9 + i * 0.8) * 260;
            const vx = (p.x - p.px) * ratio * DAMPING;
            const vy = (p.y - p.py) * ratio * DAMPING;
            p.px = p.x;
            p.py = p.y;
            p.x += vx + wind * dt2;
            p.y += vy + (GRAVITY + Math.cos(this.clock * 7 + i) * 220) * dt2;
        }

        for (let iteration = 0; iteration < 3; iteration++) {
            for (let i = 1; i < this.points.length; i++) {
                const a = this.points[i - 1];
                const b = this.points[i];
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const distance = Math.hypot(dx, dy) || 0.0001;
                const correction = (distance - SEGMENT_LENGTH) / distance;
                if (i === 1) {
                    b.x -= dx * correction;
                    b.y -= dy * correction;
                } else {
                    a.x += dx * correction * 0.5;
                    a.y += dy * correction * 0.5;
                    b.x -= dx * correction * 0.5;
                    b.y -= dy * correction * 0.5;
                }
            }
        }
    }

    draw(ctx, color) {
        if (this.points.length < 2) return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        for (let i = 1; i < this.points.length; i++) {
            const a = this.points[i - 1];
            const b = this.points[i];
            ctx.lineWidth = 5 - (i / this.points.length) * 3.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}
