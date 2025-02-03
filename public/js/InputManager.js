class InputManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
    }

    handleKeyDown(event) {
        switch(event.key) {
            case 'r':
                this.gameEngine.reset();
                break;
            case 'p':
                this.gameEngine.togglePause();
                break;
        }
    }
} 