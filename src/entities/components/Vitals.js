import { clamp } from '../../utils/math.js';

/** Health, stamina (spent by attacks and blocking) and super meter. */
export class Vitals {
    constructor({ maxHealth, maxStamina, staminaRegen, staminaRegenDelay, maxMeter }) {
        this.maxHealth = maxHealth;
        this.maxStamina = maxStamina;
        this.staminaRegen = staminaRegen;
        this.staminaRegenDelay = staminaRegenDelay;
        this.maxMeter = maxMeter;
        this.meter = 0;
        this.reset();
    }

    get healthRatio() {
        return this.health / this.maxHealth;
    }

    get meterFull() {
        return this.meter >= this.maxMeter;
    }

    reset({ keepMeter = true } = {}) {
        this.health = this.maxHealth;
        this.stamina = this.maxStamina;
        this.regenCooldown = 0;
        if (!keepMeter) this.meter = 0;
    }

    damage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    /** Spends stamina if enough is available; returns whether it was spent. */
    spendStamina(amount) {
        if (amount <= 0) return true;
        if (this.stamina < amount) return false;
        this.stamina -= amount;
        this.regenCooldown = this.staminaRegenDelay;
        return true;
    }

    drainStamina() {
        this.stamina = 0;
        this.regenCooldown = this.staminaRegenDelay * 2;
    }

    addMeter(amount) {
        this.meter = clamp(this.meter + amount, 0, this.maxMeter);
    }

    spendMeter(amount) {
        this.meter = clamp(this.meter - amount, 0, this.maxMeter);
    }

    update(dt) {
        if (this.regenCooldown > 0) {
            this.regenCooldown -= dt;
            return;
        }
        this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
    }
}
