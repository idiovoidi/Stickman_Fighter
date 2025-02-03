export const GameStates = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    ROUND_END: 'ROUND_END',
    GAME_OVER: 'GAME_OVER'
};

export class GameState {
    constructor() {
        this.currentState = GameStates.MENU;
        this.previousState = null;
        this.score = {
            player1: 0,
            player2: 0
        };
        this.round = 1;
        this.maxRounds = 3;
        this.events = new EventTarget();
        this.winner = null;
    }

    setState(newState) {
        if (this.currentState === newState) return;

        this.previousState = this.currentState;
        this.currentState = newState;

        this.events.dispatchEvent(new CustomEvent('stateChanged', {
            detail: {
                currentState: this.currentState,
                previousState: this.previousState
            }
        }));

        // Handle state-specific logic
        switch (newState) {
            case GameStates.PLAYING:
                this.onEnterPlaying();
                break;
            case GameStates.PAUSED:
                this.onEnterPaused();
                break;
            case GameStates.ROUND_END:
                this.onEnterRoundEnd();
                break;
            case GameStates.GAME_OVER:
                this.onEnterGameOver();
                break;
        }
    }

    onEnterPlaying() {
        if (this.previousState === GameStates.PAUSED) {
            this.events.dispatchEvent(new CustomEvent('gameResumed'));
        } else {
            this.events.dispatchEvent(new CustomEvent('roundStarted', {
                detail: { round: this.round }
            }));
        }
    }

    onEnterPaused() {
        this.events.dispatchEvent(new CustomEvent('gamePaused'));
    }

    onEnterRoundEnd() {
        this.events.dispatchEvent(new CustomEvent('roundEnded', {
            detail: {
                round: this.round,
                score: this.score
            }
        }));
    }

    onEnterGameOver() {
        this.events.dispatchEvent(new CustomEvent('gameOver', {
            detail: {
                winner: this.winner,
                finalScore: this.score
            }
        }));
    }

    togglePause() {
        if (this.currentState === GameStates.PLAYING) {
            this.setState(GameStates.PAUSED);
        } else if (this.currentState === GameStates.PAUSED) {
            this.setState(GameStates.PLAYING);
        }
    }

    updateScore(player, points) {
        this.score[player] += points;
        this.events.dispatchEvent(new CustomEvent('scoreUpdated', {
            detail: { score: this.score }
        }));

        // Check for round end
        if (this.shouldEndRound()) {
            this.setState(GameStates.ROUND_END);
        }
    }

    shouldEndRound() {
        // Add your round end conditions here
        return this.score.player1 >= 10 || this.score.player2 >= 10;
    }

    nextRound() {
        if (this.round < this.maxRounds) {
            this.round++;
            this.setState(GameStates.PLAYING);
            return true;
        }
        this.determineWinner();
        this.setState(GameStates.GAME_OVER);
        return false;
    }

    determineWinner() {
        if (this.score.player1 > this.score.player2) {
            this.winner = 'player1';
        } else if (this.score.player2 > this.score.player1) {
            this.winner = 'player2';
        } else {
            this.winner = 'tie';
        }
    }

    reset() {
        this.score = { player1: 0, player2: 0 };
        this.round = 1;
        this.winner = null;
        this.setState(GameStates.MENU);
        this.events.dispatchEvent(new CustomEvent('gameReset'));
    }

    isState(state) {
        return this.currentState === state;
    }

    canTransitionTo(state) {
        // Define valid state transitions
        const validTransitions = {
            [GameStates.MENU]: [GameStates.PLAYING],
            [GameStates.PLAYING]: [GameStates.PAUSED, GameStates.ROUND_END],
            [GameStates.PAUSED]: [GameStates.PLAYING, GameStates.MENU],
            [GameStates.ROUND_END]: [GameStates.PLAYING, GameStates.GAME_OVER],
            [GameStates.GAME_OVER]: [GameStates.MENU]
        };

        return validTransitions[this.currentState]?.includes(state) || false;
    }
} 