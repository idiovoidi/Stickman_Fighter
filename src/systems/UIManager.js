/**
 * UIManager - Manages all user interface elements
 * Handles menus, HUD, health bars, and user interactions
 */

export class UIManager {
    constructor() {
        this.gameEngine = null;
        this.uiElements = new Map();
        this.menus = new Map();
        this.animations = new Map();

        this.config = {
            showHealthBars: true,
            showControls: true,
            showDebugInfo: false,
            fadeSpeed: 0.02
        };

        this.isInitialized = false;
    }

    async init() {
        console.log('🖥️ Initializing UI Manager...');

        this.setupUIElements();
        this.setupMenus();
        this.setupEventListeners();
        this.setupAnimations();

        this.isInitialized = true;
        console.log('✅ UI Manager initialized');
    }

    setupUIElements() {
        // Health bars
        this.createHealthBars();

        // Game title
        this.createGameTitle();

        // Controls display
        this.createControlsDisplay();

        // Debug panel
        this.createDebugPanel();
    }

    createHealthBars() {
        const healthBarsContainer = document.createElement('div');
        healthBarsContainer.id = 'health-bars';
        healthBarsContainer.className = 'game-ui';

        // Player 1 health bar
        const player1Bar = document.createElement('div');
        player1Bar.className = 'health-bar';
        player1Bar.innerHTML = `
            <div class="health-fill player1"></div>
            <div class="health-text">Player 1: <span class="health-percent">100%</span></div>
        `;

        // Player 2 health bar
        const player2Bar = document.createElement('div');
        player2Bar.className = 'health-bar';
        player2Bar.innerHTML = `
            <div class="health-fill player2"></div>
            <div class="health-text">Player 2: <span class="health-percent">100%</span></div>
        `;

        healthBarsContainer.appendChild(player1Bar);
        healthBarsContainer.appendChild(player2Bar);

        // Add to UI overlay
        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.appendChild(healthBarsContainer);
        }

        this.uiElements.set('healthBars', healthBarsContainer);
        this.uiElements.set('player1Health', player1Bar);
        this.uiElements.set('player2Health', player2Bar);
    }

    createGameTitle() {
        const title = document.getElementById('game-title');
        if (title) {
            this.uiElements.set('gameTitle', title);
        }
    }

    createControlsDisplay() {
        const controls = document.getElementById('controls');
        if (controls) {
            this.uiElements.set('controls', controls);
        }
    }

    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.className = 'game-ui hidden';
        debugPanel.style.cssText = `
            position: absolute;
            top: 150px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: monospace;
            font-size: 12px;
            max-width: 200px;
            z-index: 200;
        `;

        debugPanel.innerHTML = `
            <div><strong>Debug Panel</strong></div>
            <div>FPS: <span id="debug-fps">60</span></div>
            <div>Bodies: <span id="debug-bodies">0</span></div>
            <div>State: <span id="debug-state">playing</span></div>
            <div>Round: <span id="debug-round">1</span></div>
            <div>Time: <span id="debug-time">0</span></div>
        `;

        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.appendChild(debugPanel);
        }

        this.uiElements.set('debugPanel', debugPanel);
    }

    setupMenus() {
        // Main menu
        this.createMainMenu();

        // Pause menu
        this.createPauseMenu();

        // Game over menu
        this.createGameOverMenu();
    }

    createMainMenu() {
        const menu = document.createElement('div');
        menu.id = 'main-menu';
        menu.className = 'menu hidden';
        menu.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 300;
        `;

        menu.innerHTML = `
            <h1 style="color: #00d4ff; font-size: 4em; margin-bottom: 40px; text-shadow: 0 0 20px #00d4ff;">Stick Fighter</h1>
            <div style="text-align: center; margin-bottom: 40px;">
                <p style="color: white; font-size: 1.2em; margin-bottom: 10px;">Choose Game Mode:</p>
                <button class="menu-button" data-action="start-single">Single Player</button>
                <button class="menu-button" data-action="start-multi">Two Players</button>
                <button class="menu-button" data-action="settings">Settings</button>
            </div>
            <div style="color: #666; font-size: 0.9em;">
                <p>Built with Matter.js • Modern Web Technologies</p>
            </div>
        `;

        // Add button styles
        const style = document.createElement('style');
        style.textContent = `
            .menu-button {
                display: block;
                margin: 10px auto;
                padding: 15px 30px;
                background: linear-gradient(45deg, #00d4ff, #ff6b6b);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 1.1em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
                min-width: 200px;
            }

            .menu-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 212, 255, 0.3);
            }

            .menu-button:active {
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);

        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.appendChild(menu);
        }

        this.menus.set('main', menu);
        this.setupMenuButtons(menu);
    }

    createPauseMenu() {
        const menu = document.createElement('div');
        menu.id = 'pause-menu';
        menu.className = 'menu hidden';
        menu.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 300;
        `;

        menu.innerHTML = `
            <h2 style="color: #00d4ff; font-size: 3em; margin-bottom: 40px;">Paused</h2>
            <div style="text-align: center;">
                <button class="menu-button" data-action="resume">Resume</button>
                <button class="menu-button" data-action="restart">Restart</button>
                <button class="menu-button" data-action="main-menu">Main Menu</button>
            </div>
        `;

        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.appendChild(menu);
        }

        this.menus.set('pause', menu);
        this.setupMenuButtons(menu);
    }

    createGameOverMenu() {
        const menu = document.createElement('div');
        menu.id = 'game-over-menu';
        menu.className = 'menu hidden';
        menu.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 300;
        `;

        menu.innerHTML = `
            <h2 style="color: #ff6b6b; font-size: 3em; margin-bottom: 20px;">Game Over</h2>
            <div id="winner-text" style="color: #00d4ff; font-size: 2em; margin-bottom: 40px;"></div>
            <div style="text-align: center;">
                <button class="menu-button" data-action="play-again">Play Again</button>
                <button class="menu-button" data-action="main-menu">Main Menu</button>
            </div>
        `;

        const uiOverlay = document.getElementById('ui-overlay');
        if (uiOverlay) {
            uiOverlay.appendChild(menu);
        }

        this.menus.set('gameOver', menu);
        this.setupMenuButtons(menu);
    }

    setupMenuButtons(menu) {
        const buttons = menu.querySelectorAll('.menu-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
            });
        });
    }

    setupEventListeners() {
        // Listen for game state changes
        if (this.gameEngine) {
            this.gameEngine.getGameState().addEventListener('stateChanged', this.onGameStateChanged.bind(this));
            this.gameEngine.getGameState().addEventListener('fighterStateUpdated', this.onFighterStateUpdated.bind(this));
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Escape':
                    this.togglePauseMenu();
                    break;
                case 'KeyM':
                    this.showMainMenu();
                    break;
            }
        });
    }

    setupAnimations() {
        // Set up UI animations
        this.animations.set('fadeIn', {
            duration: 500,
            easing: 'ease-out'
        });

        this.animations.set('slideIn', {
            duration: 300,
            easing: 'ease-out'
        });
    }

    // Update methods
    update(deltaTime) {
        if (!this.isInitialized || !this.gameEngine) return;

        this.updateHealthBars();
        this.updateDebugPanel();
        this.updateAnimations(deltaTime);
    }

    updateHealthBars() {
        if (!this.config.showHealthBars) return;

        const gameState = this.gameEngine?.getGameState();
        if (!gameState) return;

        const player1State = gameState.getFighterState('player1');
        const player2State = gameState.getFighterState('player2');

        if (player1State) {
            this.updateHealthBar('player1', player1State.health, player1State.stamina);
        }

        if (player2State) {
            this.updateHealthBar('player2', player2State.health, player2State.stamina);
        }
    }

    updateHealthBar(player, health, stamina) {
        const healthBar = this.uiElements.get(`${player}Health`);
        if (!healthBar) return;

        const healthPercent = (health / 100) * 100;
        const staminaPercent = (stamina / 100) * 100;

        const healthFill = healthBar.querySelector('.health-fill');
        const healthText = healthBar.querySelector('.health-percent');

        if (healthFill) {
            healthFill.style.width = `${healthPercent}%`;
            healthFill.style.background = healthPercent > 50 ? '#27ae60' :
                                         healthPercent > 25 ? '#f39c12' : '#e74c3c';
        }

        if (healthText) {
            healthText.textContent = `${Math.round(healthPercent)}%`;
        }
    }

    updateDebugPanel() {
        if (!this.config.showDebugInfo) return;

        const debugPanel = this.uiElements.get('debugPanel');
        if (!debugPanel) return;

        const gameState = this.gameEngine?.getGameState();
        if (!gameState) return;

        // Update debug values
        const fps = this.getFPS();
        const bodies = this.gameEngine?.getPhysicsEngine()?.world.bodies.length || 0;
        const state = gameState.getState();
        const round = gameState.round;
        const time = Math.round(gameState.getTimeRemaining());

        debugPanel.querySelector('#debug-fps').textContent = fps;
        debugPanel.querySelector('#debug-bodies').textContent = bodies;
        debugPanel.querySelector('#debug-state').textContent = state;
        debugPanel.querySelector('#debug-round').textContent = round;
        debugPanel.querySelector('#debug-time').textContent = time;
    }

    updateAnimations(deltaTime) {
        // Update active animations
        this.animations.forEach((animation, name) => {
            if (animation.isActive) {
                animation.progress += deltaTime;
                if (animation.progress >= animation.duration) {
                    animation.progress = animation.duration;
                    animation.isActive = false;
                    animation.onComplete?.();
                }
            }
        });
    }

    // Event handlers
    onGameStateChanged(event) {
        const { currentState } = event.detail;

        switch (currentState) {
            case 'playing':
                this.hideAllMenus();
                this.showHealthBars();
                break;
            case 'paused':
                this.showPauseMenu();
                break;
            case 'game_over':
                this.showGameOverMenu();
                break;
            case 'menu':
                this.showMainMenu();
                break;
        }
    }

    onFighterStateUpdated(event) {
        const { player, state } = event.detail;
        this.updateHealthBar(player, state.health, state.stamina);
    }

    handleMenuAction(action) {
        switch (action) {
            case 'start-single':
            case 'start-multi':
                this.hideAllMenus();
                this.gameEngine?.start();
                break;
            case 'resume':
                this.hideAllMenus();
                this.gameEngine?.resume();
                break;
            case 'restart':
                this.hideAllMenus();
                this.gameEngine?.reset();
                this.gameEngine?.start();
                break;
            case 'main-menu':
                this.showMainMenu();
                this.gameEngine?.pause();
                break;
            case 'play-again':
                this.hideAllMenus();
                this.gameEngine?.reset();
                this.gameEngine?.start();
                break;
            case 'settings':
                this.showSettings();
                break;
        }
    }

    // Menu control methods
    showMainMenu() {
        this.hideAllMenus();
        const menu = this.menus.get('main');
        if (menu) {
            menu.classList.remove('hidden');
            this.animateElement(menu, 'fadeIn');
        }
    }

    showPauseMenu() {
        this.hideAllMenus();
        const menu = this.menus.get('pause');
        if (menu) {
            menu.classList.remove('hidden');
            this.animateElement(menu, 'fadeIn');
        }
    }

    showGameOverMenu() {
        this.hideAllMenus();
        const menu = this.menus.get('gameOver');
        if (menu) {
            const winner = this.gameEngine?.getGameState()?.getGameWinner();
            const winnerText = menu.querySelector('#winner-text');

            if (winnerText) {
                winnerText.textContent = winner === 'draw' ? 'Draw!' :
                                       winner === 'player1' ? 'Player 1 Wins!' : 'Player 2 Wins!';
            }

            menu.classList.remove('hidden');
            this.animateElement(menu, 'fadeIn');
        }
    }

    hideAllMenus() {
        this.menus.forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    togglePauseMenu() {
        if (this.gameEngine?.getGameState().isState('paused')) {
            this.hideAllMenus();
            this.gameEngine.resume();
        } else {
            this.showPauseMenu();
            this.gameEngine?.pause();
        }
    }

    showHealthBars() {
        const healthBars = this.uiElements.get('healthBars');
        if (healthBars) {
            healthBars.classList.remove('hidden');
        }
    }

    hideHealthBars() {
        const healthBars = this.uiElements.get('healthBars');
        if (healthBars) {
            healthBars.classList.add('hidden');
        }
    }

    showDebugPanel() {
        const debugPanel = this.uiElements.get('debugPanel');
        if (debugPanel) {
            debugPanel.classList.remove('hidden');
        }
        this.config.showDebugInfo = true;
    }

    hideDebugPanel() {
        const debugPanel = this.uiElements.get('debugPanel');
        if (debugPanel) {
            debugPanel.classList.add('hidden');
        }
        this.config.showDebugInfo = false;
    }

    toggleDebugPanel() {
        if (this.config.showDebugInfo) {
            this.hideDebugPanel();
        } else {
            this.showDebugPanel();
        }
    }

    // Animation methods
    animateElement(element, animationType) {
        const animation = this.animations.get(animationType);
        if (!animation) return;

        element.style.opacity = '0';
        element.style.transform = animationType === 'slideIn' ? 'translateY(20px)' : '';

        // Trigger reflow
        element.offsetHeight;

        element.style.transition = `all ${animation.duration}ms ${animation.easing}`;
        element.style.opacity = '1';
        element.style.transform = animationType === 'slideIn' ? 'translateY(0)' : '';
    }

    // Utility methods
    getFPS() {
        // Simple FPS calculation
        return 60; // Placeholder
    }

    // Configuration
    setGameEngine(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupEventListeners();
    }

    // Cleanup
    destroy() {
        this.uiElements.clear();
        this.menus.clear();
        this.animations.clear();
        this.isInitialized = false;
    }
}
