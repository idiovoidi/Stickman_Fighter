/**
 * FeedbackDirector - translates gameplay events into juice: particles, floating text,
 * camera shake, screen flashes and sound. Gameplay code never talks to these directly.
 */
export class FeedbackDirector {
    constructor({ events, particles, floatingText, camera, screenFx, audio }) {
        this.particles = particles;
        this.floatingText = floatingText;
        this.camera = camera;
        this.screenFx = screenFx;
        this.audio = audio;

        events.on('combat:hit', (hit) => this.#onHit(hit));
        events.on('fighter:strike', ({ move }) => audio.whoosh(move.heavy));
        events.on('fighter:jump', ({ fighter }) => this.#dustAt(fighter, { count: 5, rise: 40 }));
        events.on('fighter:dash', ({ fighter }) => this.#dustAt(fighter, { count: 7, spread: 50, rise: 30 }));
        events.on('fighter:land', ({ fighter, impact }) => this.#onLand(fighter, impact));
        events.on('fighter:knockdown', ({ fighter }) => this.#onKnockdown(fighter));
        events.on('fighter:super', ({ fighter, move }) => this.#onSuper(fighter, move));
        events.on('round:intro', () => audio.tick());
        events.on('round:fight', () => audio.gong());
        events.on('round:ko', () => this.#onKnockout());
    }

    #onHit({ attacker, defender, move, point, direction, blocked, guardBreak, damage, counter, ko, comboHits }) {
        const { particles, floatingText, camera, screenFx, audio } = this;

        if (blocked) {
            particles.sparks(point.x, point.y, { count: 9, color: '#9be7ff', speed: 380, direction: -direction, spread: 1.6, life: 0.25 });
            particles.ring(point.x, point.y, { color: 'rgba(155, 231, 255, 0.8)', radius: 28, width: 3, life: 0.2 });
            floatingText.spawn(guardBreak ? 'GUARD BREAK!' : 'BLOCK', point.x, point.y - 24, {
                color: guardBreak ? '#ffb347' : '#9be7ff', size: guardBreak ? 26 : 16, life: guardBreak ? 1.1 : 0.5, rise: 40,
            });
            camera.addTrauma(guardBreak ? 0.35 : 0.12);
            audio.block();
            if (guardBreak) audio.hit(0.5);
            return;
        }

        const power = ko ? 1 : move.meterCost ? 0.9 : move.heavy ? 0.6 : 0.35;
        const accent = attacker.profile.accent;
        particles.sparks(point.x, point.y, { count: Math.round(10 + power * 24), color: accent, speed: 480 + power * 650, direction, spread: 1.9 });
        particles.sparks(point.x, point.y, { count: Math.round(5 + power * 8), color: '#ffffff', speed: 300 + power * 300, life: 0.2, width: 2 });
        particles.ring(point.x, point.y, { color: 'rgba(255, 255, 255, 0.9)', radius: 30 + power * 55, width: 3 + power * 4 });

        floatingText.spawn(Math.max(1, Math.round(damage)), point.x, point.y - 18, {
            size: 22 + power * 18, color: power >= 0.6 ? '#ffd166' : '#ffffff', drift: direction * 18,
        });
        if (counter) floatingText.spawn('COUNTER!', point.x, point.y - 52, { color: '#ff6b6b', size: 24, life: 0.9 });
        if (comboHits >= 2 && !ko) {
            const head = defender.joints().head;
            floatingText.spawn(`${comboHits} HITS`, head.x - direction * 70, head.y - 40, { color: attacker.profile.color, size: 20 + comboHits * 2, life: 0.9, rise: 30 });
        }

        camera.addTrauma(0.16 + power * 0.45);
        if (power >= 0.6) screenFx.flash(0.08 + power * 0.1);
        audio.hit(power);
    }

    #onLand(fighter, impact) {
        if (impact < 500) return;
        this.#dustAt(fighter, { count: 6, spread: 40, rise: 35 });
        this.audio.land(impact);
    }

    #onKnockdown(fighter) {
        this.#dustAt(fighter, { count: 14, spread: 110, rise: 50, size: 14 });
        this.camera.addTrauma(0.3);
        this.audio.thud();
    }

    #onSuper(fighter, move) {
        const head = fighter.joints().head;
        this.screenFx.dimFor(0.6, 0.35);
        this.screenFx.flash(0.15, '255, 230, 160');
        this.particles.ring(head.x, head.y + 30, { color: 'rgba(255, 230, 160, 0.9)', radius: 160, width: 6, life: 0.45 });
        this.floatingText.spawn(move.label, head.x, head.y - 50, { color: fighter.profile.accent, size: 34, life: 1.1, rise: 25 });
        this.audio.charge();
    }

    #onKnockout() {
        this.screenFx.flash(0.55);
        this.camera.addTrauma(0.8);
        this.audio.knockout();
    }

    #dustAt(fighter, options) {
        this.particles.dust(fighter.body.x, -2, options);
    }
}
