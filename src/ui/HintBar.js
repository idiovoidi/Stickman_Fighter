const P1_KEYS = [['A D', 'Move'], ['W', 'Jump'], ['S', 'Block'], ['J', 'Punch'], ['K', 'Kick'], ['L', 'Sweep'], ['U', 'Super'], ['L-Shift', 'Dash']];
const P2_KEYS = [['← →', 'Move'], ['↑', 'Jump'], ['↓', 'Block'], [',', 'Punch'], ['.', 'Kick'], ['/', 'Sweep'], [';', 'Super'], ['R-Shift', 'Dash']];

/** Bottom strip listing the controls relevant to the current mode. */
export class HintBar {
    constructor({ root }) {
        this.root = root;
    }

    show(mode, { speed = 1 } = {}) {
        const groups = {
            auto: [[[`F`, speed > 1 ? 'Speed ×2 (on)' : 'Speed ×2'], ['Esc', 'Pause'], ['M', 'Mute'], ['`', 'Hitboxes']]],
            pvai: [P1_KEYS, [['Esc', 'Pause'], ['M', 'Mute']]],
            pvp: [P1_KEYS, P2_KEYS, [['Esc', 'Pause']]],
        }[mode] ?? [];

        this.root.replaceChildren(...groups.flatMap((group, index) => {
            const chips = group.map(([key, label]) => {
                const item = document.createElement('span');
                const kbd = document.createElement('kbd');
                kbd.textContent = key;
                item.append(kbd, ` ${label}`);
                return item;
            });
            if (index === 0) return chips;
            const divider = document.createElement('span');
            divider.className = 'divider';
            return [divider, ...chips];
        }));
    }

    setVisible(visible) {
        this.root.classList.toggle('is-hidden', !visible);
    }
}
