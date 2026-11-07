export const TAU = Math.PI * 2;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const deg = (degrees) => (degrees * Math.PI) / 180;

/** Frame-rate independent exponential approach toward `target`. */
export const damp = (current, target, rate, dt) => lerp(current, target, 1 - Math.exp(-rate * dt));

export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
export const easeInQuad = (t) => t * t;
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

export const randRange = (rng, min, max) => min + rng() * (max - min);
export const pick = (rng, items) => items[Math.floor(rng() * items.length)];

/** Picks from `[{ value, weight }]` proportionally to weight. */
export function weightedPick(rng, entries) {
    const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
    if (total <= 0) return entries[0]?.value;
    let roll = rng() * total;
    for (const entry of entries) {
        roll -= Math.max(0, entry.weight);
        if (roll <= 0) return entry.value;
    }
    return entries[entries.length - 1].value;
}

export function distanceToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSq = abx * abx + aby * aby;
    const t = lengthSq === 0 ? 0 : clamp(((px - ax) * abx + (py - ay) * aby) / lengthSq, 0, 1);
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}
