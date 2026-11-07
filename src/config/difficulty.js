/**
 * AI skill presets. `reaction` is seconds before the AI notices an incoming attack;
 * the other values are probabilities (0..1).
 */
export const DIFFICULTY = Object.freeze({
    easy: Object.freeze({ label: 'Easy', reaction: 0.42, blockSkill: 0.18, accuracy: 0.55, antiAir: 0.12, comboSkill: 0.2 }),
    normal: Object.freeze({ label: 'Normal', reaction: 0.28, blockSkill: 0.38, accuracy: 0.75, antiAir: 0.3, comboSkill: 0.5 }),
    hard: Object.freeze({ label: 'Hard', reaction: 0.18, blockSkill: 0.58, accuracy: 0.9, antiAir: 0.55, comboSkill: 0.75 }),
    master: Object.freeze({ label: 'Master', reaction: 0.11, blockSkill: 0.72, accuracy: 0.97, antiAir: 0.75, comboSkill: 0.92 }),
});

export const DEFAULT_DIFFICULTY = 'normal';
