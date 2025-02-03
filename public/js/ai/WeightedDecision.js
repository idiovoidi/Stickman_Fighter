export class WeightedDecision {
    constructor() {
        this.options = new Map();
        this.totalWeight = 0;
    }

    addOption(option, weight, conditions = []) {
        this.options.set(option, { weight, conditions });
        this.totalWeight += weight;
    }

    // Make a decision considering current state and conditions
    decide(state) {
        let validOptions = new Map();
        let validTotalWeight = 0;

        // Filter options based on conditions
        for (const [option, { weight, conditions }] of this.options) {
            if (conditions.every(condition => condition(state))) {
                validOptions.set(option, weight);
                validTotalWeight += weight;
            }
        }

        if (validTotalWeight === 0) return null;

        // Make weighted random choice
        let random = Math.random() * validTotalWeight;
        for (const [option, weight] of validOptions) {
            random -= weight;
            if (random <= 0) return option;
        }

        return null;
    }
} 