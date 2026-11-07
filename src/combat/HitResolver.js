import { distanceToSegment } from '../utils/math.js';

/** Body segments that can be struck, with their half-thickness. Arms are deliberately excluded. */
export const HURT_SEGMENTS = Object.freeze([
    ['hip', 'neck', 9],
    ['hip', 'kneeF', 7],
    ['kneeF', 'footF', 6],
    ['hip', 'kneeB', 7],
    ['kneeB', 'footB', 6],
]);

/**
 * Detects contact between active strikes and opposing bodies. Contacts are gathered
 * before any are applied so simultaneous strikes trade instead of favouring one side.
 */
export class HitResolver {
    constructor({ events, config }) {
        this.events = events;
        this.config = config;
    }

    resolve(fighters) {
        const contacts = [];
        for (const attacker of fighters) {
            const attack = attacker.attack;
            if (!attack || attack.phase !== 'active' || attack.hasHit) continue;
            const point = attacker.hitPoint();
            for (const defender of fighters) {
                if (defender === attacker || defender.isInvulnerable) continue;
                if (this.#touches(point, attack.move.radius, defender)) {
                    contacts.push({ attacker, defender, move: attack.move, point: { x: point.x, y: point.y } });
                }
            }
        }
        contacts.forEach((contact) => this.#apply(contact));
    }

    #apply({ attacker, defender, move, point }) {
        const { comboDecay, minComboScale } = this.config;
        const direction = Math.sign(defender.body.x - attacker.body.x) || attacker.body.facing;
        const damageScale = Math.max(minComboScale, 1 - comboDecay * defender.comboHits);
        const outcome = defender.receiveHit({ attacker, move, direction, damageScale });
        if (!outcome) return;
        attacker.onHitLanded(outcome);
        this.events.emit('combat:hit', {
            attacker, defender, move, point, direction, ...outcome, comboHits: defender.comboHits,
        });
    }

    #touches(point, radius, defender) {
        const joints = defender.skeleton.joints;
        const head = joints.head;
        if (Math.hypot(point.x - head.x, point.y - head.y) <= radius + defender.skeleton.bones.headRadius) return true;
        return HURT_SEGMENTS.some(([a, b, thickness]) => (
            distanceToSegment(point.x, point.y, joints[a].x, joints[a].y, joints[b].x, joints[b].y) <= radius + thickness
        ));
    }
}
