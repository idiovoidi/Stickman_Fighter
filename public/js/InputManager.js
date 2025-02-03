export class InputManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.keyMap = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => this.handleKeyUp(event));
    }

    handleKeyDown(event) {
        this.keyMap.set(event.key, true);
        
        switch(event.key) {
            case 'r':
                this.gameEngine.reset();
                break;
            case 'p':
                this.gameEngine.togglePause();
                break;
            case 'Escape':
                // Could be used for menu
                break;
        }
    }

    handleKeyUp(event) {
        this.keyMap.delete(event.key);
    }

    isKeyPressed(key) {
        return this.keyMap.has(key);
    }
} 