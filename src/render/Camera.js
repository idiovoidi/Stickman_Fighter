import { clamp, damp } from '../utils/math.js';

/** Frames both fighters, zooming in as they close distance, with trauma-based screen shake. */
export class Camera {
    constructor({ config, arena }) {
        this.config = config;
        this.arena = arena;
        this.x = arena.width / 2;
        this.scale = 1;
        this.trauma = 0;
        this.shake = { x: 0, y: 0 };
        this.time = 0;
    }

    floorScreenY(view) {
        return view.height * this.config.floorScreenRatio + this.shake.y;
    }

    screenX(worldX, view) {
        return (worldX - this.x) * this.scale + view.width / 2 + this.shake.x;
    }

    addTrauma(amount) {
        this.trauma = Math.min(1, this.trauma + amount);
    }

    snap(fighters, view) {
        if (!fighters.length || !view.width) return;
        const target = this.#target(fighters, view);
        this.x = target.x;
        this.scale = target.scale;
        this.trauma = 0;
    }

    update(dt, fighters, view) {
        if (!fighters.length || !view.width) return;
        const target = this.#target(fighters, view);
        this.scale = damp(this.scale, target.scale, this.config.zoomRate, dt);
        this.x = damp(this.x, target.x, this.config.followRate, dt);

        this.time += dt;
        this.trauma = Math.max(0, this.trauma - dt * 1.8);
        const magnitude = this.trauma ** 2 * 22;
        this.shake.x = magnitude * (Math.sin(this.time * 71.3) + Math.sin(this.time * 37.9) * 0.5) / 1.5;
        this.shake.y = magnitude * (Math.sin(this.time * 63.1 + 1.7) + Math.sin(this.time * 29.3) * 0.5) / 1.5;
    }

    applyTo(ctx, view) {
        ctx.transform(this.scale, 0, 0, this.scale, view.width / 2 - this.x * this.scale + this.shake.x, this.floorScreenY(view));
    }

    #target(fighters, view) {
        const { referenceHeight, minZoom, maxZoom, framePadding } = this.config;
        const xs = fighters.map((fighter) => fighter.focusX());
        const min = Math.min(...xs);
        const max = Math.max(...xs);

        const base = view.height / referenceHeight;
        let scale = clamp(view.width / (max - min + framePadding), base * minZoom, base * maxZoom);
        scale = Math.max(scale, view.width / (this.arena.width + 300));

        const halfSpan = view.width / scale / 2;
        const lo = halfSpan - 150;
        const hi = this.arena.width - halfSpan + 150;
        const x = lo > hi ? this.arena.width / 2 : clamp((min + max) / 2, lo, hi);
        return { x, scale };
    }
}
