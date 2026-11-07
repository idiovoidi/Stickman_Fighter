import { requireElement } from '../utils/dom.js';

/** Big centre-screen callouts: ROUND 1, FIGHT!, K.O., winner banners. */
export class Announcer {
    constructor({ root, events }) {
        this.root = root;
        this.main = requireElement('.announce-main', root);
        this.sub = requireElement('.announce-sub', root);
        this.timeout = 0;

        events.on('round:intro', ({ round, final, matchNumber }) => {
            this.show(final ? 'FINAL ROUND' : `ROUND ${round}`, { sub: matchNumber > 1 && round === 1 ? `MATCH ${matchNumber}` : '', duration: 1.4 });
        });
        events.on('round:fight', () => this.show('FIGHT!', { color: '#ffd166', duration: 0.9 }));
        events.on('round:ko', ({ double }) => this.show(double ? 'DOUBLE K.O.' : 'K.O.', { color: '#ff4f6d', duration: 2.0 }));
        events.on('round:timeover', () => this.show('TIME!', { color: '#4ff3ff', duration: 1.8 }));
        events.on('round:over', ({ winner, perfect }) => {
            if (!winner) this.show('DRAW', { duration: 1.8 });
            else this.show(`${winner.name} WINS`, { sub: perfect ? 'PERFECT' : '', color: winner.profile.color, duration: 1.9 });
        });
        events.on('match:over', ({ winner, wins, autoContinue }) => {
            const sub = autoContinue ? `${wins[0]} – ${wins[1]} · next match incoming` : `${wins[0]} – ${wins[1]}`;
            if (!winner) this.show('DRAW GAME', { sub, duration: 3.6 });
            else this.show(winner.name, { sub: `WINS THE MATCH · ${sub}`, color: winner.profile.color, duration: 3.6 });
        });
    }

    show(text, { sub = '', color = '#ffffff', duration = 1.2 } = {}) {
        this.root.style.setProperty('--tone', color);
        this.root.style.setProperty('--duration', `${duration}s`);
        this.main.textContent = text;
        this.sub.textContent = sub;
        this.root.classList.remove('show');
        void this.root.offsetWidth;
        this.root.classList.add('show');
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.root.classList.remove('show'), duration * 1000);
    }
}
