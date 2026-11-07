import { clamp } from './math.js';

const cache = new Map();

export function hexToRgb(hex) {
    if (cache.has(hex)) return cache.get(hex);
    const value = hex.replace('#', '');
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
    const rgb = {
        r: parseInt(full.slice(0, 2), 16),
        g: parseInt(full.slice(2, 4), 16),
        b: parseInt(full.slice(4, 6), 16),
    };
    cache.set(hex, rgb);
    return rgb;
}

export function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

/** Mixes `hex` toward `targetHex` by `t` (0..1) and returns a hex string. */
export function mix(hex, targetHex, t) {
    const a = hexToRgb(hex);
    const b = hexToRgb(targetHex);
    const channel = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
    return `#${channel(a.r, b.r)}${channel(a.g, b.g)}${channel(a.b, b.b)}`;
}
