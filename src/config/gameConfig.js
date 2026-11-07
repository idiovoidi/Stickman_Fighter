function deepFreeze(object) {
    Object.values(object).forEach((value) => {
        if (value && typeof value === 'object') deepFreeze(value);
    });
    return Object.freeze(object);
}

/** World units: the floor is y = 0 and up is negative. A standing fighter is ~160 units tall. */
export const GAME_CONFIG = deepFreeze({
    arena: { width: 1500, floorY: 0, wallMargin: 40, spawnOffset: 230 },
    loop: { fixedStep: 1 / 60, maxFrameTime: 0.25, maxStepsPerFrame: 8 },
    physics: { gravity: 2600, groundFriction: 9, airControl: 900, maxFallSpeed: 2000 },
    fighter: {
        walkSpeed: 260,
        backwalkRatio: 0.72,
        jumpVelocity: 960,
        jumpCarry: 1.2,
        dashSpeed: 640,
        dashTime: 0.24,
        dashStamina: 8,
        pushboxHalfWidth: 24,
        knockdownTime: 0.85,
        getupTime: 0.45,
        landingLag: 0.12,
    },
    vitals: { maxHealth: 100, maxStamina: 100, staminaRegen: 24, staminaRegenDelay: 0.5, maxMeter: 100 },
    combat: {
        blockDamageRatio: 0.15,
        blockStaminaCost: 9,
        guardBreakStun: 0.9,
        counterBonus: 1.25,
        comboDecay: 0.1,
        minComboScale: 0.45,
        maxJuggles: 2,
        hitstopLight: 0.055,
        hitstopHeavy: 0.1,
        hitstopSuper: 0.18,
        superFreeze: 0.32,
        meterGainOnHit: 0.9,
        meterGainOnHurt: 0.5,
        meterGainOnBlock: 3,
    },
    match: {
        roundsToWin: 2,
        maxRounds: 5,
        roundTime: 60,
        introTime: 1.7,
        koSlowmoTime: 1.1,
        koSlowmoScale: 0.3,
        koTime: 3.2,
        roundOverTime: 2.0,
        matchOverTime: 4.5,
    },
    camera: {
        minZoom: 0.8,
        maxZoom: 1.3,
        floorScreenRatio: 0.8,
        followRate: 4,
        zoomRate: 2.5,
        framePadding: 520,
        referenceHeight: 720,
    },
});
