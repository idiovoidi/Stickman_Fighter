/**
 * Move frame data. Timings are in seconds; `reach` is the approximate centre-to-centre
 * distance at which the move connects (used by the AI), `radius` is the size of the
 * striking hitbox around `limb`, and `cancelInto` lists moves it can chain into on contact.
 */

import { definePose } from '../animation/poses.js';

const move = (spec) => Object.freeze({
    cancelInto: [],
    lunge: 0,
    launch: 0,
    knockdown: false,
    air: false,
    heavy: false,
    meterCost: 0,
    radius: 14,
    blockDamageRatio: null,
    ...spec,
    total: spec.startup + spec.active + spec.recovery,
});

export const MOVES = Object.freeze({
    jab: move({
        id: 'jab', label: 'Jab', limb: 'handF',
        startup: 0.07, active: 0.07, recovery: 0.15,
        damage: 5, stamina: 7, hitstun: 0.3, knockback: 170, reach: 100, lunge: 120,
        cancelInto: ['cross', 'roundhouse'],
        poses: {
            windup: definePose({ torso: 4, uArmF: 55, lArmF: 165 }),
            strike: definePose({ hipX: 6, torso: 15, uArmF: 92, lArmF: 92, thighF: 30 }),
        },
    }),
    cross: move({
        id: 'cross', label: 'Cross', limb: 'handB',
        startup: 0.11, active: 0.08, recovery: 0.22,
        damage: 8, stamina: 11, hitstun: 0.36, knockback: 260, reach: 112, lunge: 240,
        cancelInto: ['uppercut', 'roundhouse'],
        poses: {
            windup: definePose({ hipX: -3, torso: 0, uArmB: 10, lArmB: 150 }),
            strike: definePose({ hipX: 10, torso: 25, uArmB: 95, lArmB: 92, uArmF: 30, lArmF: 165, thighB: -26, shinB: -38, thighF: 32 }),
        },
    }),
    uppercut: move({
        id: 'uppercut', label: 'Uppercut', limb: 'handB',
        startup: 0.15, active: 0.09, recovery: 0.34,
        damage: 12, stamina: 15, hitstun: 0.6, knockback: 160, launch: 760, reach: 86, lunge: 160,
        heavy: true, radius: 16,
        poses: {
            windup: definePose({ hipX: -2, torso: 28, uArmB: -10, lArmB: 40, thighF: 45, shinF: -10, thighB: 10, shinB: -45 }),
            strike: definePose({ torso: 10, head: -12, uArmB: 115, lArmB: 150, thighF: 18, shinF: 0 }),
        },
    }),
    roundhouse: move({
        id: 'roundhouse', label: 'Roundhouse', limb: 'footF',
        startup: 0.17, active: 0.1, recovery: 0.32,
        damage: 11, stamina: 14, hitstun: 0.45, knockback: 430, reach: 116, lunge: 120,
        heavy: true, radius: 16,
        poses: {
            windup: definePose({ torso: -5, thighF: 75, shinF: -35, thighB: -4, shinB: -6, uArmF: 20, lArmF: 120 }),
            strike: definePose({ hipX: 14, torso: -24, head: 10, thighF: 115, shinF: 105, thighB: -4, shinB: -6, uArmF: 10, lArmF: 120, uArmB: -35, lArmB: 20 }),
        },
    }),
    sweep: move({
        id: 'sweep', label: 'Sweep', limb: 'footF',
        startup: 0.15, active: 0.12, recovery: 0.42,
        damage: 8, stamina: 12, hitstun: 0.5, knockback: 140, knockdown: true, reach: 110,
        radius: 16,
        poses: {
            windup: definePose({ torso: 30, thighF: 70, shinF: -35, thighB: 75, shinB: -40, uArmF: 60, lArmF: 120, uArmB: -20, lArmB: 10 }),
            strike: definePose({ hipX: 10, torso: 35, thighF: 75, shinF: 85, thighB: 90, shinB: -40, uArmF: 80, lArmF: 100, uArmB: -30, lArmB: 0 }),
        },
    }),
    flyingKick: move({
        id: 'flyingKick', label: 'Flying Kick', limb: 'footF', air: true,
        startup: 0.07, active: 0.32, recovery: 0.12,
        damage: 10, stamina: 10, hitstun: 0.45, knockback: 380, reach: 105,
        heavy: true, radius: 16,
        poses: {
            windup: definePose({ torso: 0, thighF: 80, shinF: -20, thighB: 40, shinB: -60 }),
            strike: definePose({ torso: -15, thighF: 85, shinF: 88, thighB: 40, shinB: -60, uArmF: -20, lArmF: 30, uArmB: -50, lArmB: -20 }),
        },
    }),
    super: move({
        id: 'super', label: 'DRAGON FIST', limb: 'handB',
        startup: 0.32, active: 0.16, recovery: 0.5,
        damage: 22, stamina: 0, meterCost: 100, hitstun: 0.8, knockback: 820, launch: 520, knockdown: true,
        reach: 175, lunge: 950, heavy: true, radius: 24, blockDamageRatio: 0.45,
        poses: {
            windup: definePose({ hipX: -8, torso: -12, uArmB: -50, lArmB: -30, uArmF: 60, lArmF: 120, thighF: 40, shinF: 0, thighB: -20, shinB: -40 }),
            strike: definePose({ hipX: 18, torso: 30, uArmB: 95, lArmB: 95, uArmF: -10, lArmF: 30, thighB: -38, shinB: -42, thighF: 42, shinF: 5 }),
        },
    }),
});

export const GROUND_ATTACKS = Object.freeze(['jab', 'cross', 'uppercut', 'roundhouse', 'sweep']);

export const isKnownMove = (moveId) => (Object.hasOwn(MOVES, moveId) ? null : `unknown move "${moveId}"`);
