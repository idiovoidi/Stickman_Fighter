import { withErrorBoundary } from './decorators.js';

/** Minimal pub/sub. Each listener runs inside its own error boundary so one failure can't block the rest. */
export class EventBus {
    #listeners = new Map();

    on(type, handler) {
        const guarded = withErrorBoundary(handler, { label: `event:${type}` });
        if (!this.#listeners.has(type)) this.#listeners.set(type, new Set());
        this.#listeners.get(type).add(guarded);
        return () => this.#listeners.get(type)?.delete(guarded);
    }

    emit(type, payload) {
        const listeners = this.#listeners.get(type);
        if (!listeners) return;
        for (const listener of listeners) listener(payload);
    }
}
