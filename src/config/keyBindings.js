export const KEY_BINDINGS = Object.freeze({
    p1: Object.freeze({
        left: ['KeyA'],
        right: ['KeyD'],
        jump: ['KeyW'],
        block: ['KeyS'],
        punch: ['KeyJ'],
        kick: ['KeyK'],
        sweep: ['KeyL'],
        super: ['KeyU'],
        dash: ['ShiftLeft'],
    }),
    p2: Object.freeze({
        left: ['ArrowLeft'],
        right: ['ArrowRight'],
        jump: ['ArrowUp'],
        block: ['ArrowDown'],
        punch: ['Numpad1', 'Comma'],
        kick: ['Numpad2', 'Period'],
        sweep: ['Numpad3', 'Slash'],
        super: ['Numpad5', 'Semicolon'],
        dash: ['ShiftRight', 'Numpad0'],
    }),
});

/** Combines binding sets so a solo player can use either side of the keyboard. */
export function mergeBindings(...sets) {
    const merged = {};
    for (const set of sets) {
        for (const [action, codes] of Object.entries(set)) {
            merged[action] = [...(merged[action] ?? []), ...codes];
        }
    }
    return merged;
}

export function allBoundCodes() {
    return Object.values(KEY_BINDINGS).flatMap((set) => Object.values(set).flat());
}
