import { HURT_SEGMENTS } from '../combat/HitResolver.js';
import { mix, rgba } from '../utils/color.js';
import { TAU, clamp } from '../utils/math.js';
import { Scarf } from './effects/Scarf.js';
import { StrikeTrail } from './effects/StrikeTrail.js';

const LIMB_WIDTH = 7;
const TORSO_WIDTH = 8.5;

/** Draws stick figures (with glow, scarf, strike trails, shadows and floor reflections). */
export class FighterPainter {
    #visuals = new WeakMap();

    update(dt, fighters) {
        for (const fighter of fighters) {
            const visuals = this.#visualsFor(fighter);
            visuals.scarf.update(dt, fighter);
            visuals.trail.update(dt, fighter);
        }
    }

    drawShadows(ctx, fighters) {
        for (const fighter of fighters) {
            const joints = fighter.joints();
            const lift = Math.max(0, -Math.max(joints.footF.y, joints.footB.y, joints.hip.y));
            const strength = clamp(1 - lift / 380, 0.3, 1);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * strength})`;
            ctx.beginPath();
            ctx.ellipse(joints.hip.x, 3, 48 * strength, 8 * strength, 0, 0, TAU);
            ctx.fill();
        }
    }

    drawReflections(ctx, fighters) {
        ctx.save();
        ctx.scale(1, -1);
        ctx.globalAlpha = 0.2;
        for (const fighter of fighters) this.#drawFigure(ctx, fighter, { reflection: true });
        ctx.restore();
    }

    draw(ctx, fighters) {
        for (const fighter of fighters) {
            const visuals = this.#visualsFor(fighter);
            visuals.trail.draw(ctx, fighter.profile.accent);
            this.#drawFigure(ctx, fighter, { reflection: false });
        }
    }

    drawDebug(ctx, fighters) {
        ctx.save();
        ctx.lineWidth = 1;
        for (const fighter of fighters) {
            const joints = fighter.joints();
            ctx.strokeStyle = 'rgba(80, 255, 160, 0.8)';
            for (const [a, b] of HURT_SEGMENTS) {
                ctx.beginPath();
                ctx.moveTo(joints[a].x, joints[a].y);
                ctx.lineTo(joints[b].x, joints[b].y);
                ctx.stroke();
            }
            const point = fighter.hitPoint();
            if (point) {
                ctx.strokeStyle = fighter.attack.phase === 'active' ? '#ff3355' : 'rgba(255, 200, 80, 0.7)';
                ctx.beginPath();
                ctx.arc(point.x, point.y, fighter.attack.move.radius, 0, TAU);
                ctx.stroke();
            }
            ctx.fillStyle = '#ffffff';
            ctx.font = '600 13px ui-monospace, monospace';
            ctx.textAlign = 'center';
            const label = [fighter.state, fighter.debugLabel].filter(Boolean).join(' · ');
            ctx.fillText(label, joints.head.x, joints.head.y - 30);
        }
        ctx.restore();
    }

    #visualsFor(fighter) {
        let visuals = this.#visuals.get(fighter);
        if (!visuals) {
            visuals = {
                scarf: new Scarf(),
                trail: new StrikeTrail(),
                backColor: mix(fighter.profile.color, '#000000', 0.38),
            };
            this.#visuals.set(fighter, visuals);
        }
        return visuals;
    }

    #drawFigure(ctx, fighter, { reflection }) {
        const visuals = this.#visualsFor(fighter);
        const j = fighter.joints();
        const { color, accent } = fighter.profile;
        const flashing = fighter.flashTimer > 0;
        const main = flashing ? '#ffffff' : color;
        const back = flashing ? '#ffe3ef' : visuals.backColor;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (!reflection) {
            const charged = fighter.vitals.meterFull;
            ctx.shadowColor = charged ? accent : color;
            ctx.shadowBlur = charged ? 20 + 8 * Math.sin(performance.now() / 120) : 12;
        }

        ctx.strokeStyle = back;
        ctx.lineWidth = LIMB_WIDTH;
        ctx.beginPath();
        this.#chain(ctx, j.neck, j.elbowB, j.handB);
        this.#chain(ctx, j.hip, j.kneeB, j.footB);
        ctx.stroke();

        if (!reflection) visuals.scarf.draw(ctx, accent);

        ctx.strokeStyle = main;
        ctx.lineWidth = TORSO_WIDTH;
        ctx.beginPath();
        this.#chain(ctx, j.hip, j.neck);
        ctx.stroke();

        ctx.lineWidth = LIMB_WIDTH;
        ctx.beginPath();
        this.#chain(ctx, j.hip, j.kneeF, j.footF);
        this.#chain(ctx, j.neck, j.elbowF, j.handF);
        ctx.stroke();

        const headRadius = fighter.skeleton.bones.headRadius;
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.arc(j.head.x, j.head.y, headRadius, 0, TAU);
        ctx.fill();

        ctx.shadowBlur = 0;
        this.#drawHeadband(ctx, fighter, j, headRadius, flashing ? '#ffffff' : accent);

        if (!reflection && fighter.attack?.move.meterCost && fighter.attack.phase !== 'recovery') {
            const hand = j.handB;
            const glow = ctx.createRadialGradient(hand.x, hand.y, 2, hand.x, hand.y, 34);
            glow.addColorStop(0, rgba('#ffffff', 0.95));
            glow.addColorStop(0.35, rgba(accent, 0.7));
            glow.addColorStop(1, rgba(accent, 0));
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(hand.x, hand.y, 34, 0, TAU);
            ctx.fill();
        }
        ctx.restore();
    }

    #drawHeadband(ctx, fighter, j, radius, color) {
        const angle = Math.atan2(j.head.y - j.neck.y, j.head.x - j.neck.x) + Math.PI / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(j.head.x - cos * radius * 0.98, j.head.y - sin * radius * 0.98);
        ctx.lineTo(j.head.x + cos * radius * 0.98, j.head.y + sin * radius * 0.98);
        ctx.stroke();

        const facing = fighter.body.facing;
        ctx.fillStyle = '#0b0816';
        ctx.beginPath();
        ctx.arc(j.head.x + facing * radius * 0.45, j.head.y - radius * 0.38, 2.1, 0, TAU);
        ctx.fill();
    }

    #chain(ctx, first, ...rest) {
        ctx.moveTo(first.x, first.y);
        for (const point of rest) ctx.lineTo(point.x, point.y);
    }
}
