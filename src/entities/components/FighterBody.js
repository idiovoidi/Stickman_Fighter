import { clamp } from '../../utils/math.js';

/** Kinematic body: `x, y` is the fighter's lowest point (feet when standing). */
export class FighterBody {
    constructor() {
        this.place(0, 0, 1);
    }

    place(x, y, facing) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.facing = facing;
        this.grounded = true;
    }

    steer(dt, targetVx, rate) {
        this.vx += (targetVx - this.vx) * (1 - Math.exp(-rate * dt));
    }

    brake(dt, rate) {
        this.vx *= Math.exp(-rate * dt);
    }

    launch(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.grounded = false;
    }

    /** Advances position; returns `{ impact }` on the step the body touches down, otherwise null. */
    integrate(dt, { physics, arena }) {
        let landing = null;
        if (!this.grounded) {
            this.vy = Math.min(this.vy + physics.gravity * dt, physics.maxFallSpeed);
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (!this.grounded && this.y >= arena.floorY && this.vy >= 0) {
            landing = { impact: this.vy };
            this.y = arena.floorY;
            this.vy = 0;
            this.grounded = true;
        }

        const minX = arena.wallMargin;
        const maxX = arena.width - arena.wallMargin;
        const clamped = clamp(this.x, minX, maxX);
        if (clamped !== this.x) {
            this.x = clamped;
            this.vx = 0;
        }
        return landing;
    }
}
