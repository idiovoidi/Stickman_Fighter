/** Full-screen passes: background dim (super moves), white/colour flash and a vignette. */
export class ScreenEffects {
    constructor() {
        this.flashAlpha = 0;
        this.flashColor = '255, 255, 255';
        this.dim = 0;
        this.dimHold = 0;
        this.vignette = null;
        this.vignetteKey = '';
    }

    flash(alpha = 0.3, color = '255, 255, 255') {
        if (alpha >= this.flashAlpha) this.flashColor = color;
        this.flashAlpha = Math.max(this.flashAlpha, alpha);
    }

    dimFor(amount, duration) {
        this.dim = Math.max(this.dim, amount);
        this.dimHold = Math.max(this.dimHold, duration);
    }

    update(dt) {
        this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.6);
        if (this.dimHold > 0) this.dimHold -= dt;
        else this.dim = Math.max(0, this.dim - dt * 2);
    }

    drawDim(ctx, view) {
        if (this.dim <= 0) return;
        ctx.fillStyle = `rgba(4, 2, 10, ${this.dim})`;
        ctx.fillRect(0, 0, view.width, view.height);
    }

    drawOverlay(ctx, view) {
        const key = `${view.width}x${view.height}`;
        if (key !== this.vignetteKey) {
            const radius = Math.hypot(view.width, view.height) / 2;
            this.vignette = ctx.createRadialGradient(view.width / 2, view.height / 2, radius * 0.45, view.width / 2, view.height / 2, radius);
            this.vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
            this.vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
            this.vignetteKey = key;
        }
        ctx.fillStyle = this.vignette;
        ctx.fillRect(0, 0, view.width, view.height);

        if (this.flashAlpha > 0) {
            ctx.fillStyle = `rgba(${this.flashColor}, ${this.flashAlpha})`;
            ctx.fillRect(0, 0, view.width, view.height);
        }
    }
}
