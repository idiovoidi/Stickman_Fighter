/**
 * InputManager - Handles all user input (keyboard, mouse, touch)
 * Provides clean interface for game controls
 */

export class InputManager {
    constructor() {
        this.keys = new Set();
        this.keyBindings = new Map();
        this.gameEngine = null;

        this.setupDefaultBindings();
    }

    init(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupEventListeners();
    }

    setupDefaultBindings() {
        // Default key bindings for two players
        this.keyBindings.set('player1_left', 'KeyA');
        this.keyBindings.set('player1_right', 'KeyD');
        this.keyBindings.set('player1_jump', 'KeyW');
        this.keyBindings.set('player1_attack', 'Space');

        this.keyBindings.set('player2_left', 'ArrowLeft');
        this.keyBindings.set('player2_right', 'ArrowRight');
        this.keyBindings.set('player2_jump', 'ArrowUp');
        this.keyBindings.set('player2_attack', 'Enter');

        // Global controls
        this.keyBindings.set('pause', 'KeyP');
        this.keyBindings.set('reset', 'KeyR');
        this.keyBindings.set('debug', 'KeyD');
        this.keyBindings.set('menu', 'Escape');
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        // Prevent default browser behavior for game keys
        document.addEventListener('keydown', (e) => {
            if (this.isGameKey(e.code)) {
                e.preventDefault();
            }
        });

        // Touch/Mobile support
        this.setupTouchControls();
    }

    setupTouchControls() {
        // Create virtual buttons for mobile
        this.createVirtualButton('attack-btn', 'Attack', () => {
            this.triggerAction('attack');
        });

        this.createVirtualButton('jump-btn', 'Jump', () => {
            this.triggerAction('jump');
        });

        // Show/hide virtual controls based on device
        this.updateVirtualControls();
        window.addEventListener('resize', this.updateVirtualControls.bind(this));
    }

    createVirtualButton(id, text, callback) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.className = 'virtual-button';
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            callback();
        });

        // Add styles
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: ${id === 'attack-btn' ? '20px' : '120px'};
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(0, 212, 255, 0.8);
            color: white;
            border: none;
            font-size: 12px;
            font-weight: bold;
            touch-action: none;
            display: none;
            z-index: 1000;
        `;

        document.body.appendChild(button);
        this.virtualButtons = this.virtualButtons || new Map();
        this.virtualButtons.set(id, button);
    }

    updateVirtualControls() {
        const shouldShow = window.innerWidth <= 768;
        this.virtualButtons?.forEach(button => {
            button.style.display = shouldShow ? 'block' : 'none';
        });
    }

    handleKeyDown(event) {
        this.keys.add(event.code);

        // Handle specific key actions
        switch (event.code) {
            case this.keyBindings.get('pause'):
                this.gameEngine.togglePause();
                break;

            case this.keyBindings.get('reset'):
                this.gameEngine.reset();
                break;

            case this.keyBindings.get('debug'):
                this.gameEngine.toggleDebug();
                break;

            case this.keyBindings.get('player1_left'):
                this.gameEngine.fighters[0]?.move(-1);
                break;

            case this.keyBindings.get('player1_right'):
                this.gameEngine.fighters[0]?.move(1);
                break;

            case this.keyBindings.get('player1_jump'):
                this.gameEngine.fighters[0]?.executeMove('jump');
                break;

            case this.keyBindings.get('player1_attack'):
                this.gameEngine.fighters[0]?.executeMove('punch');
                break;

            case this.keyBindings.get('player2_left'):
                this.gameEngine.fighters[1]?.move(-1);
                break;

            case this.keyBindings.get('player2_right'):
                this.gameEngine.fighters[1]?.move(1);
                break;

            case this.keyBindings.get('player2_jump'):
                this.gameEngine.fighters[1]?.executeMove('jump');
                break;

            case this.keyBindings.get('player2_attack'):
                this.gameEngine.fighters[1]?.executeMove('punch');
                break;
        }
    }

    handleKeyUp(event) {
        this.keys.delete(event.code);

        // Handle key release actions
        switch (event.code) {
            case this.keyBindings.get('player1_left'):
            case this.keyBindings.get('player1_right'):
                this.gameEngine.fighters[0]?.stopMoving();
                break;

            case this.keyBindings.get('player2_left'):
            case this.keyBindings.get('player2_right'):
                this.gameEngine.fighters[1]?.stopMoving();
                break;
        }
    }

    isGameKey(keyCode) {
        return Array.from(this.keyBindings.values()).includes(keyCode);
    }

    update(deltaTime) {
        // Handle continuous key presses (like movement)
        if (this.keys.has(this.keyBindings.get('player1_left'))) {
            this.gameEngine.fighters[0]?.move(-1);
        }

        if (this.keys.has(this.keyBindings.get('player1_right'))) {
            this.gameEngine.fighters[0]?.move(1);
        }

        if (this.keys.has(this.keyBindings.get('player2_left'))) {
            this.gameEngine.fighters[1]?.move(-1);
        }

        if (this.keys.has(this.keyBindings.get('player2_right'))) {
            this.gameEngine.fighters[1]?.move(1);
        }
    }

    triggerAction(action, player = 0) {
        const fighter = this.gameEngine.fighters[player];
        if (!fighter) return;

        switch (action) {
            case 'jump':
                fighter.executeMove('jump');
                break;
            case 'attack':
                fighter.executeMove('punch');
                break;
            case 'kick':
                fighter.executeMove('kick');
                break;
            case 'block':
                fighter.executeMove('block');
                break;
        }
    }

    // Configuration methods
    setKeyBinding(action, key) {
        this.keyBindings.set(action, key);
    }

    getKeyBinding(action) {
        return this.keyBindings.get(action);
    }

    // Query methods
    isKeyPressed(key) {
        return this.keys.has(key);
    }

    isActionPressed(action) {
        return this.keys.has(this.keyBindings.get(action));
    }

    // Cleanup
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);

        // Remove virtual buttons
        this.virtualButtons?.forEach(button => {
            if (button.parentNode) {
                button.parentNode.removeChild(button);
            }
        });
    }
}
