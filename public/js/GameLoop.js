export class GameLoop {
    constructor(options = {}) {
        this.fps = options.fps || 60;
        this.timestep = 1000 / this.fps;
        this.maxFrameSkip = options.maxFrameSkip || 10;
        this.lastTime = 0;
        this.accumulator = 0;
        this.running = false;
        this.updateFn = () => {};
        this.renderFn = () => {};
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    stop() {
        this.running = false;
    }

    setUpdateFunction(fn) {
        this.updateFn = fn;
    }

    setRenderFunction(fn) {
        this.renderFn = fn;
    }

    loop(currentTime) {
        if (!this.running) return;

        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Prevent spiral of death
        if (deltaTime > 1000) {
            deltaTime = this.timestep;
        }

        this.accumulator += deltaTime;
        let frameCount = 0;

        // Update game state at fixed timestep intervals
        while (this.accumulator >= this.timestep && frameCount < this.maxFrameSkip) {
            this.updateFn(this.timestep / 1000); // Convert to seconds for physics
            this.accumulator -= this.timestep;
            frameCount++;
        }

        // Calculate interpolation for smooth rendering
        const alpha = this.accumulator / this.timestep;
        this.renderFn(alpha);

        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }
} 