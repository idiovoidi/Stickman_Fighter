import { clamp } from '../../utils/math.js';

const LINKS = [
    ['head', 'neck'], ['neck', 'hip'], ['head', 'hip'],
    ['neck', 'elbowF'], ['elbowF', 'handF'], ['neck', 'elbowB'], ['elbowB', 'handB'],
    ['hip', 'kneeF'], ['kneeF', 'footF'], ['hip', 'kneeB'], ['kneeB', 'footB'],
];

const NOMINAL_DT = 1 / 60;
const ITERATIONS = 8;
const AIR_DAMPING = 0.995;
const BOUNCE = 0.28;
const FLOOR_FRICTION = 0.82;

/**
 * Time-corrected verlet ragdoll seeded from the skeleton at the moment of knockout.
 * Exposes `joints` in the same shape as Skeleton so painters can draw either.
 */
export class Ragdoll {
    constructor(sourceJoints, { vx, vy }, headRadius) {
        this.joints = {};
        const hipY = sourceJoints.hip.y;
        for (const [name, joint] of Object.entries(sourceJoints)) {
            const height = clamp((hipY - joint.y) / 90, -0.5, 1);
            const jx = vx * (1 + height * 0.5);
            const jy = vy * (1 + height * 0.2);
            this.joints[name] = {
                x: joint.x,
                y: joint.y,
                px: joint.x - jx * NOMINAL_DT,
                py: joint.y - jy * NOMINAL_DT,
                radius: name === 'head' ? headRadius : 4,
            };
        }
        this.links = LINKS.map(([a, b]) => {
            const ja = this.joints[a];
            const jb = this.joints[b];
            return { a: ja, b: jb, length: Math.hypot(jb.x - ja.x, jb.y - ja.y) };
        });
        this.lastDt = NOMINAL_DT;
    }

    update(dt, { physics, arena }) {
        if (dt <= 0) return;
        const ratio = dt / this.lastDt;
        this.lastDt = dt;
        const gravityStep = physics.gravity * dt * dt;
        const floor = arena.floorY;

        for (const p of Object.values(this.joints)) {
            const vx = (p.x - p.px) * ratio * AIR_DAMPING;
            const vy = (p.y - p.py) * ratio * AIR_DAMPING;
            p.px = p.x;
            p.py = p.y;
            p.x += vx;
            p.y += vy + gravityStep;

            if (p.y > floor - p.radius) {
                p.y = floor - p.radius;
                p.py = p.y + vy * BOUNCE;
                p.px = p.x - vx * FLOOR_FRICTION;
            }
        }

        const minX = arena.wallMargin * 0.5;
        const maxX = arena.width - arena.wallMargin * 0.5;
        for (let i = 0; i < ITERATIONS; i++) {
            for (const link of this.links) this.#satisfy(link);
            for (const p of Object.values(this.joints)) {
                p.y = Math.min(p.y, floor - p.radius);
                p.x = clamp(p.x, minX, maxX);
            }
        }
    }

    #satisfy({ a, b, length }) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.0001;
        const correction = ((distance - length) / distance) * 0.5;
        a.x += dx * correction;
        a.y += dy * correction;
        b.x -= dx * correction;
        b.y -= dy * correction;
    }
}
