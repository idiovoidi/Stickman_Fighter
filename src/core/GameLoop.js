import { RuntimeLoopError } from '../errors/GameErrors.js';
import { withCircuitBreaker } from '../utils/decorators.js';

/**
 * Fixed-timestep loop. `timeScale` speeds simulation up (spectator fast-forward)
 * without changing the step size, so physics stays stable.
 */
export class GameLoop {
    #running = false;
    #lastTime = 0;
    #accumulator = 0;
    #frameHandle = 0;
    #frame;

    constructor({ update, render, fixedStep, maxFrameTime, maxStepsPerFrame, onFatal }) {
        this.update = update;
        this.render = render;
        this.fixedStep = fixedStep;
        this.maxFrameTime = maxFrameTime;
        this.maxStepsPerFrame = maxStepsPerFrame;
        this.timeScale = 1;

        this.#frame = withCircuitBreaker((now) => this.#advance(now), {
            label: 'GameLoop.frame',
            maxFailures: 10,
            onTrip: (error) => {
                this.stop();
                onFatal?.(new RuntimeLoopError('The game loop stopped after repeated errors.', { cause: error }));
            },
        });
    }

    start() {
        if (this.#running) return;
        this.#running = true;
        this.#lastTime = performance.now();
        this.#accumulator = 0;
        this.#frameHandle = requestAnimationFrame(this.#onFrame);
    }

    stop() {
        this.#running = false;
        cancelAnimationFrame(this.#frameHandle);
    }

    #onFrame = (now) => {
        if (!this.#running) return;
        this.#frame(now);
        if (this.#running) this.#frameHandle = requestAnimationFrame(this.#onFrame);
    };

    #advance(now) {
        const frameTime = Math.min((now - this.#lastTime) / 1000, this.maxFrameTime);
        this.#lastTime = now;
        this.#accumulator += frameTime * this.timeScale;

        let steps = 0;
        while (this.#accumulator >= this.fixedStep && steps < this.maxStepsPerFrame) {
            this.update(this.fixedStep);
            this.#accumulator -= this.fixedStep;
            steps += 1;
        }
        if (steps === this.maxStepsPerFrame) this.#accumulator = 0;
        this.render();
    }
}
