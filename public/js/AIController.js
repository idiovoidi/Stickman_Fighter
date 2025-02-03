class AIController {
    constructor(stickman, opponent) {
        this.stickman = stickman;
        this.opponent = opponent;
        this.decisionInterval = 500; // Make decisions every 500ms
        this.lastDecision = 0;
        this.state = {
            distanceToOpponent: 0,
            heightDifference: 0,
            isAttacking: false
        };
    }

    update() {
        // Update state
        const myPosition = this.stickman.parts.torso.position;
        const opponentPosition = this.opponent.parts.torso.position;
        
        this.state.distanceToOpponent = Matter.Vector.magnitude(
            Matter.Vector.sub(myPosition, opponentPosition)
        );
        this.state.heightDifference = myPosition.y - opponentPosition.y;

        // Make decisions periodically
        if (Date.now() - this.lastDecision > this.decisionInterval) {
            this.makeDecision();
            this.lastDecision = Date.now();
        }
    }

    makeDecision() {
        if (this.stickman.isAttacking) return;

        // If too far, move closer
        if (this.state.distanceToOpponent > 150) {
            this.stickman.moves.jump();
            return;
        }

        // If in range, attack
        if (this.state.distanceToOpponent < 100) {
            // Randomly choose between punch and kick
            if (Math.random() < 0.5) {
                this.stickman.moves.punch();
            } else {
                this.stickman.moves.kick();
            }
            return;
        }

        // Dodge if opponent is attacking
        if (this.opponent.isAttacking && Math.random() < 0.7) {
            this.stickman.moves.jump();
        }
    }
} 