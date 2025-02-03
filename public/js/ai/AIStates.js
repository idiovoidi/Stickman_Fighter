export const AIStates = {
    IDLE: 'IDLE',
    APPROACHING: 'APPROACHING',
    ATTACKING: 'ATTACKING',
    DEFENDING: 'DEFENDING',
    RETREATING: 'RETREATING'
};

export class AIState {
    constructor(controller) {
        this.controller = controller;
    }
    
    enter() {}
    execute() {}
    exit() {}
}

export class IdleState extends AIState {
    execute() {
        const { distanceToOpponent } = this.controller.getState();
        
        if (distanceToOpponent > 150) {
            this.controller.changeState(AIStates.APPROACHING);
        } else if (distanceToOpponent < 100) {
            this.controller.changeState(AIStates.ATTACKING);
        }
    }
}

export class ApproachingState extends AIState {
    execute() {
        const { distanceToOpponent, personality } = this.controller.getState();
        
        if (distanceToOpponent < personality.stats.attackRange) {
            this.controller.changeState(AIStates.ATTACKING);
            return;
        }

        // Move towards opponent with personality-based speed
        const moveSpeed = personality.stats.attackRange > 100 ? 1.2 : 0.8;
        if (this.controller.stickman.isLeftSide) {
            this.controller.stickman.moveRight(moveSpeed);
        } else {
            this.controller.stickman.moveLeft(moveSpeed);
        }
    }
}

export class AttackingState extends AIState {
    constructor(controller) {
        super(controller);
        this.attackTimeout = null;
        this.attackSequence = 0;
    }

    enter() {
        this.startAttackSequence();
    }

    execute() {
        const state = this.controller.getState();
        const decision = state.personality.makeDecision(state);

        if (decision.move === 'retreat') {
            this.controller.changeState(AIStates.RETREATING);
            return;
        }

        if (decision.action === 'defend') {
            this.controller.changeState(AIStates.DEFENDING);
            return;
        }

        // Execute the chosen action
        if (decision.action && this.controller.stickman.moves[decision.action]) {
            this.controller.stickman.moves[decision.action]();
        }

        // Execute movement
        if (decision.move === 'strafe') {
            this.strafeMovement();
        }
    }

    strafeMovement() {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const speed = 0.5;
        if (this.controller.stickman.isLeftSide) {
            this.controller.stickman.moveRight(speed * direction);
        } else {
            this.controller.stickman.moveLeft(speed * direction);
        }
    }

    startAttackSequence() {
        const { personality } = this.controller.getState();
        const nextMove = personality.getNextMove(this.attackSequence);
        
        if (!nextMove || !personality.shouldCombo()) {
            this.controller.changeState(AIStates.RETREATING);
            return;
        }
        
        this.controller.stickman.moves[nextMove]();
        
        this.attackTimeout = setTimeout(() => {
            this.attackSequence++;
            this.startAttackSequence();
        }, personality.stats.attackSpeed);
    }

    exit() {
        if (this.attackTimeout) {
            clearTimeout(this.attackTimeout);
        }
    }
}

export class DefendingState extends AIState {
    constructor(controller) {
        super(controller);
        this.defenseTimeout = null;
    }

    enter() {
        // Jump to dodge
        this.controller.stickman.moves.jump();
        
        // Set a timeout to exit defensive state
        this.defenseTimeout = setTimeout(() => {
            this.controller.changeState(AIStates.RETREATING);
        }, 1000);
    }

    exit() {
        if (this.defenseTimeout) {
            clearTimeout(this.defenseTimeout);
        }
    }
}

export class RetreatingState extends AIState {
    constructor(controller) {
        super(controller);
        this.retreatDuration = 0;
    }

    enter() {
        this.retreatDuration = 0;
    }

    execute() {
        const { distanceToOpponent, personality } = this.controller.getState();
        this.retreatDuration += 16;

        if (distanceToOpponent > personality.stats.retreatThreshold || 
            this.retreatDuration > 1000) {
            this.controller.changeState(AIStates.IDLE);
            return;
        }

        // Move away from opponent
        const moveSpeed = personality.type === 'DEFENSIVE' ? 1.2 : 0.8;
        if (this.controller.stickman.isLeftSide) {
            this.controller.stickman.moveLeft(moveSpeed);
        } else {
            this.controller.stickman.moveRight(moveSpeed);
        }
    }
} 