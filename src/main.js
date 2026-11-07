/**
 * Stick Fighter: The Great - composition root.
 * Builds every system, injects dependencies, and wires menus and hotkeys.
 */

import './styles/main.css';

import { SoundFX } from './audio/SoundFX.js';
import { HitResolver } from './combat/HitResolver.js';
import { DEFAULT_DIFFICULTY, DIFFICULTY } from './config/difficulty.js';
import { FIGHTER_ROSTER } from './config/fighterRoster.js';
import { GAME_CONFIG } from './config/gameConfig.js';
import { allBoundCodes } from './config/keyBindings.js';
import { GAME_MODES, createControllers } from './controllers/createControllers.js';
import { GameEngine } from './core/GameEngine.js';
import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { MatchDirector } from './core/MatchDirector.js';
import { createFighter } from './entities/createFighter.js';
import { GameError } from './errors/GameErrors.js';
import { BackdropPainter } from './render/BackdropPainter.js';
import { Camera } from './render/Camera.js';
import { FighterPainter } from './render/FighterPainter.js';
import { Renderer } from './render/Renderer.js';
import { StagePainter } from './render/StagePainter.js';
import { FloatingTextLayer } from './render/effects/FloatingTextLayer.js';
import { ParticleSystem } from './render/effects/ParticleSystem.js';
import { ScreenEffects } from './render/effects/ScreenEffects.js';
import { FeedbackDirector } from './systems/FeedbackDirector.js';
import { Announcer } from './ui/Announcer.js';
import { HUD } from './ui/HUD.js';
import { HintBar } from './ui/HintBar.js';
import { MenuController } from './ui/MenuController.js';
import { SettingsStore } from './utils/SettingsStore.js';
import { requireElement } from './utils/dom.js';
import { EventBus } from './utils/EventBus.js';

const isRosterPick = (value) => value === 'random' || FIGHTER_ROSTER.some((profile) => profile.id === value);

function createSettings() {
    return new SettingsStore(
        'stick-fighter.settings',
        { mode: 'auto', difficulty: DEFAULT_DIFFICULTY, p1: 'random', p2: 'random', muted: false },
        {
            mode: (value) => Object.hasOwn(GAME_MODES, value),
            difficulty: (value) => Object.hasOwn(DIFFICULTY, value),
            p1: isRosterPick,
            p2: isRosterPick,
            muted: (value) => typeof value === 'boolean',
        },
    );
}

function showFatal(error) {
    console.error(error);
    const screen = document.getElementById('fatal');
    if (!screen) return;
    screen.querySelector('.fatal-message').textContent = error instanceof GameError
        ? error.message
        : 'An unexpected error stopped the game.';
    screen.classList.remove('hidden');
}

function bootstrap() {
    const config = GAME_CONFIG;
    const app = requireElement('#app');
    const events = new EventBus();
    const settings = createSettings();
    const audio = new SoundFX({ muted: settings.get('muted') });

    const input = new InputManager();
    input.attach();
    input.registerGameKeys(allBoundCodes());

    const camera = new Camera({ config: config.camera, arena: config.arena });
    const particles = new ParticleSystem();
    const floatingText = new FloatingTextLayer();
    const screenFx = new ScreenEffects();
    const renderer = new Renderer({
        canvas: requireElement('#stage'),
        camera,
        backdrop: new BackdropPainter(),
        stage: new StagePainter({ arena: config.arena }),
        fighterPainter: new FighterPainter(),
        particles,
        floatingText,
        screenFx,
    });
    new FeedbackDirector({ events, particles, floatingText, camera, screenFx, audio });

    const hud = new HUD({ root: requireElement('#hud') });
    const hints = new HintBar({ root: requireElement('#hint') });
    new Announcer({ root: requireElement('#announcer'), events });

    const engine = new GameEngine({
        config,
        events,
        input,
        director: new MatchDirector({ events, config: config.match }),
        renderer,
        camera,
        hud,
        hitResolver: new HitResolver({ events, config: config.combat }),
        createFighter,
        createControllers,
        roster: FIGHTER_ROSTER,
    });

    const loop = new GameLoop({
        ...config.loop,
        update: (dt) => engine.update(dt),
        render: () => engine.render(),
        onFatal: showFatal,
    });

    const setOverlayMode = (menuOpen) => {
        app.classList.toggle('menu-open', menuOpen);
        hud.setVisible(!menuOpen);
        hints.setVisible(!menuOpen);
    };

    const startAttract = () => {
        loop.timeScale = 1;
        engine.startMatch({ mode: 'auto', difficulty: settings.get('difficulty') });
    };

    const startFromSettings = () => {
        const { mode, difficulty, p1, p2 } = settings.snapshot();
        loop.timeScale = 1;
        engine.startMatch({ mode, difficulty, picks: [p1, p2] });
        menu.hide();
        setOverlayMode(false);
        hints.show(mode, { speed: loop.timeScale });
    };

    const exitToMenu = () => {
        startAttract();
        menu.show('menu');
        setOverlayMode(true);
    };

    const menu = new MenuController({
        screens: {
            menu: requireElement('#menu'),
            pause: requireElement('#pause'),
            results: requireElement('#results'),
        },
        roster: FIGHTER_ROSTER,
        difficulties: DIFFICULTY,
        settings,
        handlers: {
            start: startFromSettings,
            resume: () => {
                menu.hide();
                engine.resume();
            },
            restart: () => {
                menu.hide();
                engine.rematch();
            },
            rematch: () => {
                menu.hide();
                engine.rematch();
            },
            exit: exitToMenu,
        },
    });

    const togglePause = () => {
        if (menu.current === 'menu' || menu.current === 'results') return;
        if (engine.paused) {
            menu.hide();
            engine.resume();
        } else {
            engine.pause();
            menu.show('pause');
        }
    };

    input.onHotkey(['Escape', 'KeyP'], togglePause);
    input.onHotkey('KeyM', () => settings.set('muted', audio.toggleMute()));
    input.onHotkey('Backquote', () => engine.toggleDebug());
    input.onHotkey('KeyF', () => {
        if (engine.mode !== 'auto' || menu.isOpen) return;
        loop.timeScale = loop.timeScale === 1 ? 2 : 1;
        hints.show('auto', { speed: loop.timeScale });
    });

    events.on('match:over', ({ winner, wins, autoContinue }) => {
        if (autoContinue) return;
        setTimeout(() => {
            if (menu.isOpen) return;
            menu.showResults({
                title: winner ? `${winner.name} WINS` : 'DRAW GAME',
                subtitle: `Rounds ${wins[0]} – ${wins[1]}`,
                color: winner?.profile.color,
            });
        }, 2600);
    });

    const unlockAudio = () => audio.unlock();
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('resize', () => renderer.resize());
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && engine.mode !== 'auto' && !engine.paused && !menu.isOpen) togglePause();
    });

    startAttract();
    menu.show('menu');
    setOverlayMode(true);
    loop.start();

    window.stickFighter = { engine, loop, settings };
}

try {
    bootstrap();
} catch (error) {
    showFatal(error);
}
