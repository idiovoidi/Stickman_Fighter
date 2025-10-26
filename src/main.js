/**
 * Stick Fighter - Main Entry Point
 * Modern ES6+ game built with Matter.js physics
 */

import { GameEngine } from './core/GameEngine.js';
import { UIManager } from './systems/UIManager.js';

class StickFighterGame {
    constructor() {
        this.gameEngine = null;
        this.uiManager = null;
        this.isInitialized = false;

        this.init();
    }

    async init() {
        try {
            console.log('🎮 Initializing Stick Fighter...');

            // Show loading screen
            this.showLoading();

            // Initialize UI first
            this.uiManager = new UIManager();
            await this.uiManager.init();

            // Initialize game engine
            this.gameEngine = new GameEngine();
            await this.gameEngine.init();

            // Connect UI to game
            this.uiManager.setGameEngine(this.gameEngine);
            this.gameEngine.setUIManager(this.uiManager);

            // Start the game
            this.gameEngine.start();

            // Hide loading screen
            this.hideLoading();

            this.isInitialized = true;
            console.log('✅ Stick Fighter initialized successfully!');

        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            this.showError('Failed to load game. Please refresh the page.');
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
        }
    }

    showError(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div style="text-align: center; color: #ff4444;">
                    <h2>⚠️ Error</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: #00d4ff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Refresh Page</button>
                </div>
            `;
        }
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Make the game globally accessible for debugging
    window.StickFighterGame = new StickFighterGame();
});

// Handle page visibility changes (pause when tab is not active)
document.addEventListener('visibilitychange', () => {
    if (window.StickFighterGame && window.StickFighterGame.gameEngine) {
        if (document.hidden) {
            window.StickFighterGame.gameEngine.pause();
        } else {
            window.StickFighterGame.gameEngine.resume();
        }
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.StickFighterGame && window.StickFighterGame.gameEngine && window.StickFighterGame.gameEngine.handleResize) {
        window.StickFighterGame.gameEngine.handleResize();
    }
});
