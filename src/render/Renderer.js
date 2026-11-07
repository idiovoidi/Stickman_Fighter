import { CanvasUnavailableError } from '../errors/GameErrors.js';

/** Composes the painters into a frame: sky → floor → reflections → world → screen effects. */
export class Renderer {
    constructor({ canvas, camera, backdrop, stage, fighterPainter, particles, floatingText, screenFx }) {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new CanvasUnavailableError('2D canvas rendering is not available in this browser.');
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = camera;
        this.backdrop = backdrop;
        this.stage = stage;
        this.fighterPainter = fighterPainter;
        this.particles = particles;
        this.floatingText = floatingText;
        this.screenFx = screenFx;
        this.view = { width: 0, height: 0, dpr: 1 };
        this.resize();
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;
        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
        this.view = { width, height, dpr };
        this.backdrop.resize(this.view, this.camera.floorScreenY(this.view));
    }

    update(dt, fighters) {
        this.particles.update(dt);
        this.floatingText.update(dt);
        this.fighterPainter.update(dt, fighters);
        this.screenFx.update(dt);
    }

    clearEffects() {
        this.particles.clear();
        this.floatingText.clear();
    }

    render({ fighters, debug = false }) {
        const { ctx, view, camera } = this;
        const time = performance.now() / 1000;
        ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);

        this.backdrop.draw(ctx, view, camera, time);
        this.stage.drawFloor(ctx, view, camera);
        this.#inWorld(() => this.fighterPainter.drawReflections(ctx, fighters));
        this.stage.drawFloorOverlay(ctx, view, camera);
        this.screenFx.drawDim(ctx, view);

        this.#inWorld(() => {
            this.stage.drawProps(ctx, time);
            this.fighterPainter.drawShadows(ctx, fighters);
            this.fighterPainter.draw(ctx, fighters);
            this.particles.draw(ctx);
            this.floatingText.draw(ctx);
            if (debug) this.fighterPainter.drawDebug(ctx, fighters);
        });

        this.screenFx.drawOverlay(ctx, view);
    }

    #inWorld(draw) {
        this.ctx.save();
        this.camera.applyTo(this.ctx, this.view);
        draw();
        this.ctx.restore();
    }
}
