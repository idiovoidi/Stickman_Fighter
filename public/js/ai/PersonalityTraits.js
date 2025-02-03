import { WeightedDecision } from './WeightedDecision.js';

export const PersonalityTraits = {
    AGGRESSIVE: 'AGGRESSIVE',
    DEFENSIVE: 'DEFENSIVE',
    BALANCED: 'BALANCED',
    UNPREDICTABLE: 'UNPREDICTABLE'
};

/**
 * @class PersonalityProfile
 * @description Defines AI personality traits and decision-making behavior
 */
export class PersonalityProfile {
    /**
     * @constructor
     * @param {string} type - Personality type from PersonalityTraits
     */
    constructor(type) {
        this.type = type;
        this.stats = this.getPersonalityStats(type);
        this.setupDecisionMakers();
    }

    setupDecisionMakers() {
        this.moveDecision = new WeightedDecision();
        this.actionDecision = new WeightedDecision();

        switch (this.type) {
            case PersonalityTraits.AGGRESSIVE:
                this.setupAggressiveDecisions();
                break;
            case PersonalityTraits.DEFENSIVE:
                this.setupDefensiveDecisions();
                break;
            case PersonalityTraits.BALANCED:
                this.setupBalancedDecisions();
                break;
            case PersonalityTraits.UNPREDICTABLE:
                this.setupUnpredictableDecisions();
                break;
        }
    }

    /**
     * @method setupAggressiveDecisions
     * @description Sets up decision weights for aggressive personality
     * @private
     */
    setupAggressiveDecisions() {
        // Move decisions
        this.moveDecision.addOption('approach', 0.7, [
            state => state.distanceToOpponent > this.stats.attackRange
        ]);
        this.moveDecision.addOption('retreat', 0.2, [
            state => state.health < 30 || state.stamina < 20
        ]);
        this.moveDecision.addOption('strafe', 0.1, [
            state => state.distanceToOpponent <= this.stats.attackRange
        ]);

        // Action decisions
        this.actionDecision.addOption('punch', 0.4, [
            state => state.distanceToOpponent <= this.stats.attackRange,
            state => state.stamina >= 10
        ]);
        this.actionDecision.addOption('kick', 0.3, [
            state => state.distanceToOpponent <= this.stats.attackRange + 10,
            state => state.stamina >= 15
        ]);
    }

    /**
     * @method setupDefensiveDecisions
     * @description Sets up decision weights for defensive personality
     * @private
     */
    setupDefensiveDecisions() {
        // Move decisions
        this.moveDecision.addOption('retreat', 0.5, [
            state => state.distanceToOpponent < this.stats.retreatThreshold
        ]);
        this.moveDecision.addOption('approach', 0.2, [
            state => state.distanceToOpponent > this.stats.attackRange * 1.5,
            state => state.opponentHealth < 50
        ]);
        this.moveDecision.addOption('strafe', 0.3, [
            state => state.distanceToOpponent <= this.stats.attackRange
        ]);

        // Action decisions
        this.actionDecision.addOption('defend', 0.4, [
            state => state.opponentIsAttacking
        ]);
        this.actionDecision.addOption('kick', 0.3, [
            state => state.distanceToOpponent <= this.stats.attackRange,
            state => !state.opponentIsAttacking
        ]);
    }

    /**
     * @method setupBalancedDecisions
     * @description Sets up decision weights for balanced personality
     * @private
     */
    setupBalancedDecisions() {
        // Move decisions
        this.moveDecision.addOption('approach', 0.4, [
            state => state.distanceToOpponent > this.stats.attackRange
        ]);
        this.moveDecision.addOption('retreat', 0.3, [
            state => state.health < 50 || state.opponentIsAttacking
        ]);
        this.moveDecision.addOption('strafe', 0.3, [
            state => state.distanceToOpponent <= this.stats.attackRange
        ]);

        // Action decisions
        this.actionDecision.addOption('punch', 0.3, [
            state => state.distanceToOpponent <= this.stats.attackRange
        ]);
        this.actionDecision.addOption('kick', 0.3, [
            state => state.distanceToOpponent <= this.stats.attackRange + 5
        ]);
        this.actionDecision.addOption('defend', 0.4, [
            state => state.opponentIsAttacking
        ]);
    }

    /**
     * @method setupUnpredictableDecisions
     * @description Sets up randomized decision weights for unpredictable personality
     * @private
     */
    setupUnpredictableDecisions() {
        const moves = ['approach', 'retreat', 'strafe'];
        const actions = ['punch', 'kick', 'defend'];

        // Randomly assign weights to moves
        moves.forEach(move => {
            this.moveDecision.addOption(move, Math.random(), [
                state => true // Always valid
            ]);
        });

        // Randomly assign weights to actions
        actions.forEach(action => {
            this.actionDecision.addOption(action, Math.random(), [
                state => state.distanceToOpponent <= this.stats.attackRange
            ]);
        });
    }

    /**
     * @method makeDecision
     * @description Makes a decision based on current state and personality
     * @param {Object} state - Current game state
     * @returns {Object} Decision object with move and action
     */
    makeDecision(state) {
        return {
            move: this.moveDecision.decide(state),
            action: this.actionDecision.decide(state)
        };
    }

    shouldCombo(state) {
        const baseChance = this.stats.comboChance;
        const staminaFactor = state.stamina / 100;
        const healthFactor = state.health / 100;
        const advantageFactor = state.opponentIsStunned ? 1.5 : 1;

        return Math.random() < (baseChance * staminaFactor * healthFactor * advantageFactor);
    }

    getNextMove(currentComboLength, state) {
        if (currentComboLength >= this.stats.maxComboLength) return null;

        // Get weighted move based on current state
        const decision = this.makeDecision(state);
        if (!decision.shouldCombo) return null;

        return decision.action;
    }

    // Helper method to calculate effective ranges based on state
    calculateEffectiveRange(state) {
        const baseMoveSpeed = this.stats.attackSpeed;
        const staminaFactor = state.stamina / 100;
        return {
            attackRange: this.stats.attackRange * staminaFactor,
            retreatThreshold: this.stats.retreatThreshold * (2 - staminaFactor)
        };
    }

    getPersonalityStats(type) {
        switch (type) {
            case PersonalityTraits.AGGRESSIVE:
                return {
                    attackRange: 120,        // Willing to attack from further away
                    retreatThreshold: 80,    // Stays closer to opponent
                    comboChance: 0.8,        // High chance of combos
                    defendChance: 0.3,       // Less likely to defend
                    attackSpeed: 600,        // Faster attacks
                    maxComboLength: 4,       // Longer combos
                    preferredMoves: ['punch', 'kick', 'punch'] // Favors punches
                };

            case PersonalityTraits.DEFENSIVE:
                return {
                    attackRange: 80,         // Only attacks when very close
                    retreatThreshold: 150,   // Keeps distance
                    comboChance: 0.4,        // Less likely to combo
                    defendChance: 0.9,       // Very likely to defend
                    attackSpeed: 900,        // Slower, more calculated attacks
                    maxComboLength: 2,       // Short combos
                    preferredMoves: ['kick', 'jump', 'kick'] // Favors kicks
                };

            case PersonalityTraits.BALANCED:
                return {
                    attackRange: 100,
                    retreatThreshold: 120,
                    comboChance: 0.6,
                    defendChance: 0.6,
                    attackSpeed: 800,
                    maxComboLength: 3,
                    preferredMoves: ['punch', 'kick', 'jump']
                };

            case PersonalityTraits.UNPREDICTABLE:
                return {
                    attackRange: this.randomRange(80, 150),
                    retreatThreshold: this.randomRange(80, 150),
                    comboChance: Math.random(),
                    defendChance: Math.random(),
                    attackSpeed: this.randomRange(600, 1000),
                    maxComboLength: Math.floor(this.randomRange(2, 5)),
                    preferredMoves: this.shuffleArray(['punch', 'kick', 'jump'])
                };
        }
    }

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    shuffleArray(array) {
        return [...array].sort(() => Math.random() - 0.5);
    }

    shouldDefend(opponentAttacking) {
        return opponentAttacking && Math.random() < this.stats.defendChance;
    }

    shouldCombo() {
        return Math.random() < this.stats.comboChance;
    }

    getNextMove(currentComboLength) {
        if (currentComboLength >= this.stats.maxComboLength) return null;
        const moveIndex = currentComboLength % this.stats.preferredMoves.length;
        return this.stats.preferredMoves[moveIndex];
    }
} 