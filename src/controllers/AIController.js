/**
 * AIController - drives a fighter with a reaction-limited plan/decide loop.
 *
 * Skill (difficulty) caps how fast and accurately it reacts; the fighter profile's
 * personality shapes what it prefers to do (rush in, turtle, jump, kick, combo).
 */

import { GROUND_ATTACKS, MOVES } from '../combat/moves.js';
import { NEUTRAL_INTENT } from '../entities/Fighter.js';
import { pick, weightedPick } from '../utils/math.js';

const KICKS = new Set(['roundhouse', 'sweep', 'flyingKick']);
const DOWNED_STATES = new Set(['knockdown', 'getup', 'ko']);
const MOVE_WEIGHTS = Object.freeze({ jab: 1.4, cross: 1, uppercut: 0.6, roundhouse: 1, sweep: 0.45 });
const SUPER_RANGE = 140;
/** Reading an incoming attack is quicker than making a fresh decision; scales skill.reaction. */
const THREAT_REACTION_SCALE = 0.3;

export class AIController {
    constructor({ fighter, skill, rng = Math.random }) {
        this.fighter = fighter;
        this.skill = skill;
        this.traits = fighter.profile.personality;
        this.rng = rng;
        this.reset();
    }

    reset() {
        this.plan = { kind: 'hold', timer: 0.3 };
        this.decisionTimer = 0.2 + this.rng() * 0.3;
        this.clock = 0;
        this.watched = { serial: -1, reactAt: Infinity, handled: true };
        this.comboRoll = { serial: -1, next: null };
    }

    think(dt, { opponent, arena }) {
        const me = this.fighter;
        this.clock += dt;
        const view = this.#observe(opponent, arena);

        if (me.state === 'attack') return this.#continueAttack(me);
        if (!me.isActionable) {
            this.plan.timer = 0;
            return NEUTRAL_INTENT;
        }

        this.#watchThreat(me, opponent, view);
        this.plan.timer -= dt;
        this.decisionTimer -= dt;
        if (this.plan.timer <= 0 || (this.decisionTimer <= 0 && this.plan.interruptible !== false)) {
            this.#decide(me, opponent, view);
            this.decisionTimer = this.skill.reaction * (0.6 + this.rng() * 0.8);
        }

        const intent = this.#execute(me, view);
        me.debugLabel = this.plan.move ? `${this.plan.kind}:${this.plan.move}` : this.plan.kind;
        return intent;
    }

    #observe(opponent, arena) {
        const me = this.fighter;
        const dx = opponent.body.x - me.body.x;
        const edge = arena.wallMargin + 70;
        return {
            dist: Math.abs(dx),
            toward: Math.sign(dx) || me.body.facing,
            cornered: me.body.x < edge || me.body.x > arena.width - edge,
            stamina: me.vitals.stamina / me.vitals.maxStamina,
            health: me.vitals.healthRatio,
            opponentHealth: opponent.vitals.healthRatio,
        };
    }

    /** While attacking, decide once per attack whether to chain into a follow-up on contact. */
    #continueAttack(me) {
        const attack = me.attack;
        if (this.comboRoll.serial !== me.attackSerial) {
            const options = attack.move.cancelInto.filter((id) => MOVES[id].stamina <= me.vitals.stamina);
            const wantsCombo = this.rng() < this.skill.comboSkill * (0.5 + this.traits.comboDrive * 0.6);
            this.comboRoll = { serial: me.attackSerial, next: wantsCombo && options.length ? pick(this.rng, options) : null };
        }
        const next = this.comboRoll.next;
        return next && attack.hasHit ? { ...NEUTRAL_INTENT, attack: next } : NEUTRAL_INTENT;
    }

    /** Notices each new opponent attack after a human-like reaction delay and maybe defends. */
    #watchThreat(me, opponent, view) {
        const watched = this.watched;
        if (opponent.state === 'attack' && opponent.attackSerial !== watched.serial) {
            watched.serial = opponent.attackSerial;
            watched.handled = false;
            watched.reactAt = this.clock + this.skill.reaction * THREAT_REACTION_SCALE * (0.6 + this.rng() * 0.7);
        }
        if (watched.handled || this.clock < watched.reactAt) return;
        watched.handled = true;

        const attack = opponent.attack;
        if (!attack || attack.phase === 'recovery' || !me.body.grounded) return;
        if (view.dist > attack.move.reach + 45) return;

        const blockChance = this.skill.blockSkill * (0.55 + this.traits.caution * 0.7);
        if (this.rng() < blockChance) {
            const remaining = attack.move.startup + attack.move.active - attack.elapsed;
            this.#setPlan('block', remaining + 0.12 + this.rng() * 0.1, { interruptible: false });
        } else if (view.dist < MOVES.jab.reach && this.rng() < this.skill.accuracy * 0.25) {
            this.#setPlan('attack', 0.15, { move: 'jab' });
        } else if (this.rng() < this.traits.caution * 0.3) {
            this.#setPlan('dash', 0.25);
        }
    }

    #decide(me, opponent, view) {
        const { rng, skill, traits } = this;

        if (DOWNED_STATES.has(opponent.state)) {
            if (view.dist > 170) return this.#setPlan('approach', 0.3);
            return this.#setPlan(rng() < 0.4 ? 'retreat' : 'hold', 0.3);
        }

        if (me.vitals.meterFull && view.dist < SUPER_RANGE && opponent.body.grounded
            && rng() < 0.35 + traits.aggression * 0.4) {
            return this.#setPlan('attack', 0.25, { move: 'super' });
        }

        if (opponent.state === 'attack' && opponent.attack?.phase === 'recovery') {
            const punish = this.#bestMoveFor(view.dist, me);
            if (punish && rng() < skill.accuracy) return this.#setPlan('attack', 0.2, { move: punish });
        }

        if (opponent.state === 'airborne' && view.dist < 150 && rng() < skill.antiAir) {
            return this.#setPlan('attack', 0.2, { move: 'uppercut' });
        }

        if (view.stamina < 0.22) {
            return this.#setPlan(rng() < traits.caution ? 'block' : 'retreat', 0.5 + rng() * 0.4);
        }

        if (view.cornered && view.dist < 130 && rng() < 0.25 + traits.jumpiness * 0.5) {
            return this.#setPlan('jumpOver', 0.7, { interruptible: false, direction: view.toward });
        }

        const desperation = view.health < 0.3 ? 1 + traits.aggression * 0.3 : 1;
        const aggression = traits.aggression * (0.75 + 0.5 * (1 - view.opponentHealth)) * desperation;
        const move = this.#bestMoveFor(view.dist, me);
        if (move && rng() < 0.3 + aggression * 0.55) return this.#setPlan('attack', 0.25, { move });

        if (!move && view.dist < 200 && rng() < (1 - skill.accuracy) * 0.25) {
            return this.#setPlan('attack', 0.2, { move: pick(rng, GROUND_ATTACKS) });
        }

        const preferred = this.#preferredRange();
        if (view.dist > preferred + 40) {
            if (view.dist > 170 && view.dist < 380 && rng() < traits.jumpiness * 0.35) {
                return this.#setPlan('jumpIn', 0.9, { interruptible: false });
            }
            return this.#setPlan('approach', 0.25 + rng() * 0.45);
        }
        if (view.dist < preferred - 30 && rng() < traits.caution * 0.6) {
            return this.#setPlan(rng() < 0.35 ? 'dash' : 'retreat', 0.2 + rng() * 0.3);
        }

        const roll = rng();
        if (roll < 0.35) return this.#setPlan('hold', 0.15 + rng() * 0.35);
        if (roll < 0.65) return this.#setPlan('approach', 0.12 + rng() * 0.2);
        if (roll < 0.8 + traits.caution * 0.1) return this.#setPlan('retreat', 0.12 + rng() * 0.2);
        return this.#setPlan('block', 0.25 + rng() * 0.25);
    }

    #execute(me, view) {
        const intent = { ...NEUTRAL_INTENT };
        const plan = this.plan;

        switch (plan.kind) {
            case 'approach':
                if (view.dist > this.#preferredRange() - 10) intent.move = view.toward;
                break;
            case 'retreat':
                intent.move = -view.toward;
                break;
            case 'block':
                intent.block = true;
                break;
            case 'attack':
                intent.attack = plan.move;
                this.#setPlan('hold', 0.1);
                break;
            case 'dash':
                if (!plan.used) {
                    intent.dash = -view.toward;
                    plan.used = true;
                }
                break;
            case 'jumpIn':
                if (!plan.jumped && me.body.grounded) {
                    intent.jump = true;
                    intent.move = view.toward;
                    plan.jumped = true;
                } else if (!me.body.grounded) {
                    intent.move = view.toward;
                    if (view.dist < 125 && me.body.vy > -350) intent.attack = 'flyingKick';
                } else {
                    plan.timer = 0;
                }
                break;
            case 'jumpOver':
                if (!plan.jumped && me.body.grounded) {
                    intent.jump = true;
                    plan.jumped = true;
                } else if (me.body.grounded) {
                    plan.timer = 0;
                }
                intent.move = plan.direction;
                break;
            default:
                break;
        }
        return intent;
    }

    #preferredRange() {
        return 80 + this.traits.kickBias * 30;
    }

    #bestMoveFor(dist, me) {
        const options = GROUND_ATTACKS.filter((id) => dist <= MOVES[id].reach && me.vitals.stamina >= MOVES[id].stamina);
        if (!options.length) return null;
        return weightedPick(this.rng, options.map((id) => ({ value: id, weight: this.#weight(id, dist) })));
    }

    #weight(id, dist) {
        const kickBias = this.traits.kickBias;
        let weight = KICKS.has(id) ? 0.5 + kickBias : 1.5 - kickBias;
        weight *= 0.6 + (dist / MOVES[id].reach) * 0.6;
        return weight * MOVE_WEIGHTS[id];
    }

    #setPlan(kind, duration, extra = {}) {
        this.plan = { kind, timer: duration, ...extra };
    }
}
