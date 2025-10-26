/**
 * GameState - Manages overall game state and progression
 * Handles scoring, rounds, game phases, and state transitions
 */

export class GameState {
    constructor() {
        this.states = {
            MENU: 'menu',
            PLAYING: 'playing',
            PAUSED: 'paused',
            ROUND_END: 'round_end',
            GAME_OVER: 'game_over'
        };

        this.currentState = this.states.MENU;
        this.previousState = null;

        // Game progression
        this.score = { player1: 0, player2: 0 };
        this.round = 1;
        this.maxRounds = 3;
        this.roundTime = 60; // seconds
        this.currentTime = 0;

        // Fighter states
        this.fighterStates = {
            player1: { health: 100, stamina: 100, isAlive: true },
            player2: { health: 100, stamina: 100, isAlive: true }
        };

        // Event system
        this.eventListeners = new Map();
        this.eventQueue = [];

        this.init();
    }

    init() {
        this.reset();
        this.setupEventSystem();
    }

    setupEventSystem() {
        // Create custom event system for state changes
        this.events = new EventTarget();
    }

    setState(newState) {
        if (this.currentState === newState) return;

        console.log(`🎮 Game State: ${this.currentState} → ${newState}`);

        this.previousState = this.currentState;
        this.currentState = newState;

        // Emit state change event
        this.events.dispatchEvent(new CustomEvent('stateChanged', {
            detail: {
                currentState: this.currentState,
                previousState: this.previousState,
                timestamp: Date.now()
            }
        }));

        // Handle state-specific logic
        this.handleStateTransition(newState);
    }

    handleStateTransition(newState) {
        switch (newState) {
            case this.states.PLAYING:
                this.onEnterPlaying();
                break;
            case this.states.PAUSED:
                this.onEnterPaused();
                break;
            case this.states.ROUND_END:
                this.onEnterRoundEnd();
                break;
            case this.states.GAME_OVER:
                this.onEnterGameOver();
                break;
            case this.states.MENU:
                this.onEnterMenu();
                break;
        }
    }

    onEnterPlaying() {
        this.currentTime = 0;

        this.events.dispatchEvent(new CustomEvent('roundStarted', {
            detail: {
                round: this.round,
                score: this.score
            }
        }));
    }

    onEnterPaused() {
        this.events.dispatchEvent(new CustomEvent('gamePaused'));
    }

    onEnterRoundEnd() {
        this.events.dispatchEvent(new CustomEvent('roundEnded', {
            detail: {
                round: this.round,
                winner: this.getRoundWinner(),
                score: this.score
            }
        }));
    }

    onEnterGameOver() {
        this.events.dispatchEvent(new CustomEvent('gameOver', {
            detail: {
                winner: this.getGameWinner(),
                finalScore: this.score
            }
        }));
    }

    onEnterMenu() {
        this.reset();
        this.events.dispatchEvent(new CustomEvent('menuEntered'));
    }

    update(deltaTime) {
        if (this.currentState !== this.states.PLAYING) return;

        // Update round timer
        this.currentTime += deltaTime;

        // Check for round time up
        if (this.currentTime >= this.roundTime) {
            this.endRound();
        }

        // Check for round end conditions
        this.checkRoundEndConditions();
    }

    checkRoundEndConditions() {
        const player1Alive = this.fighterStates.player1.isAlive;
        const player2Alive = this.fighterStates.player2.isAlive;

        // Round ends if time is up or a fighter is defeated
        if (this.currentTime >= this.roundTime || !player1Alive || !player2Alive) {
            this.endRound();
        }
    }

    endRound() {
        const winner = this.getRoundWinner();

        if (winner) {
            if (winner === 'player1') {
                this.score.player1++;
            } else {
                this.score.player2++;
            }
        }

        this.round++;

        if (this.round > this.maxRounds || this.isGameOver()) {
            this.setState(this.states.GAME_OVER);
        } else {
            this.setState(this.states.ROUND_END);
        }
    }

    getRoundWinner() {
        const p1Health = this.fighterStates.player1.health;
        const p2Health = this.fighterStates.player2.health;

        if (p1Health <= 0) return 'player2';
        if (p2Health <= 0) return 'player1';

        if (this.currentTime >= this.roundTime) {
            // Time's up - higher health wins, or draw
            if (p1Health > p2Health) return 'player1';
            if (p2Health > p1Health) return 'player2';
            return 'draw';
        }

        return null;
    }

    getGameWinner() {
        if (this.score.player1 > this.score.player2) return 'player1';
        if (this.score.player2 > this.score.player1) return 'player2';
        return 'draw';
    }

    isGameOver() {
        const maxScore = Math.ceil(this.maxRounds / 2);
        return this.score.player1 >= maxScore || this.score.player2 >= maxScore;
    }

    updateFighterState(player, health, stamina, isAlive) {
        if (this.fighterStates[player]) {
            this.fighterStates[player].health = health;
            this.fighterStates[player].stamina = stamina;
            this.fighterStates[player].isAlive = isAlive;

            // Emit fighter state update event
            this.events.dispatchEvent(new CustomEvent('fighterStateUpdated', {
                detail: {
                    player,
                    state: this.fighterStates[player]
                }
            }));
        }
    }

    reset() {
        this.currentState = this.states.MENU;
        this.previousState = null;
        this.score = { player1: 0, player2: 0 };
        this.round = 1;
        this.currentTime = 0;

        this.fighterStates.player1 = { health: 100, stamina: 100, isAlive: true };
        this.fighterStates.player2 = { health: 100, stamina: 100, isAlive: true };

        console.log('🔄 Game state reset');
    }

    // Control methods
    pause() {
        if (this.currentState === this.states.PLAYING) {
            this.setState(this.states.PAUSED);
        }
    }

    resume() {
        if (this.currentState === this.states.PAUSED) {
            this.setState(this.states.PLAYING);
        }
    }

    togglePause() {
        if (this.currentState === this.states.PLAYING) {
            this.pause();
        } else if (this.currentState === this.states.PAUSED) {
            this.resume();
        }
    }

    // Query methods
    isState(state) {
        return this.currentState === state;
    }

    getState() {
        return this.currentState;
    }

    getTimeRemaining() {
        return Math.max(0, this.roundTime - this.currentTime);
    }

    getScore() {
        return { ...this.score };
    }

    getFighterState(player) {
        return this.fighterStates[player] ? { ...this.fighterStates[player] } : null;
    }

    // Event system methods
    addEventListener(event, callback) {
        this.events.addEventListener(event, callback);
    }

    removeEventListener(event, callback) {
        this.events.removeEventListener(event, callback);
    }

    // Configuration
    setMaxRounds(rounds) {
        this.maxRounds = rounds;
    }

    setRoundTime(time) {
        this.roundTime = time;
    }
}
