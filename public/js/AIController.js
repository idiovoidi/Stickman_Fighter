import { AIStates, IdleState, ApproachingState, AttackingState, DefendingState, RetreatingState } from './ai/AIStates.js';
import { PersonalityTraits, PersonalityProfile } from './ai/PersonalityTraits.js';

export class AIController {
    constructor(stickman, opponent, personalityType = PersonalityTraits.BALANCED) {
        this.stickman = stickman;
        this.opponent = opponent;
        this.currentState = null;
        this.states = new Map();
        this.lastStateChange = 0;
        this.stateChangeDelay = 200; // Minimum time between state changes
        this.personality = new PersonalityProfile(personalityType);

        this.setupStates();
        this.changeState(AIStates.IDLE);
    }

    setupStates() {
        this.states.set(AIStates.IDLE, new IdleState(this));
        this.states.set(AIStates.APPROACHING, new ApproachingState(this));
        this.states.set(AIStates.ATTACKING, new AttackingState(this));
        this.states.set(AIStates.DEFENDING, new DefendingState(this));
        this.states.set(AIStates.RETREATING, new RetreatingState(this));
    }

    update(deltaTime) {
        if (!this.currentState) return;
        
        this.currentState.execute(deltaTime);
    }

    changeState(newStateName) {
        const now = performance.now();
        if (now - this.lastStateChange < this.stateChangeDelay) return;

        const newState = this.states.get(newStateName);
        if (!newState) return;

        if (this.currentState) {
            this.currentState.exit();
        }

        this.currentState = newState;
        this.lastStateChange = now;
        this.currentState.enter();
    }

    getState() {
        const myPosition = this.stickman.parts.torso.position;
        const opponentPosition = this.opponent.parts.torso.position;
        
        return {
            distanceToOpponent: Matter.Vector.magnitude(
                Matter.Vector.sub(myPosition, opponentPosition)
            ),
            heightDifference: myPosition.y - opponentPosition.y,
            opponentIsAttacking: this.opponent.isAttacking,
            isAttacking: this.stickman.isAttacking,
            personality: this.personality
        };
    }
} 