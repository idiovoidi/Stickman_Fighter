const PRESS_LIFETIME_MS = 200;

/**
 * Keyboard state: held keys, short-lived presses (consumed by controllers) and
 * global hotkeys. Presses expire so a key tapped in a menu can't fire later in a fight.
 */
export class InputManager {
    #held = new Set();
    #presses = new Map();
    #hotkeys = new Map();
    #gameKeys = new Set();

    attach(target = window) {
        target.addEventListener('keydown', (event) => this.#onKeyDown(event));
        target.addEventListener('keyup', (event) => this.#held.delete(event.code));
        target.addEventListener('blur', () => {
            this.#held.clear();
            this.#presses.clear();
        });
    }

    registerGameKeys(codes) {
        codes.forEach((code) => this.#gameKeys.add(code));
    }

    onHotkey(codes, handler) {
        [].concat(codes).forEach((code) => this.#hotkeys.set(code, handler));
    }

    isHeld(codes) {
        return codes.some((code) => this.#held.has(code));
    }

    axis(negativeCodes, positiveCodes) {
        return (this.isHeld(positiveCodes) ? 1 : 0) - (this.isHeld(negativeCodes) ? 1 : 0);
    }

    /** Returns true (once) if any of `codes` was pressed within the press lifetime. */
    consume(codes) {
        const now = performance.now();
        for (const code of codes) {
            const pressedAt = this.#presses.get(code);
            if (pressedAt === undefined) continue;
            this.#presses.delete(code);
            if (now - pressedAt <= PRESS_LIFETIME_MS) return true;
        }
        return false;
    }

    clearPresses() {
        this.#presses.clear();
    }

    #onKeyDown(event) {
        if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea')) return;
        if (this.#gameKeys.has(event.code)) event.preventDefault();
        if (event.repeat) return;

        this.#held.add(event.code);
        this.#presses.set(event.code, performance.now());
        this.#hotkeys.get(event.code)?.(event);
    }
}
