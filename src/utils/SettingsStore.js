import { withErrorBoundary } from './decorators.js';

const readJson = withErrorBoundary((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), {
    label: 'SettingsStore.read',
    fallback: {},
});

const writeJson = withErrorBoundary((key, value) => localStorage.setItem(key, JSON.stringify(value)), {
    label: 'SettingsStore.write',
});

/** Persists user preferences to localStorage; unknown or invalid stored values fall back to defaults. */
export class SettingsStore {
    constructor(key, defaults, validators = {}) {
        this.key = key;
        this.values = { ...defaults };
        const stored = readJson(key);
        for (const [name, value] of Object.entries(stored ?? {})) {
            if (!(name in defaults)) continue;
            if (validators[name] && !validators[name](value)) continue;
            this.values[name] = value;
        }
    }

    get(name) {
        return this.values[name];
    }

    set(name, value) {
        this.values[name] = value;
        writeJson(this.key, this.values);
    }

    snapshot() {
        return { ...this.values };
    }
}
