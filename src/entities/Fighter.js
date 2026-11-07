/**
 * Fighter - a stick figure composed of a kinematic body, vitals, skeleton and animator.
 * Controllers (human or AI) feed it an intent each step; the fighter's state machine
 * decides what that intent is allowed to do.
 */

import { MOVES, isKnownMove } from '../combat/moves.js';
import { UnknownMoveError } from '../errors/GameErrors.js';
import { decorateMethods, validateArgs } from '../utils/decorators.js';
import { clamp } from '../utils/math.js';
import { Ragdoll } from './components/Ragdoll.js';

export const NEUTRAL_INTENT = Object.freeze({ move: 0, jump: false, block: false, attack: null, dash: 0 });

const ACTIONABLE_STATES = new Set(['idle', 'airborne', 'block']);
const INVULNERABLE_STATES = new Set(['knockdown', 'getup', 'ko', 'victory']);

export class Fighter {
    constructor({ id, side, profile, body, vitals, skeleton, animator, events, config }) {
        this.id = id;
        this.side = side;
        this.profile = profile;
        this.body = body;
        this.vitals = vitals;
        this.skeleton = skeleton;
        this.animator = animator;
        this.events = events;
        this.config = config;

        this.state = 'idle';
        this.stateTime = 0;
        this.attack = null;
        this.attackSerial = 0;
        this.stunTimer = 0;
        this.launched = false;
        this.juggles = 0;
        this.comboHits = 0;
        this.flashTimer = 0;
        this.landingTimer = 0;
        this.airAttackUsed = false;
        this.ragdoll = null;
        this.debugLabel = '';
    }

    get name() { return this.profile.name; }
    get stats() { return this.profile.stats; }
    get isAlive() { return this.vitals.health > 0; }
    get isActionable() { return ACTIONABLE_STATES.has(this.state); }
    get isInvulnerable() { return INVULNERABLE_STATES.has(this.state); }

    joints() {
        return this.ragdoll ? this.ragdoll.joints : this.skeleton.joints;
    }

    focusX() {
        return this.ragdoll ? this.ragdoll.joints.hip.x : this.body.x;
    }

    hitPoint() {
        return this.attack ? this.skeleton.joints[this.attack.move.limb] : null;
    }

    faceToward(x) {
        if (!this.isActionable || !this.body.grounded) return;
        const direction = Math.sign(x - this.body.x);
        if (direction) this.body.facing = direction;
    }

    resetForRound(x, facing) {
        this.body.place(x, this.config.arena.floorY, facing);
        this.vitals.reset();
        this.attack = null;
        this.ragdoll = null;
        this.stunTimer = 0;
        this.launched = false;
        this.juggles = 0;
        this.comboHits = 0;
        this.flashTimer = 0;
        this.landingTimer = 0;
        this.#setState('idle');
        this.animator.reset();
        this.skeleton.solve(this.animator.current, facing, this.body.x, this.body.y);
    }

    update(dt, intent, world) {
        this.stateTime += dt;
        this.flashTimer = Math.max(0, this.flashTimer - dt);
        this.landingTimer = Math.max(0, this.landingTimer - dt);

        if (this.state === 'ko') {
            this.ragdoll.update(dt, world);
            this.body.x = this.ragdoll.joints.hip.x;
            return;
        }

        this.vitals.update(dt);
        this.#runState(dt, intent);
        const landing = this.body.integrate(dt, world);
        if (landing) this.#onLand(landing);
        this.animator.update(dt, this);
        this.skeleton.solve(this.animator.current, this.body.facing, this.body.x, this.body.y);
    }

    tryAttack(moveId) {
        const move = MOVES[moveId];
        if (!this.isActionable) return false;
        if (move.air === this.body.grounded) return false;
        if (move.air && this.airAttackUsed) return false;
        if (this.vitals.meter < move.meterCost) return false;
        if (!this.vitals.spendStamina(move.stamina)) return false;
        this.vitals.spendMeter(move.meterCost);
        this.#startAttack(move);
        return true;
    }

    canCancelInto(moveId) {
        const attack = this.attack;
        const next = MOVES[moveId];
        if (!attack || !attack.hasHit || attack.phase === 'startup') return false;
        if (!attack.move.cancelInto.includes(moveId)) return false;
        if (next.air === this.body.grounded) return false;
        return this.vitals.stamina >= next.stamina && this.vitals.meter >= next.meterCost;
    }

    receiveHit({ attacker, move, direction, damageScale }) {
        if (this.isInvulnerable) return null;
        const combat = this.config.combat;
        this.flashTimer = 0.09;

        const facingAttacker = this.body.facing === -direction;
        const guarding = (this.state === 'block' || this.state === 'blockstun') && facingAttacker;
        if (guarding) return this.#absorbBlockedHit(move, direction);

        const counter = this.state === 'attack' && this.attack?.phase === 'startup';
        const damage = (move.damage * attacker.stats.power * damageScale * (counter ? combat.counterBonus : 1)) / this.stats.defense;
        this.vitals.damage(damage);
        this.vitals.addMeter(damage * combat.meterGainOnHurt);
        this.attack = null;
        this.comboHits += 1;

        if (!this.isAlive) {
            this.#knockOut(move, direction);
            return { blocked: false, guardBreak: false, damage, counter, ko: true };
        }

        const shouldLaunch = move.launch > 0 || move.knockdown || !this.body.grounded;
        if (shouldLaunch && this.juggles < combat.maxJuggles) {
            this.juggles += 1;
            this.launched = true;
            this.body.launch(direction * move.knockback, -(move.launch || (move.knockdown ? 320 : 420)));
        } else if (shouldLaunch) {
            this.launched = true;
            this.body.vx = direction * move.knockback * 0.5;
        } else {
            this.launched = false;
            this.body.vx = direction * move.knockback;
        }
        this.stunTimer = move.hitstun;
        this.#setState('hitstun');
        return { blocked: false, guardBreak: false, damage, counter, ko: false };
    }

    onHitLanded(outcome) {
        if (this.attack) this.attack.hasHit = true;
        if (!outcome.blocked) this.vitals.addMeter(outcome.damage * this.config.combat.meterGainOnHit);
    }

    celebrate() {
        if (this.state === 'ko') return;
        this.attack = null;
        this.#setState('victory');
    }

    #setState(next) {
        this.state = next;
        this.stateTime = 0;
    }

    #runState(dt, intent) {
        const { body } = this;
        const friction = this.config.physics.groundFriction;
        const tuning = this.config.fighter;

        switch (this.state) {
            case 'idle':
                this.#runIdle(dt, intent);
                return;
            case 'airborne':
                this.#runAirborne(dt, intent);
                return;
            case 'attack':
                this.#runAttack(dt, intent);
                return;
            case 'block':
                body.brake(dt, friction * 2);
                if (intent.attack && this.tryAttack(intent.attack)) return;
                if (!intent.block) this.#setState('idle');
                return;
            case 'blockstun':
                body.brake(dt, friction);
                this.stunTimer -= dt;
                if (this.stunTimer <= 0) this.#setState(intent.block ? 'block' : 'idle');
                return;
            case 'hitstun':
                if (body.grounded) body.brake(dt, friction);
                if (this.launched) return;
                this.stunTimer -= dt;
                if (this.stunTimer <= 0) this.#recover();
                return;
            case 'knockdown':
                body.brake(dt, friction * 1.5);
                if (this.stateTime >= tuning.knockdownTime) this.#setState('getup');
                return;
            case 'getup':
                if (this.stateTime >= tuning.getupTime) this.#recover();
                return;
            case 'dash':
                if (this.stateTime > tuning.dashTime * 0.5) body.brake(dt, friction * 2);
                if (this.stateTime >= tuning.dashTime) this.#setState('idle');
                return;
            case 'victory':
                body.brake(dt, friction);
                return;
            default:
                return;
        }
    }

    #runIdle(dt, intent) {
        const { body } = this;
        const tuning = this.config.fighter;
        if (!body.grounded) {
            this.#setState('airborne');
            return;
        }
        if (intent.attack && this.tryAttack(intent.attack)) return;
        if (intent.block) {
            this.#setState('block');
            return;
        }
        if (intent.jump) {
            this.#jump(intent.move);
            return;
        }
        if (intent.dash && this.vitals.spendStamina(tuning.dashStamina)) {
            this.#dash(intent.dash);
            return;
        }
        const backward = intent.move !== 0 && intent.move === -body.facing;
        const speed = tuning.walkSpeed * this.stats.speed * (backward ? tuning.backwalkRatio : 1);
        body.steer(dt, intent.move * speed, 14);
    }

    #runAirborne(dt, intent) {
        const { body } = this;
        const tuning = this.config.fighter;
        const maxSpeed = tuning.walkSpeed * this.stats.speed * tuning.jumpCarry;
        body.vx = clamp(body.vx + intent.move * this.config.physics.airControl * dt, -maxSpeed, maxSpeed);
        if (intent.attack && !this.airAttackUsed) this.tryAttack('flyingKick');
    }

    #runAttack(dt, intent) {
        const attack = this.attack;
        const { move } = attack;
        attack.elapsed += dt;

        const phase = attack.elapsed < move.startup
            ? 'startup'
            : attack.elapsed < move.startup + move.active ? 'active' : 'recovery';
        if (phase !== attack.phase) {
            attack.phase = phase;
            if (phase === 'active') this.#onStrike(move);
        }

        if (this.body.grounded) this.body.brake(dt, this.config.physics.groundFriction);

        if (intent.attack && intent.attack !== move.id && this.canCancelInto(intent.attack)) {
            const next = MOVES[intent.attack];
            this.vitals.spendStamina(next.stamina);
            this.vitals.spendMeter(next.meterCost);
            this.#startAttack(next);
            return;
        }

        if (attack.elapsed >= move.total) {
            this.attack = null;
            this.#setState(this.body.grounded ? 'idle' : 'airborne');
        }
    }

    #startAttack(move) {
        this.attack = { move, elapsed: 0, phase: 'startup', hasHit: false };
        this.attackSerial += 1;
        if (move.air) this.airAttackUsed = true;
        this.#setState('attack');
        if (move.meterCost) this.events.emit('fighter:super', { fighter: this, move });
    }

    #onStrike(move) {
        if (move.lunge) this.body.vx = this.body.facing * move.lunge * (0.85 + 0.15 * this.stats.speed);
        this.events.emit('fighter:strike', { fighter: this, move });
    }

    #jump(direction) {
        const tuning = this.config.fighter;
        this.body.launch(direction * tuning.walkSpeed * this.stats.speed * tuning.jumpCarry, -tuning.jumpVelocity);
        this.airAttackUsed = false;
        this.#setState('airborne');
        this.events.emit('fighter:jump', { fighter: this });
    }

    #dash(direction) {
        this.body.vx = direction * this.config.fighter.dashSpeed * this.stats.speed;
        this.#setState('dash');
        this.events.emit('fighter:dash', { fighter: this, direction });
    }

    #recover() {
        this.launched = false;
        this.juggles = 0;
        this.comboHits = 0;
        this.#setState(this.body.grounded ? 'idle' : 'airborne');
    }

    #onLand({ impact }) {
        const tuning = this.config.fighter;
        this.events.emit('fighter:land', { fighter: this, impact });

        if (this.state === 'airborne') {
            this.landingTimer = tuning.landingLag;
            this.#setState('idle');
        } else if (this.state === 'attack' && this.attack.move.air) {
            this.attack = null;
            this.landingTimer = tuning.landingLag * 1.5;
            this.#setState('idle');
        } else if (this.state === 'hitstun' && this.launched) {
            this.launched = false;
            this.juggles = 0;
            this.comboHits = 0;
            this.#setState('knockdown');
            this.events.emit('fighter:knockdown', { fighter: this, impact });
        }
    }

    #absorbBlockedHit(move, direction) {
        const combat = this.config.combat;
        const ratio = move.blockDamageRatio ?? combat.blockDamageRatio;
        const chip = Math.max(0, Math.min(move.damage * ratio, this.vitals.health - 1));
        this.vitals.damage(chip);
        this.vitals.addMeter(combat.meterGainOnBlock);
        this.body.vx = direction * move.knockback * 0.6;

        const staminaCost = combat.blockStaminaCost * (move.heavy ? 1.6 : 1);
        if (!this.vitals.spendStamina(staminaCost)) {
            this.vitals.drainStamina();
            this.stunTimer = combat.guardBreakStun;
            this.#setState('hitstun');
            return { blocked: true, guardBreak: true, damage: chip, counter: false, ko: false };
        }
        this.stunTimer = 0.1 + move.hitstun * 0.35;
        this.#setState('blockstun');
        return { blocked: true, guardBreak: false, damage: chip, counter: false, ko: false };
    }

    #knockOut(move, direction) {
        this.attack = null;
        this.#setState('ko');
        const velocity = {
            vx: direction * (380 + move.knockback * 0.6),
            vy: -(380 + move.launch * 0.5),
        };
        this.ragdoll = new Ragdoll(this.skeleton.joints, velocity, this.skeleton.bones.headRadius);
        this.events.emit('fighter:ko', { fighter: this });
    }
}

decorateMethods(Fighter, {
    tryAttack: validateArgs(isKnownMove, { ErrorType: UnknownMoveError }),
    canCancelInto: validateArgs(isKnownMove, { ErrorType: UnknownMoveError }),
});
