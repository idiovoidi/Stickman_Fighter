/**
 * GameEngine - owns the simulation step. All collaborators are injected so each
 * system (rendering, HUD, AI, rules) stays independent and replaceable.
 */

import { NEUTRAL_INTENT } from '../entities/Fighter.js';

export class GameEngine {
    constructor({
        config, events, input, director, renderer, camera, hud, hitResolver,
        createFighter, createControllers, roster, rng = Math.random,
    }) {
        this.config = config;
        this.events = events;
        this.input = input;
        this.director = director;
        this.renderer = renderer;
        this.camera = camera;
        this.hud = hud;
        this.hitResolver = hitResolver;
        this.createFighter = createFighter;
        this.createControllers = createControllers;
        this.roster = roster;
        this.rng = rng;

        this.world = { physics: config.physics, arena: config.arena };
        this.fighters = [];
        this.controllers = [];
        this.session = null;
        this.paused = false;
        this.hitstop = 0;
        this.debug = false;

        this.#subscribe();
    }

    get mode() {
        return this.session?.mode ?? 'auto';
    }

    startMatch({ mode = 'auto', difficulty = 'normal', picks = [] } = {}) {
        this.session = { mode, difficulty, picks, matchNumber: 1 };
        this.#beginMatch();
    }

    rematch() {
        if (this.session) this.#beginMatch();
    }

    pause() {
        this.paused = true;
    }

    resume() {
        this.paused = false;
        this.input.clearPresses();
    }

    toggleDebug() {
        this.debug = !this.debug;
    }

    update(dt) {
        if (this.paused || !this.fighters.length) return;
        const worldDt = dt * this.director.timeScale;
        this.director.update(dt);

        if (this.hitstop > 0) {
            this.hitstop = Math.max(0, this.hitstop - dt);
        } else {
            this.#stepFighters(worldDt);
        }

        this.renderer.update(worldDt, this.fighters);
        this.camera.update(dt, this.fighters, this.renderer.view);
        this.hud.update(this.fighters, this.director);
    }

    render() {
        this.renderer.render({ fighters: this.fighters, debug: this.debug });
    }

    #beginMatch() {
        const { mode, difficulty, picks, matchNumber } = this.session;
        const profiles = this.#chooseProfiles(picks);

        this.fighters = profiles.map((profile, side) => this.createFighter({
            profile, side, events: this.events, config: this.config,
        }));
        this.controllers = this.createControllers({
            mode, difficulty, fighters: this.fighters, input: this.input, rng: this.rng,
        });

        this.renderer.clearEffects();
        this.input.clearPresses();
        this.hud.bind(this.fighters, mode);
        this.paused = false;
        this.hitstop = 0;

        this.director.begin({
            fighters: this.fighters,
            autoContinue: mode === 'auto',
            matchNumber,
            onRoundSetup: () => this.#setupRound(),
            onMatchComplete: () => this.#nextAutoMatch(),
        });
        this.camera.snap(this.fighters, this.renderer.view);
        this.events.emit('match:start', { fighters: this.fighters, mode, matchNumber });
    }

    #nextAutoMatch() {
        this.session.matchNumber += 1;
        this.#beginMatch();
    }

    #setupRound() {
        const { width, spawnOffset } = this.config.arena;
        this.fighters.forEach((fighter, side) => {
            const x = width / 2 + (side === 0 ? -spawnOffset : spawnOffset);
            fighter.resetForRound(x, side === 0 ? 1 : -1);
        });
        this.controllers.forEach((controller) => controller.reset?.());
        this.hitstop = 0;
    }

    /** Uses explicit picks where given, otherwise random distinct fighters. Mirror picks get recoloured. */
    #chooseProfiles(picks) {
        const chosen = [0, 1].map((side) => this.roster.find((profile) => profile.id === picks[side]) ?? null);
        chosen.forEach((profile, side) => {
            if (profile) return;
            const pool = this.roster.filter((candidate) => !chosen.includes(candidate));
            chosen[side] = pool[Math.floor(this.rng() * pool.length)];
        });
        if (chosen[0].id === chosen[1].id) {
            const original = chosen[1];
            chosen[1] = { ...original, name: `${original.name} II`, color: original.accent, accent: original.color };
        }
        return chosen;
    }

    #stepFighters(dt) {
        const [a, b] = this.fighters;
        a.faceToward(b.body.x);
        b.faceToward(a.body.x);

        const controlsOn = this.director.controlsEnabled;
        this.fighters.forEach((fighter, index) => {
            const opponent = this.fighters[1 - index];
            const intent = controlsOn
                ? this.controllers[index].think(dt, { opponent, arena: this.config.arena })
                : NEUTRAL_INTENT;
            fighter.update(dt, intent, this.world);
        });

        this.#separate(a, b);
        this.hitResolver.resolve(this.fighters);
    }

    /** Keeps fighters from overlapping; a cornered fighter stays put and the other is pushed out. */
    #separate(a, b) {
        if (a.state === 'ko' || b.state === 'ko') return;
        if (Math.abs(a.body.y - b.body.y) > 110) return;

        const minGap = this.config.fighter.pushboxHalfWidth * 2;
        const dx = b.body.x - a.body.x;
        const overlap = minGap - Math.abs(dx);
        if (overlap <= 0) return;

        const direction = Math.sign(dx) || (a.side === 0 ? 1 : -1);
        a.body.x -= (direction * overlap) / 2;
        b.body.x += (direction * overlap) / 2;

        const { wallMargin, width } = this.config.arena;
        const lo = wallMargin;
        const hi = width - wallMargin;
        const clampX = (fighter) => { fighter.body.x = Math.min(hi, Math.max(lo, fighter.body.x)); };
        clampX(a);
        clampX(b);

        if (Math.abs(b.body.x - a.body.x) < minGap) {
            const aAtWall = a.body.x <= lo || a.body.x >= hi;
            if (aAtWall) b.body.x = a.body.x + direction * minGap;
            else a.body.x = b.body.x - direction * minGap;
        }
    }

    #subscribe() {
        const combat = this.config.combat;
        this.events.on('combat:hit', ({ move, blocked, ko }) => {
            let duration = move.heavy ? combat.hitstopHeavy : combat.hitstopLight;
            if (ko || move.meterCost) duration = combat.hitstopSuper;
            if (blocked) duration *= 0.8;
            this.hitstop = Math.max(this.hitstop, duration);
        });
        this.events.on('fighter:super', () => {
            this.hitstop = Math.max(this.hitstop, combat.superFreeze);
        });
    }
}
