# Stick Fighter - Modern Combat

A completely overhauled, modern stick figure fighting game built with cutting-edge web technologies and Matter.js physics.

## 🚀 What's New

This is a complete overhaul of the original Stick Fighter game, featuring:

### ✅ Modern Architecture
- **ES6+ JavaScript** with modern module system
- **Vite** build system for lightning-fast development
- **Clean separation of concerns** with modular systems
- **Component-based design** for maintainability

### ✅ Enhanced Gameplay
- **Realistic physics** with Matter.js integration
- **Sophisticated AI** with personality traits and difficulty levels
- **Modern input system** with keyboard and touch support
- **Visual effects** including particles, animations, and screen shake

### ✅ Professional UI/UX
- **Responsive design** that works on all devices
- **Modern styling** with gradients and animations
- **Intuitive controls** with visual feedback
- **Loading screens** and smooth transitions

## 🎮 Features

### Core Systems
- **Physics Engine**: Matter.js for realistic stick figure physics
- **AI System**: Smart opponents with different personalities
- **Collision Detection**: Precise hit detection and damage calculation
- **Animation System**: Smooth character animations and effects
- **UI Management**: Modern interface with health bars and menus

### Game Modes
- **Single Player**: Fight against AI opponents
- **Two Player**: Local multiplayer combat
- **Multiple Difficulty Levels**: Easy, Medium, Hard AI

### Controls
- **Player 1**: A/D (Move), W (Jump), Space (Attack)
- **Player 2**: Arrow Keys (Move), ↑ (Jump), Enter (Attack)
- **Global**: R (Reset), P (Pause), D (Debug), Esc (Menu)

## 🛠️ Technical Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Physics**: Matter.js
- **Build System**: Vite
- **Styling**: Modern CSS with gradients and animations
- **Development**: ESLint, Prettier for code quality

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern web browser

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3003` (or the port shown in terminal)

### Build for Production
```bash
npm run build
```

## 🎯 Current Status

✅ **Fully Functional**: Game loads and runs without errors
✅ **Debug Mode**: Press `D` during gameplay for physics visualization
✅ **All Systems**: Physics, AI, UI, and collision detection working
✅ **Modern Architecture**: Clean ES6+ modules with proper imports
✅ **Production Ready**: Successful builds and optimized bundles

## 📁 Project Structure

```
src/
├── core/           # Core game systems
│   ├── GameEngine.js     # Main game coordinator
│   ├── GameState.js      # State management
│   └── InputManager.js   # Input handling
├── entities/       # Game objects
│   └── Fighter.js        # Fighter character class
├── systems/        # Specialized systems
│   ├── Renderer.js       # Graphics rendering
│   ├── UIManager.js      # UI management
│   └── CollisionManager.js # Collision detection
├── ai/            # AI system
│   └── AIController.js   # AI behavior
└── main.js        # Application entry point
```

## 🎯 Game Mechanics

### Fighter System
- **Modular body parts** with realistic physics constraints
- **Health and stamina** management
- **Attack moves**: Punch, Kick, Jump, Block
- **Knockback and damage** system

### AI Behavior
- **State-based decision making**
- **Personality traits** (Aggressive, Defensive, Balanced)
- **Distance-based combat** strategies
- **Adaptive difficulty** levels

### Physics Integration
- **Realistic collisions** and momentum
- **Ground detection** and landing impact
- **Force application** for attacks and movement
- **Constraint-based** joint system

## 🔧 Configuration

The game can be easily configured through the `config` objects in each system:

- **GameEngine**: World bounds, gravity, fighter positions
- **AIController**: Difficulty levels, behavior parameters
- **CollisionManager**: Damage multipliers, hit detection
- **Renderer**: Visual settings, debug options

## 🎨 Customization

### Adding New Fighters
1. Create new Fighter instance in `GameEngine.createFighters()`
2. Configure colors, controls, and starting positions
3. Add AI controller if needed

### Modifying AI Behavior
1. Adjust personality traits in `AIController.generatePersonality()`
2. Modify decision parameters in `getDifficultyParams()`
3. Add new states in the state machine

### Custom Visual Effects
1. Add effects in `Renderer.renderEffects()`
2. Modify particle systems in collision manager
3. Customize UI in `UIManager`

## 🐛 Development

### Debug Mode
Press `D` during gameplay to toggle debug visualization:
- Physics bodies and constraints
- Collision detection areas
- Performance metrics
- Game state information

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Modern JavaScript best practices
- Comprehensive error handling

## 📱 Mobile Support

The game includes touch-friendly controls:
- Virtual buttons for mobile devices
- Responsive UI that adapts to screen size
- Touch-optimized input handling

## 🔮 Future Enhancements

- Sound effects and background music
- Character customization and skins
- Online multiplayer support
- Tournament mode and rankings
- Advanced combo system
- Power-ups and special abilities

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, suggestions, or pull requests.

---

**Built with ❤️ using modern web technologies**
