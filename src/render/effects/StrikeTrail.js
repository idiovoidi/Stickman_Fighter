import { rgba } from '../../utils/color.js';

const MAX_AGE = 0.14;

/** Fading arc that follows the striking limb while an attack is coming out. */
export class StrikeTrail {
    constructor() {
        this.points = [];
    }

    update(dt, fighter) {
        for (const point of this.points) point.age += dt;
        this.points = this.points.filter((point) => point.age < MAX_AGE);

        const attack = fighter.attack;
        if (fighter.state !== 'attack' || !attack || attack.phase === 'recovery') return;
        if (attack.elapsed < attack.move.startup * 0.5) return;
        const hit = fighter.hitPoint();
        this.points.push({ x: hit.x, y: hit.y, age: 0, heavy: attack.move.heavy });
    }

    draw(ctx, color) {
        if (this.points.length < 2) return;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (let i = 1; i < this.points.length; i++) {
            const a = this.points[i - 1];
            const b = this.points[i];
            const life = 1 - b.age / MAX_AGE;
            ctx.strokeStyle = rgba(color, life * 0.55);
            ctx.lineWidth = (b.heavy ? 14 : 9) * life;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
        ctx.restore();
    }
}
