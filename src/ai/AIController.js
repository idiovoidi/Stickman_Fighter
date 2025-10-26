/**
 * AIController - Controls AI fighter behavior
 * Uses simple state-based decision making and personality traits
 */

export class AIController {
    constructor(fighter, opponent, difficulty = 'medium') {
        this.fighter = fighter;
        this.opponent = opponent;
        this.difficulty = difficulty;

        // AI state
        this.state = 'idle';
        this.targetPosition = null;
        this.lastDecisionTime = 0;
        this.decisionCooldown = this.getDecisionCooldown();

        // Behavior parameters based on difficulty
        this.params = this.getDifficultyParams();

        // Personality traits
        this.personality = this.generatePersonality();

        // Movement and combat state
        this.movementDirection = 0;
        this.isApproaching = false;
        this.isRetreating = false;
        this.attackTimer = 0;

        console.log(`🤖 AI Controller initialized for ${fighter.options.isPlayer1 ? 'Player 1' : 'Player 2'} (${difficulty} difficulty)`);
    }

    update(deltaTime) {
        if (!this.fighter || !this.opponent) return;

        // Update timers
        this.attackTimer -= deltaTime;
        this.lastDecisionTime += deltaTime;

        // Make decisions based on current state and situation
        this.updateState();
        this.makeDecision(deltaTime);
        this.executeBehavior(deltaTime);
    }

    updateState() {
        const distance = this.getDistanceToOpponent();
        const healthPercent = this.fighter.getHealthPercent() / 100;
        const opponentHealthPercent = this.opponent.getHealthPercent() / 100;

        // Determine current situation
        if (distance > this.params.attackRange) {
            this.state = 'approaching';
        } else if (distance < this.params.retreatThreshold) {
            this.state = 'retreating';
        } else if (this.canAttack()) {
            this.state = 'attacking';
        } else {
            this.state = 'positioning';
        }

        // Modify behavior based on personality and health
        if (healthPercent < 0.3 && this.personality.cowardice > 0.7) {
            this.state = 'retreating';
        } else if (opponentHealthPercent < 0.3 && this.personality.aggression > 0.7) {
            this.state = 'attacking';
        }
    }

    makeDecision(deltaTime) {
        if (this.lastDecisionTime < this.decisionCooldown) return;

        const distance = this.getDistanceToOpponent();
        const fighterHealth = this.fighter.getHealthPercent();
        const opponentHealth = this.opponent.getHealthPercent();

        // Reset decision timer
        this.lastDecisionTime = 0;
        this.decisionCooldown = this.getDecisionCooldown() * (0.5 + Math.random());

        // Make context-aware decisions
        if (this.state === 'approaching') {
            this.decideApproach(distance);
        } else if (this.state === 'retreating') {
            this.decideRetreat(distance);
        } else if (this.state === 'attacking') {
            this.decideAttack(distance);
        } else {
            this.decidePositioning(distance);
        }
    }

    executeBehavior(deltaTime) {
        switch (this.state) {
            case 'approaching':
                this.executeApproach(deltaTime);
                break;
            case 'retreating':
                this.executeRetreat(deltaTime);
                break;
            case 'attacking':
                this.executeAttack(deltaTime);
                break;
            case 'positioning':
                this.executePositioning(deltaTime);
                break;
            default:
                this.executeIdle(deltaTime);
        }
    }

    decideApproach(distance) {
        // Decide how to approach the opponent
        const shouldJump = Math.random() < this.params.jumpProbability;
        const shouldAttack = Math.random() < this.params.attackProbability;

        if (shouldJump && this.fighter.isGrounded) {
            this.fighter.executeMove('jump');
        } else if (shouldAttack && this.canAttack()) {
            this.decideAttackType();
        }

        this.isApproaching = true;
        this.isRetreating = false;
    }

    decideRetreat(distance) {
        // Decide how to retreat from opponent
        this.isApproaching = false;
        this.isRetreating = true;

        // Jump to create distance if too close
        if (distance < this.params.minDistance && this.fighter.isGrounded) {
            this.fighter.executeMove('jump');
        }
    }

    decideAttack(distance) {
        if (!this.canAttack()) return;

        // Choose attack type based on situation and personality
        if (distance < this.params.kickRange && this.personality.prefersKicks) {
            this.fighter.executeMove('kick');
        } else {
            this.fighter.executeMove('punch');
        }

        this.attackTimer = this.params.attackCooldown;
    }

    decideAttackType() {
        // Choose between punch and kick based on distance and personality
        const distance = this.getDistanceToOpponent();

        if (distance < this.params.kickRange && this.personality.prefersKicks) {
            this.fighter.executeMove('kick');
        } else {
            this.fighter.executeMove('punch');
        }
    }

    decidePositioning(distance) {
        // Maintain optimal fighting distance
        const optimalDistance = this.params.optimalDistance;
        const shouldJump = Math.random() < this.params.jumpProbability;

        if (Math.abs(distance - optimalDistance) > 20) {
            if (distance > optimalDistance) {
                this.isApproaching = true;
            } else {
                this.isRetreating = true;
            }
        } else {
            // At optimal distance - mix it up
            if (shouldJump && this.fighter.isGrounded) {
                this.fighter.executeMove('jump');
            }
        }
    }

    executeApproach(deltaTime) {
        const direction = this.getDirectionToOpponent();
        this.fighter.move(direction);
    }

    executeRetreat(deltaTime) {
        const direction = -this.getDirectionToOpponent();
        this.fighter.move(direction);
    }

    executeAttack(deltaTime) {
        // Attack logic is handled in decideAttack
        // This could be used for combo attacks or special moves
    }

    executePositioning(deltaTime) {
        // Strafe or circle around opponent
        const distance = this.getDistanceToOpponent();

        if (distance < this.params.optimalDistance - 10) {
            this.executeRetreat(deltaTime);
        } else if (distance > this.params.optimalDistance + 10) {
            this.executeApproach(deltaTime);
        } else {
            // At optimal distance - maybe strafe
            const strafeDirection = Math.random() > 0.5 ? 1 : -1;
            this.fighter.move(strafeDirection * 0.5);
        }
    }

    executeIdle(deltaTime) {
        // Do nothing or light movement
        this.fighter.stopMoving();
    }

    // Helper methods
    getDistanceToOpponent() {
        const myPos = this.fighter.getCenterPosition();
        const opponentPos = this.opponent.getCenterPosition();

        return Math.sqrt(
            Math.pow(myPos.x - opponentPos.x, 2) +
            Math.pow(myPos.y - opponentPos.y, 2)
        );
    }

    getDirectionToOpponent() {
        const myPos = this.fighter.getCenterPosition();
        const opponentPos = this.opponent.getCenterPosition();

        return myPos.x < opponentPos.x ? 1 : -1;
    }

    canAttack() {
        return this.attackTimer <= 0 &&
               this.fighter.stamina >= 15 &&
               !this.fighter.isAttacking;
    }

    generatePersonality() {
        // Generate personality traits based on difficulty
        const baseAggression = this.difficulty === 'easy' ? 0.3 :
                               this.difficulty === 'medium' ? 0.6 : 0.8;

        return {
            aggression: baseAggression + (Math.random() - 0.5) * 0.2,
            cowardice: 1 - baseAggression + (Math.random() - 0.5) * 0.2,
            prefersKicks: Math.random() > 0.5,
            unpredictability: this.difficulty === 'hard' ? 0.3 : 0.1,
            patience: this.difficulty === 'easy' ? 0.8 : 0.4
        };
    }

    getDifficultyParams() {
        const params = {
            easy: {
                attackRange: 60,
                retreatThreshold: 30,
                optimalDistance: 45,
                kickRange: 35,
                minDistance: 25,
                attackProbability: 0.3,
                jumpProbability: 0.2,
                attackCooldown: 1.5,
                decisionSpeed: 0.8
            },
            medium: {
                attackRange: 50,
                retreatThreshold: 25,
                optimalDistance: 40,
                kickRange: 30,
                minDistance: 20,
                attackProbability: 0.5,
                jumpProbability: 0.3,
                attackCooldown: 1.0,
                decisionSpeed: 1.0
            },
            hard: {
                attackRange: 45,
                retreatThreshold: 20,
                optimalDistance: 35,
                kickRange: 25,
                minDistance: 15,
                attackProbability: 0.7,
                jumpProbability: 0.4,
                attackCooldown: 0.7,
                decisionSpeed: 1.2
            }
        };

        return params[this.difficulty] || params.medium;
    }

    getDecisionCooldown() {
        return (2.0 - this.params.decisionSpeed) * (0.8 + Math.random() * 0.4);
    }

    // Public interface
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.params = this.getDifficultyParams();
        this.personality = this.generatePersonality();
    }

    getState() {
        return {
            state: this.state,
            difficulty: this.difficulty,
            personality: this.personality,
            targetPosition: this.targetPosition,
            movementDirection: this.movementDirection
        };
    }

    // Cleanup
    destroy() {
        this.fighter = null;
        this.opponent = null;
    }
}
