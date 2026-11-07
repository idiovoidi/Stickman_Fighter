import { requireElement } from '../utils/dom.js';

const STICK_ICON = `
<svg viewBox="0 0 32 40" aria-hidden="true">
  <circle cx="16" cy="7" r="5"/>
  <path d="M16 12 L16 25 M16 15 L8 21 M16 15 L25 12 M16 25 L10 37 M16 25 L23 37"/>
</svg>`;

/**
 * Title, pause and results screens. All behaviour is delegated to injected handlers
 * (start, resume, restart, rematch, exit); this class only manages DOM and settings.
 */
export class MenuController {
    constructor({ screens, roster, difficulties, settings, handlers }) {
        this.screens = screens;
        this.settings = settings;
        this.handlers = handlers;
        this.current = null;

        this.#buildDifficulty(difficulties);
        this.#buildRoster(roster);
        this.#bindSettings();
        this.#bindActions();
        this.#syncSelections();
    }

    get isOpen() {
        return this.current !== null;
    }

    show(name) {
        for (const [key, screen] of Object.entries(this.screens)) screen.classList.toggle('hidden', key !== name);
        this.current = name;
        const primary = this.screens[name]?.querySelector('.btn-primary');
        primary?.focus({ preventScroll: true });
    }

    hide() {
        Object.values(this.screens).forEach((screen) => screen.classList.add('hidden'));
        this.current = null;
    }

    showResults({ title, subtitle, color }) {
        const screen = this.screens.results;
        const heading = requireElement('.results-winner', screen);
        heading.textContent = title;
        heading.style.setProperty('--tone', color ?? '#ffffff');
        requireElement('.results-score', screen).textContent = subtitle;
        this.show('results');
    }

    #buildDifficulty(difficulties) {
        const host = requireElement('[data-setting="difficulty"]', this.screens.menu);
        host.replaceChildren(...Object.entries(difficulties).map(([id, preset]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.value = id;
            button.textContent = preset.label;
            return button;
        }));
    }

    #buildRoster(roster) {
        this.screens.menu.querySelectorAll('.roster').forEach((host) => {
            const random = document.createElement('button');
            random.type = 'button';
            random.dataset.value = 'random';
            random.className = 'roster-random';
            random.title = 'Random fighter';
            random.textContent = '?';

            const fighters = roster.map((profile) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.dataset.value = profile.id;
                button.title = `${profile.name} — ${profile.title}`;
                button.style.setProperty('--swatch', profile.color);
                button.innerHTML = STICK_ICON;
                return button;
            });
            host.replaceChildren(random, ...fighters);
        });
    }

    #bindSettings() {
        this.screens.menu.querySelectorAll('[data-setting]').forEach((group) => {
            group.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-value]');
                if (!button) return;
                this.settings.set(group.dataset.setting, button.dataset.value);
                this.#syncSelections();
            });
        });
    }

    #bindActions() {
        for (const screen of Object.values(this.screens)) {
            screen.addEventListener('click', (event) => {
                const action = event.target.closest('[data-action]')?.dataset.action;
                if (action) this.handlers[action]?.();
            });
        }
    }

    #syncSelections() {
        const menu = this.screens.menu;
        menu.querySelectorAll('[data-setting]').forEach((group) => {
            const value = this.settings.get(group.dataset.setting);
            group.querySelectorAll('button[data-value]').forEach((button) => {
                const active = button.dataset.value === value;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', String(active));
            });
        });
        const difficultyField = menu.querySelector('[data-field="difficulty"]');
        difficultyField?.classList.toggle('disabled', this.settings.get('mode') === 'pvp');

        const labels = { auto: ['Left', 'Right'], pvai: ['You', 'CPU'], pvp: ['P1', 'P2'] }[this.settings.get('mode')] ?? ['Left', 'Right'];
        menu.querySelectorAll('.roster-side').forEach((label, index) => { label.textContent = labels[index]; });
    }
}
