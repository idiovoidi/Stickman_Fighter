/**
 * @class AIController
 * @description Controls AI behavior using state machine and personality traits
 */
export class AIController {
    /**
     * @constructor
     * @param {StickMan} stickman - The fighter this AI controls
     * @param {StickMan} opponent - The opponent fighter
     * @param {string} personalityType - Type of personality from PersonalityTraits
     */
    constructor(stickman, opponent, personalityType = PersonalityTraits.BALANCED) {
        // ... existing constructor code ...
    }

    /**
     * @method update
     * @description Updates AI behavior based on current state
     * @param {number} deltaTime - Time elapsed since last update
     * @public
     */
    update(deltaTime) {
        // ... existing code ...
    }

    /**
     * @method getState
     * @description Gets the current state of the AI and its fighter
     * @returns {Object} Current state information
     * @public
     */
    getState() {
        // ... existing code ...
    }
} 