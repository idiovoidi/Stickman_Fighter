const PUNCH_CHAIN = Object.freeze({ jab: 'cross', cross: 'uppercut' });

/** Translates keyboard input into fighter intents, with a short attack buffer. */
export class HumanController {
    constructor({ fighter, input, bindings, bufferWindow = 0.15 }) {
        this.fighter = fighter;
        this.input = input;
        this.bindings = bindings;
        this.bufferWindow = bufferWindow;
        this.buffer = null;
    }

    reset() {
        this.buffer = null;
    }

    think(dt) {
        const { input, bindings, fighter } = this;
        const intent = {
            move: input.axis(bindings.left, bindings.right),
            jump: input.consume(bindings.jump),
            block: input.isHeld(bindings.block),
            attack: null,
            dash: 0,
        };
        if (input.consume(bindings.dash)) intent.dash = intent.move || -fighter.body.facing;

        const requested = this.#readAttack();
        if (requested) this.buffer = { id: requested, remaining: this.bufferWindow, serial: fighter.attackSerial };

        if (this.buffer) {
            this.buffer.remaining -= dt;
            if (fighter.attackSerial !== this.buffer.serial || this.buffer.remaining <= 0) {
                this.buffer = null;
            } else {
                intent.attack = this.buffer.id;
            }
        }
        return intent;
    }

    #readAttack() {
        const { input, bindings, fighter } = this;
        const airborne = !fighter.body.grounded;
        const current = fighter.attack?.move.id;

        if (input.consume(bindings.super)) return airborne ? null : 'super';
        if (input.consume(bindings.punch)) return airborne ? 'flyingKick' : PUNCH_CHAIN[current] ?? 'jab';
        if (input.consume(bindings.kick)) return airborne ? 'flyingKick' : 'roundhouse';
        if (input.consume(bindings.sweep)) return airborne ? 'flyingKick' : 'sweep';
        return null;
    }
}
