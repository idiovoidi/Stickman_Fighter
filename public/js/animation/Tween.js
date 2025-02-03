export class Tween {
    constructor(options = {}) {
        this.startValue = options.start || 0;
        this.endValue = options.end || 1;
        this.duration = options.duration || 1000;
        this.easing = options.easing || Tween.Easing.easeOutQuad;
        this.onUpdate = options.onUpdate || (() => {});
        this.onComplete = options.onComplete || (() => {});
        
        this.startTime = null;
        this.isPlaying = false;
    }

    start() {
        this.startTime = performance.now();
        this.isPlaying = true;
        this.update();
        return this;
    }

    stop() {
        this.isPlaying = false;
        return this;
    }

    update() {
        if (!this.isPlaying) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        if (progress < 1) {
            const easedProgress = this.easing(progress);
            const currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;
            this.onUpdate(currentValue, easedProgress);
            requestAnimationFrame(() => this.update());
        } else {
            this.onUpdate(this.endValue, 1);
            this.onComplete();
            this.stop();
        }
    }

    static Easing = {
        linear: t => t,
        
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        
        easeInElastic: t => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
        },
        
        easeOutElastic: t => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }
    };
} 