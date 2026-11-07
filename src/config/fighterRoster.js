/**
 * Fighter archetypes. `stats` are multipliers on the base values in gameConfig;
 * `personality` values (0..1) steer the AI's decisions.
 */
export const FIGHTER_ROSTER = Object.freeze([
    {
        id: 'crimson',
        name: 'CRIMSON',
        title: 'The Brawler',
        color: '#ff4d5e',
        accent: '#ffd166',
        stats: { power: 1.15, speed: 0.95, defense: 1.0, health: 1.0 },
        personality: { aggression: 0.85, caution: 0.25, jumpiness: 0.25, kickBias: 0.3, comboDrive: 0.8 },
    },
    {
        id: 'azure',
        name: 'AZURE',
        title: 'The Wind',
        color: '#3fb8ff',
        accent: '#e0f7ff',
        stats: { power: 0.9, speed: 1.2, defense: 0.9, health: 0.95 },
        personality: { aggression: 0.6, caution: 0.45, jumpiness: 0.55, kickBias: 0.7, comboDrive: 0.6 },
    },
    {
        id: 'verdant',
        name: 'VERDANT',
        title: 'The Wall',
        color: '#4ade80',
        accent: '#d9f99d',
        stats: { power: 1.0, speed: 0.85, defense: 1.2, health: 1.15 },
        personality: { aggression: 0.45, caution: 0.75, jumpiness: 0.1, kickBias: 0.5, comboDrive: 0.5 },
    },
    {
        id: 'amber',
        name: 'AMBER',
        title: 'The Trickster',
        color: '#ffb347',
        accent: '#ff6ad5',
        stats: { power: 0.95, speed: 1.1, defense: 0.95, health: 1.0 },
        personality: { aggression: 0.65, caution: 0.35, jumpiness: 0.8, kickBias: 0.6, comboDrive: 0.55 },
    },
    {
        id: 'violet',
        name: 'VIOLET',
        title: 'The Counter',
        color: '#b388ff',
        accent: '#7df9ff',
        stats: { power: 1.05, speed: 1.0, defense: 1.05, health: 1.0 },
        personality: { aggression: 0.4, caution: 0.85, jumpiness: 0.3, kickBias: 0.45, comboDrive: 0.9 },
    },
    {
        id: 'onyx',
        name: 'ONYX',
        title: 'The Shadow',
        color: '#e5e7eb',
        accent: '#ff2e63',
        stats: { power: 1.1, speed: 1.05, defense: 0.9, health: 0.95 },
        personality: { aggression: 0.75, caution: 0.5, jumpiness: 0.45, kickBias: 0.5, comboDrive: 0.7 },
    },
]);
