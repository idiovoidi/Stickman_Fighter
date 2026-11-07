import { Animator } from '../animation/Animator.js';
import { Skeleton } from '../animation/Skeleton.js';
import { InvalidProfileError } from '../errors/GameErrors.js';
import { withValidation } from '../utils/decorators.js';
import { FighterBody } from './components/FighterBody.js';
import { Vitals } from './components/Vitals.js';
import { Fighter } from './Fighter.js';

const REQUIRED_STATS = ['power', 'speed', 'defense', 'health'];
const REQUIRED_TRAITS = ['aggression', 'caution', 'jumpiness', 'kickBias', 'comboDrive'];

function validateProfile({ profile, side }) {
    if (!profile) return 'missing profile';
    if (side !== 0 && side !== 1) return `side must be 0 or 1, got ${side}`;
    const missingStat = REQUIRED_STATS.find((key) => typeof profile.stats?.[key] !== 'number');
    if (missingStat) return `profile "${profile.id}" is missing stat "${missingStat}"`;
    const missingTrait = REQUIRED_TRAITS.find((key) => typeof profile.personality?.[key] !== 'number');
    if (missingTrait) return `profile "${profile.id}" is missing personality trait "${missingTrait}"`;
    return null;
}

/** Assembles a Fighter from its components. */
export const createFighter = withValidation(
    function createFighter({ profile, side, events, config }) {
        const vitals = new Vitals({ ...config.vitals, maxHealth: config.vitals.maxHealth * profile.stats.health });
        return new Fighter({
            id: `${profile.id}-${side}`,
            side,
            profile,
            body: new FighterBody(),
            vitals,
            skeleton: new Skeleton(),
            animator: new Animator(),
            events,
            config,
        });
    },
    validateProfile,
    { label: 'createFighter', ErrorType: InvalidProfileError },
);
