import { AudioUnavailableError } from '../errors/GameErrors.js';
import { decorateMethods, errorBoundary } from '../utils/decorators.js';

const MASTER_VOLUME = 0.5;

/**
 * Procedural sound effects via the Web Audio API. Browsers only allow audio after a
 * user gesture, so `unlock()` must be called from an input handler first; until then
 * every effect is a silent no-op.
 */
export class SoundFX {
    #ctx = null;
    #master = null;
    #noise = null;
    #muted;

    constructor({ muted = false } = {}) {
        this.#muted = muted;
    }

    get muted() {
        return this.#muted;
    }

    unlock() {
        if (!this.#ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) throw new AudioUnavailableError('Web Audio is not supported in this browser.');
            this.#ctx = new AudioContextClass();
            this.#master = this.#ctx.createGain();
            this.#master.gain.value = this.#muted ? 0 : MASTER_VOLUME;
            this.#master.connect(this.#ctx.destination);
            this.#noise = this.#createNoiseBuffer();
        }
        if (this.#ctx.state === 'suspended') this.#ctx.resume();
    }

    toggleMute() {
        this.#muted = !this.#muted;
        if (this.#master) this.#master.gain.setTargetAtTime(this.#muted ? 0 : MASTER_VOLUME, this.#ctx.currentTime, 0.02);
        return this.#muted;
    }

    hit(power) {
        if (!this.#ready) return;
        this.#tone({ type: 'sine', from: 170, to: 42, duration: 0.18 + power * 0.18, gain: 0.55 + power * 0.4 });
        this.#noiseBurst({ duration: 0.07 + power * 0.07, gain: 0.35 + power * 0.3, filter: 'bandpass', from: 2600, to: 800, q: 0.9 });
    }

    block() {
        if (!this.#ready) return;
        this.#tone({ type: 'square', from: 1400, to: 900, duration: 0.06, gain: 0.12 });
        this.#noiseBurst({ duration: 0.06, gain: 0.25, filter: 'highpass', from: 4200, to: 3000, q: 0.7 });
    }

    whoosh(heavy) {
        if (!this.#ready) return;
        this.#noiseBurst({ duration: heavy ? 0.22 : 0.13, gain: heavy ? 0.22 : 0.14, filter: 'bandpass', from: 350, to: 1900, q: 1.6 });
    }

    land(impact) {
        if (!this.#ready) return;
        this.#tone({ type: 'sine', from: 95, to: 40, duration: 0.12, gain: Math.min(0.45, impact / 2400) });
    }

    thud() {
        if (!this.#ready) return;
        this.#tone({ type: 'sine', from: 80, to: 32, duration: 0.35, gain: 0.6 });
        this.#noiseBurst({ duration: 0.2, gain: 0.25, filter: 'lowpass', from: 600, to: 120, q: 0.5 });
    }

    knockout() {
        if (!this.#ready) return;
        this.#tone({ type: 'sine', from: 120, to: 28, duration: 1.3, gain: 0.9 });
        this.#tone({ type: 'triangle', from: 60, to: 30, duration: 1.0, gain: 0.4 });
        this.#noiseBurst({ duration: 0.9, gain: 0.45, filter: 'lowpass', from: 1400, to: 90, q: 0.4 });
    }

    gong() {
        if (!this.#ready) return;
        [196, 294, 392, 587].forEach((frequency, i) => {
            this.#tone({ type: 'triangle', from: frequency, to: frequency * 0.985, duration: 1.6 - i * 0.2, gain: 0.22 / (i + 1) });
        });
    }

    charge() {
        if (!this.#ready) return;
        this.#tone({ type: 'sawtooth', from: 110, to: 880, duration: 0.42, gain: 0.12, attack: 0.3 });
        this.#noiseBurst({ duration: 0.4, gain: 0.12, filter: 'bandpass', from: 500, to: 4000, q: 2 });
    }

    tick() {
        if (!this.#ready) return;
        this.#tone({ type: 'square', from: 880, to: 880, duration: 0.05, gain: 0.06 });
    }

    get #ready() {
        return Boolean(this.#ctx) && this.#ctx.state === 'running' && !this.#muted;
    }

    #envelope(peak, duration, attack = 0.005) {
        const now = this.#ctx.currentTime;
        const gain = this.#ctx.createGain();
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        gain.connect(this.#master);
        return gain;
    }

    #tone({ type, from, to, duration, gain, attack }) {
        const now = this.#ctx.currentTime;
        const oscillator = this.#ctx.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(from, now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
        oscillator.connect(this.#envelope(gain, duration, attack));
        oscillator.start(now);
        oscillator.stop(now + duration + 0.05);
    }

    #noiseBurst({ duration, gain, filter, from, to, q }) {
        const now = this.#ctx.currentTime;
        const source = this.#ctx.createBufferSource();
        source.buffer = this.#noise;
        const biquad = this.#ctx.createBiquadFilter();
        biquad.type = filter;
        biquad.Q.value = q;
        biquad.frequency.setValueAtTime(from, now);
        biquad.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);
        source.connect(biquad);
        biquad.connect(this.#envelope(gain, duration));
        source.start(now, Math.random() * 0.5);
        source.stop(now + duration + 0.05);
    }

    #createNoiseBuffer() {
        const length = this.#ctx.sampleRate;
        const buffer = this.#ctx.createBuffer(1, length, this.#ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        return buffer;
    }
}

decorateMethods(SoundFX, Object.fromEntries(
    ['unlock', 'toggleMute', 'hit', 'block', 'whoosh', 'land', 'thud', 'knockout', 'gong', 'charge', 'tick']
        .map((name) => [name, errorBoundary()]),
));
