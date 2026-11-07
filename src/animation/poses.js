/**
 * Poses are flat objects of joint angles (radians). Limb angles are measured from
 * straight down, positive rotating toward the direction the fighter faces.
 * `torso` is measured from straight up (positive = lean forward), `head` is relative
 * to the torso, and `hipX` is a forward shift of the hips in world units.
 */

import { deg, lerp } from '../utils/math.js';

export const POSE_KEYS = Object.freeze([
    'hipX', 'torso', 'head', 'uArmF', 'lArmF', 'uArmB', 'lArmB', 'thighF', 'shinF', 'thighB', 'shinB',
]);

const STANCE_DEGREES = Object.freeze({
    hipX: 0, torso: 8, head: -4,
    uArmF: 38, lArmF: 148, uArmB: 18, lArmB: 158,
    thighF: 24, shinF: -4, thighB: -12, shinB: -30,
});

/** Builds a pose from degree overrides layered over the fighting stance. */
export function definePose(overrides = {}) {
    const pose = {};
    for (const key of POSE_KEYS) {
        const value = overrides[key] ?? STANCE_DEGREES[key];
        pose[key] = key === 'hipX' ? value : deg(value);
    }
    return Object.freeze(pose);
}

export function copyPose(source, target = {}) {
    for (const key of POSE_KEYS) target[key] = source[key];
    return target;
}

export function lerpPose(a, b, t, target = {}) {
    for (const key of POSE_KEYS) target[key] = lerp(a[key], b[key], t);
    return target;
}

export const POSES = Object.freeze({
    stance: definePose(),
    block: definePose({ torso: -4, head: 8, uArmF: 70, lArmF: 172, uArmB: 55, lArmB: 176, thighF: 28, shinF: 0, thighB: -16, shinB: -34 }),
    airborne: definePose({ torso: 4, uArmF: 60, lArmF: 140, uArmB: -20, lArmB: 40, thighF: 75, shinF: -15, thighB: 35, shinB: -45 }),
    falling: definePose({ torso: 0, uArmF: 70, lArmF: 120, uArmB: -35, lArmB: 10, thighF: 40, shinF: 0, thighB: 5, shinB: -25 }),
    land: definePose({ torso: 20, thighF: 62, shinF: -22, thighB: 45, shinB: -55, uArmF: 50, lArmF: 120 }),
    hitstun: definePose({ hipX: -6, torso: -28, head: -25, uArmF: -15, lArmF: 30, uArmB: -45, lArmB: -10, thighF: 30, shinF: 10, thighB: -20, shinB: -20 }),
    launched: definePose({ torso: -50, head: -30, uArmF: -60, lArmF: -30, uArmB: -90, lArmB: -70, thighF: 50, shinF: 20, thighB: 20, shinB: -10 }),
    knockdown: definePose({ torso: -86, head: -6, uArmF: -120, lArmF: -140, uArmB: -100, lArmB: -60, thighF: 84, shinF: 92, thighB: 70, shinB: 100 }),
    getup: definePose({ torso: -10, head: 0, uArmF: 10, lArmF: 60, uArmB: -30, lArmB: 0, thighF: 95, shinF: -10, thighB: 80, shinB: -50 }),
    dash: definePose({ torso: -12, uArmF: 50, lArmF: 160, thighF: 40, shinF: 10, thighB: -30, shinB: -50 }),
    victory: definePose({ torso: -6, head: -15, uArmF: 165, lArmF: 175, uArmB: 150, lArmB: 160, thighF: 12, shinF: 2, thighB: -10, shinB: -14 }),
});

/** Fighting-stance idle with a gentle breathing bob. */
export function idlePose(clock, target) {
    copyPose(POSES.stance, target);
    const breathe = Math.sin(clock * 3.2);
    target.torso += deg(2) * breathe;
    target.uArmF += deg(3) * breathe;
    target.lArmF -= deg(4) * breathe;
    target.thighF += deg(2.5) * breathe;
    target.shinF -= deg(2.5) * breathe;
    target.thighB -= deg(1.5) * breathe;
    return target;
}

/** Procedural shuffle-step cycle; `phase` advances with signed walking speed. */
export function walkPose(phase, target) {
    copyPose(POSES.stance, target);
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    target.thighF = POSES.stance.thighF + deg(20) * s;
    target.shinF = target.thighF - deg(12) - deg(25) * Math.max(0, c);
    target.thighB = POSES.stance.thighB - deg(20) * s;
    target.shinB = target.thighB - deg(14) - deg(25) * Math.max(0, -c);
    target.torso += deg(3) * Math.abs(c);
    target.uArmB += deg(6) * s;
    return target;
}
