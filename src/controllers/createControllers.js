import { DEFAULT_DIFFICULTY, DIFFICULTY } from '../config/difficulty.js';
import { KEY_BINDINGS, mergeBindings } from '../config/keyBindings.js';
import { ConfigurationError } from '../errors/GameErrors.js';
import { AIController } from './AIController.js';
import { HumanController } from './HumanController.js';

export const GAME_MODES = Object.freeze({
    auto: { label: 'Spectate', humans: [false, false] },
    pvai: { label: 'Player vs AI', humans: [true, false] },
    pvp: { label: 'Player vs Player', humans: [true, true] },
});

/** Builds one controller per fighter for the given mode. */
export function createControllers({ mode, difficulty, fighters, input, rng }) {
    const modeSpec = GAME_MODES[mode];
    if (!modeSpec) throw new ConfigurationError(`Unknown game mode "${mode}"`);
    const skill = DIFFICULTY[difficulty] ?? DIFFICULTY[DEFAULT_DIFFICULTY];

    return fighters.map((fighter, side) => {
        if (!modeSpec.humans[side]) return new AIController({ fighter, skill, rng });
        const bindings = mode === 'pvai'
            ? mergeBindings(KEY_BINDINGS.p1, KEY_BINDINGS.p2)
            : side === 0 ? KEY_BINDINGS.p1 : KEY_BINDINGS.p2;
        return new HumanController({ fighter, input, bindings });
    });
}
