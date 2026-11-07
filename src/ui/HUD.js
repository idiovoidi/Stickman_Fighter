import { requireElement } from '../utils/dom.js';
import { decorateMethods, errorBoundary } from '../utils/decorators.js';

const TAGS = {
    auto: ['CPU', 'CPU'],
    pvai: ['P1', 'CPU'],
    pvp: ['P1', 'P2'],
};

/** Health/stamina/super bars, round pips, timer. Writes to the DOM only when values change. */
export class HUD {
    constructor({ root }) {
        this.root = root;
        this.timer = requireElement('.hud-timer', root);
        this.roundLabel = requireElement('.hud-round', root);
        this.sides = [0, 1].map((side) => {
            const el = requireElement(`[data-side="${side}"]`, root);
            return {
                el,
                tag: requireElement('.hud-tag', el),
                name: requireElement('.hud-name', el),
                title: requireElement('.hud-title', el),
                healthBar: requireElement('.health', el),
                health: requireElement('.health .bar-fill', el),
                ghost: requireElement('.health .bar-ghost', el),
                staminaBar: requireElement('.stamina', el),
                stamina: requireElement('.stamina .bar-fill', el),
                meter: requireElement('.meter .bar-fill', el),
                meterReady: requireElement('.meter-ready', el),
                pips: [...el.querySelectorAll('.pip')],
                cache: {},
            };
        });
        this.cache = {};
    }

    setVisible(visible) {
        this.root.classList.toggle('is-hidden', !visible);
    }

    bind(fighters, mode) {
        fighters.forEach((fighter, side) => {
            const ui = this.sides[side];
            ui.el.style.setProperty('--fighter', fighter.profile.color);
            ui.el.style.setProperty('--accent', fighter.profile.accent);
            ui.tag.textContent = (TAGS[mode] ?? TAGS.auto)[side];
            ui.name.textContent = fighter.name;
            ui.title.textContent = fighter.profile.title;
            ui.cache = {};
        });
        this.cache = {};
    }

    update(fighters, director) {
        fighters.forEach((fighter, side) => {
            const ui = this.sides[side];
            const { vitals } = fighter;
            const health = vitals.healthRatio;
            const stamina = vitals.stamina / vitals.maxStamina;
            const meter = vitals.meter / vitals.maxMeter;

            this.#scale(ui, 'health', ui.health, health);
            this.#scale(ui, 'ghost', ui.ghost, health);
            this.#scale(ui, 'stamina', ui.stamina, stamina);
            this.#scale(ui, 'meter', ui.meter, meter);
            this.#toggle(ui, 'low', ui.healthBar, health < 0.25);
            this.#toggle(ui, 'tired', ui.staminaBar, stamina < 0.2);
            this.#toggle(ui, 'ready', ui.meterReady, vitals.meterFull);
            ui.pips.forEach((pip, index) => this.#toggle(ui, `pip${index}`, pip, director.wins[side] > index));
        });

        const seconds = Math.ceil(director.clock);
        if (this.cache.seconds !== seconds) {
            this.cache.seconds = seconds;
            this.timer.textContent = String(seconds);
            this.timer.classList.toggle('urgent', seconds <= 10 && director.phase === 'fight');
        }
        const label = director.isFinalRound ? 'FINAL ROUND' : `ROUND ${director.round}`;
        const roundText = director.matchNumber > 1 ? `${label} · MATCH ${director.matchNumber}` : label;
        if (this.cache.roundText !== roundText) {
            this.cache.roundText = roundText;
            this.roundLabel.textContent = roundText;
        }
    }

    #scale(ui, key, element, value) {
        const rounded = Math.round(value * 1000) / 1000;
        if (ui.cache[key] === rounded) return;
        ui.cache[key] = rounded;
        element.style.transform = `scaleX(${rounded})`;
    }

    #toggle(ui, key, element, on) {
        if (ui.cache[key] === on) return;
        ui.cache[key] = on;
        element.classList.toggle('on', on);
    }
}

decorateMethods(HUD, { update: errorBoundary() });
