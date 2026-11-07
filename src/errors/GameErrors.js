/**
 * Exception hierarchy for the game. Catch a branch (e.g. InitializationError)
 * to handle every failure beneath it.
 *
 * GameError
 * ├── ConfigurationError
 * │   ├── UnknownMoveError
 * │   └── InvalidProfileError
 * ├── InitializationError
 * │   ├── DomElementMissingError
 * │   └── CanvasUnavailableError
 * ├── ValidationError
 * ├── StateError
 * │   └── InvalidTransitionError
 * ├── RuntimeLoopError
 * └── AudioError
 *     └── AudioUnavailableError
 */

export class GameError extends Error {
    constructor(message, context = {}) {
        super(message, context.cause ? { cause: context.cause } : undefined);
        this.name = new.target.name;
        this.context = context;
    }
}

export class ConfigurationError extends GameError {}
export class UnknownMoveError extends ConfigurationError {}
export class InvalidProfileError extends ConfigurationError {}

export class InitializationError extends GameError {}
export class DomElementMissingError extends InitializationError {}
export class CanvasUnavailableError extends InitializationError {}

export class ValidationError extends GameError {}

export class StateError extends GameError {}
export class InvalidTransitionError extends StateError {}

export class RuntimeLoopError extends GameError {}

export class AudioError extends GameError {}
export class AudioUnavailableError extends AudioError {}
