# StickMan Fighter - Debug Setup

## Debugging with F5

The project is now configured for debugging with VS Code. Press **F5** or go to **Run > Start Debugging** to launch the debugger.

### Available Debug Configurations:

1. **Launch Vite Dev Server** - Starts the development server and opens Chrome in debug mode
2. **Debug in Chrome** - Opens your game in Chrome with debugging enabled
3. **Attach to Vite** - Attaches debugger to an already running Vite process

### How to Debug:

1. Open any JavaScript file in the `src/` directory
2. Set breakpoints by clicking in the gutter next to line numbers
3. Press **F5** to start debugging
4. The browser will open with your game and stop at breakpoints
5. Use the debug toolbar to step through code, inspect variables, etc.

### Debug Features:

- **Source Maps**: Full source map support for debugging minified code
- **Breakpoints**: Set breakpoints in your source code
- **Variable Inspection**: View and modify variables during runtime
- **Call Stack**: Navigate through the call stack
- **Watch Expressions**: Monitor specific expressions

The dev server runs on `http://localhost:3000` and includes hot module replacement for faster development.
