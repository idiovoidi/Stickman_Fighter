/**
 * Universal error-checking decorators.
 *
 * Function wrappers (`withX`) can be applied to any function. The lowercase
 * factories (`errorBoundary`, `circuitBreaker`, `validateArgs`) produce method
 * decorators for `decorateMethods`, which applies them to a class prototype.
 */

import { ConfigurationError, ValidationError } from '../errors/GameErrors.js';

const reportedFailures = new Set();

/** Logs an error once per unique label/message pair so per-frame failures don't flood the console. */
export function reportError(label, error) {
    const key = `${label}::${error?.name}::${error?.message}`;
    if (reportedFailures.has(key)) return;
    reportedFailures.add(key);
    console.error(`[${label}]`, error);
}

/**
 * Catches anything `fn` throws and returns `fallback` instead (a fallback function
 * receives the error and original arguments). Error classes listed in `rethrow` propagate.
 */
export function withErrorBoundary(fn, { label = fn.name || 'anonymous', fallback, rethrow = [], onError } = {}) {
    return function errorBoundary(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            if (rethrow.some((ErrorType) => error instanceof ErrorType)) throw error;
            reportError(label, error);
            onError?.(error);
            return typeof fallback === 'function' ? fallback(error, ...args) : fallback;
        }
    };
}

/** Stops invoking `fn` after `maxFailures` consecutive errors, then calls `onTrip` once. */
export function withCircuitBreaker(fn, { label = fn.name || 'anonymous', maxFailures = 5, onTrip } = {}) {
    let consecutiveFailures = 0;
    let tripped = false;

    return function circuitBreaker(...args) {
        if (tripped) return undefined;
        try {
            const result = fn.apply(this, args);
            consecutiveFailures = 0;
            return result;
        } catch (error) {
            consecutiveFailures += 1;
            reportError(label, error);
            if (consecutiveFailures >= maxFailures) {
                tripped = true;
                onTrip?.(error);
            }
            return undefined;
        }
    };
}

/**
 * Runs `validator(...args)` before `fn`. The validator returns a problem description
 * (string) or a falsy value when the arguments are acceptable.
 */
export function withValidation(fn, validator, { label = fn.name || 'anonymous', ErrorType = ValidationError } = {}) {
    return function validated(...args) {
        const problem = validator.apply(this, args);
        if (problem) throw new ErrorType(`${label}: ${problem}`, { args });
        return fn.apply(this, args);
    };
}

export const errorBoundary = (options = {}) => (fn, label) => withErrorBoundary(fn, { label, ...options });
export const circuitBreaker = (options = {}) => (fn, label) => withCircuitBreaker(fn, { label, ...options });
export const validateArgs = (validator, options = {}) => (fn, label) => withValidation(fn, validator, { label, ...options });

/**
 * Wraps prototype methods in place: `decorateMethods(Foo, { bar: [errorBoundary()] })`.
 * Decorators apply left to right, so the last one listed is the outermost.
 */
export function decorateMethods(Target, decorations) {
    for (const [name, decorators] of Object.entries(decorations)) {
        const original = Target.prototype[name];
        if (typeof original !== 'function') {
            throw new ConfigurationError(`Cannot decorate ${Target.name}.${name}: not a method`);
        }
        const label = `${Target.name}.${name}`;
        Target.prototype[name] = [].concat(decorators).reduce((wrapped, decorate) => decorate(wrapped, label), original);
    }
    return Target;
}
