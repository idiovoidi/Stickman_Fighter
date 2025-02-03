import { Tween } from './Tween.js';

/**
 * @class AnimationController
 * @description Manages and controls animations using tweens
 */
export class AnimationController {
    /**
     * @constructor
     */
    constructor() {
        /** @type {Map<string, Tween>} */
        this.animations = new Map();
    }

    createAnimation(name, options) {
        const tween = new Tween(options);
        this.animations.set(name, tween);
        return tween;
    }

    /**
     * @method playAnimation
     * @description Plays an animation by name with optional configuration
     * @param {string} name - Name of the animation to play
     * @param {Object} [options] - Animation options
     * @param {number} [options.duration] - Duration in milliseconds
     * @param {Function} [options.easing] - Easing function
     * @param {Function} [options.onUpdate] - Update callback
     * @param {Function} [options.onComplete] - Completion callback
     * @returns {Tween} The playing animation tween
     * @public
     */
    playAnimation(name, options = {}) {
        let tween = this.animations.get(name);
        
        if (!tween) {
            tween = this.createAnimation(name, options);
        } else if (options) {
            // Update existing tween with new options
            Object.assign(tween, {
                startValue: options.start ?? tween.startValue,
                endValue: options.end ?? tween.endValue,
                duration: options.duration ?? tween.duration,
                easing: options.easing ?? tween.easing,
                onUpdate: options.onUpdate ?? tween.onUpdate,
                onComplete: options.onComplete ?? tween.onComplete
            });
        }

        tween.start();
        return tween;
    }

    stopAnimation(name) {
        const tween = this.animations.get(name);
        if (tween) {
            tween.stop();
        }
    }

    stopAll() {
        this.animations.forEach(tween => tween.stop());
    }
} 