import { POSE_KEYS, POSES, copyPose, idlePose, lerpPose, walkPose } from './poses.js';
import { clamp, deg, easeInOutQuad, easeInQuad } from '../utils/math.js';

const WALK_PHASE_PER_UNIT = 0.065;

/**
 * Chooses a target pose from the fighter's state each step and eases the current
 * pose toward it. The returned blend rate controls how snappy each state feels.
 */
export class Animator {
    constructor() {
        this.current = copyPose(POSES.stance);
        this.target = copyPose(POSES.stance);
        this.walkPhase = 0;
        this.clock = 0;
    }

    reset() {
        copyPose(POSES.stance, this.current);
        copyPose(POSES.stance, this.target);
        this.walkPhase = 0;
    }

    update(dt, fighter) {
        this.clock += dt;
        const rate = this.#composeTarget(dt, fighter);
        const k = 1 - Math.exp(-rate * dt);
        for (const key of POSE_KEYS) {
            this.current[key] += (this.target[key] - this.current[key]) * k;
        }
    }

    #composeTarget(dt, fighter) {
        const t = this.target;
        const { body } = fighter;

        switch (fighter.state) {
            case 'idle': {
                if (Math.abs(body.vx) > 25) {
                    this.walkPhase += body.vx * body.facing * dt * WALK_PHASE_PER_UNIT;
                    walkPose(this.walkPhase, t);
                } else {
                    idlePose(this.clock, t);
                }
                if (fighter.landingTimer > 0) {
                    const weight = clamp(fighter.landingTimer / fighter.config.fighter.landingLag, 0, 1);
                    lerpPose(t, POSES.land, weight * 0.8, t);
                }
                return 14;
            }
            case 'attack':
                return this.#attackTarget(fighter, t);
            case 'airborne':
                copyPose(body.vy < 120 ? POSES.airborne : POSES.falling, t);
                return 10;
            case 'block':
                copyPose(POSES.block, t);
                return 22;
            case 'blockstun':
                copyPose(POSES.block, t);
                t.torso -= deg(10);
                t.hipX = -4;
                return 32;
            case 'hitstun':
                copyPose(fighter.launched ? POSES.launched : POSES.hitstun, t);
                return fighter.launched ? 14 : 26;
            case 'knockdown':
                copyPose(POSES.knockdown, t);
                return 10;
            case 'getup': {
                const progress = clamp(fighter.stateTime / fighter.config.fighter.getupTime, 0, 1);
                lerpPose(POSES.getup, POSES.stance, easeInOutQuad(progress), t);
                return 12;
            }
            case 'dash':
                copyPose(POSES.dash, t);
                return 18;
            case 'victory': {
                copyPose(POSES.victory, t);
                const wave = Math.sin(this.clock * 6);
                t.uArmF += deg(12) * wave;
                t.lArmF += deg(10) * wave;
                t.uArmB -= deg(8) * wave;
                return 6;
            }
            default:
                return 10;
        }
    }

    #attackTarget(fighter, t) {
        const { move, elapsed } = fighter.attack;
        const { windup, strike } = move.poses;

        if (elapsed < move.startup) {
            const progress = elapsed / move.startup;
            if (progress < 0.6) {
                copyPose(windup, t);
                return 24;
            }
            lerpPose(windup, strike, easeInQuad((progress - 0.6) / 0.4), t);
            return 45;
        }
        if (elapsed < move.startup + move.active) {
            copyPose(strike, t);
            return 60;
        }
        const progress = clamp((elapsed - move.startup - move.active) / move.recovery, 0, 1);
        lerpPose(strike, fighter.body.grounded ? POSES.stance : POSES.airborne, easeInOutQuad(progress), t);
        return 16;
    }
}
