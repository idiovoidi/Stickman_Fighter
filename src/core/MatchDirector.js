/**
 * MatchDirector - round flow for a best-of match.
 *
 * Phases: intro → fight → ko → roundOver → (intro … | matchOver).
 * Emits round:intro, round:fight, round:ko, round:timeover, round:over, match:over.
 */
export class MatchDirector {
    constructor({ events, config }) {
        this.events = events;
        this.config = config;
        this.phase = 'idle';
        this.phaseTime = 0;
        this.fighters = [];
        this.wins = [0, 0];
        this.round = 0;
        this.clock = config.roundTime;
    }

    get controlsEnabled() {
        return this.phase === 'fight';
    }

    get timeScale() {
        const { koSlowmoTime, koSlowmoScale } = this.config;
        return this.phase === 'ko' && !this.timeOver && this.phaseTime < koSlowmoTime ? koSlowmoScale : 1;
    }

    get isFinalRound() {
        return this.wins.every((wins) => wins === this.config.roundsToWin - 1) || this.round >= this.config.maxRounds;
    }

    begin({ fighters, autoContinue, matchNumber, onRoundSetup, onMatchComplete }) {
        this.fighters = fighters;
        this.autoContinue = autoContinue;
        this.matchNumber = matchNumber;
        this.onRoundSetup = onRoundSetup;
        this.onMatchComplete = onMatchComplete;
        this.wins = [0, 0];
        this.round = 0;
        this.matchWinner = null;
        this.#startRound();
    }

    /** `dt` is real (unscaled) time so slow-motion doesn't stretch phase timings. */
    update(dt) {
        if (this.phase === 'idle') return;
        this.phaseTime += dt;
        const config = this.config;

        switch (this.phase) {
            case 'intro':
                if (this.phaseTime >= config.introTime) {
                    this.#enter('fight');
                    this.events.emit('round:fight', { round: this.round });
                }
                break;
            case 'fight':
                this.#updateFight(dt);
                break;
            case 'ko':
                this.#updateKO();
                break;
            case 'roundOver':
                if (this.phaseTime >= config.roundOverTime) this.#advance();
                break;
            case 'matchOver':
                if (this.autoContinue && this.phaseTime >= config.matchOverTime) {
                    this.phase = 'idle';
                    this.onMatchComplete?.();
                }
                break;
            default:
                break;
        }
    }

    #updateFight(dt) {
        this.clock = Math.max(0, this.clock - dt);
        const fallen = this.fighters.filter((fighter) => !fighter.isAlive);

        if (fallen.length) {
            this.roundWinner = fallen.length === 2 ? null : this.fighters.find((fighter) => fighter.isAlive);
            this.#enter('ko');
            this.events.emit('round:ko', { winner: this.roundWinner, loser: fallen[0], double: fallen.length === 2 });
            return;
        }

        if (this.clock <= 0) {
            const [a, b] = this.fighters;
            const lead = a.vitals.healthRatio - b.vitals.healthRatio;
            this.roundWinner = Math.abs(lead) < 0.001 ? null : lead > 0 ? a : b;
            this.timeOver = true;
            this.#enter('ko');
            this.events.emit('round:timeover', { winner: this.roundWinner });
        }
    }

    #updateKO() {
        const winner = this.roundWinner;
        if (winner && this.phaseTime > 1.0 && winner.isActionable && winner.body.grounded) winner.celebrate();
        if (this.phaseTime >= this.config.koTime) this.#concludeRound();
    }

    #concludeRound() {
        const winner = this.roundWinner;
        if (winner) this.wins[winner.side] += 1;
        const perfect = Boolean(winner) && winner.vitals.health >= winner.vitals.maxHealth;
        this.#enter('roundOver');
        this.events.emit('round:over', { winner, perfect, wins: [...this.wins], round: this.round });
    }

    #advance() {
        const { roundsToWin, maxRounds } = this.config;
        const champion = this.fighters.find((fighter) => this.wins[fighter.side] >= roundsToWin);

        if (champion || this.round >= maxRounds) {
            const [a, b] = this.fighters;
            this.matchWinner = champion ?? (this.wins[0] === this.wins[1] ? null : this.wins[0] > this.wins[1] ? a : b);
            this.#enter('matchOver');
            this.events.emit('match:over', {
                winner: this.matchWinner,
                wins: [...this.wins],
                fighters: this.fighters,
                matchNumber: this.matchNumber,
                autoContinue: this.autoContinue,
            });
            return;
        }
        this.#startRound();
    }

    #startRound() {
        this.round += 1;
        this.clock = this.config.roundTime;
        this.roundWinner = null;
        this.timeOver = false;
        this.onRoundSetup?.();
        this.#enter('intro');
        this.events.emit('round:intro', { round: this.round, final: this.isFinalRound, matchNumber: this.matchNumber });
    }

    #enter(phase) {
        this.phase = phase;
        this.phaseTime = 0;
    }
}
