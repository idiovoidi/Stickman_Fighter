/**
 * @class LayeredRenderer
 * @description Manages multiple canvas layers for efficient rendering
 */
export class LayeredRenderer {
    /**
     * @constructor
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    constructor(width = 800, height = 600) {
        this.width = width;
        this.height = height;
        this.layers = new Map();
        this.container = null;
        
        // Wait for DOM to be ready before creating layers
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * @method init
     * @description Initializes the renderer after DOM is ready
     * @private
     */
    init() {
        this.setupContainer();
        
        // Create default layers in order of rendering
        this.createLayer('background', true);  // Static background
        this.createLayer('ground', true);      // Static ground/platforms
        this.createLayer('effects', false);    // Dynamic particles/effects
        this.createLayer('fighters', false);   // Dynamic fighters
        this.createLayer('ui', false);         // Dynamic UI elements
        this.createLayer('debug', false);      // Dynamic debug overlay
    }

    /**
     * @method setupContainer
     * @description Creates and configures the container element
     * @private
     */
    setupContainer() {
        // Remove existing container if it exists
        if (this.container) {
            this.container.remove();
        }

        // Create new container
        this.container = document.createElement('div');
        this.container.id = 'game-container';
        this.container.style.position = 'relative';
        this.container.style.width = `${this.width}px`;
        this.container.style.height = `${this.height}px`;
        this.container.style.border = '3px solid #2c3e50';
        this.container.style.borderRadius = '8px';
        this.container.style.overflow = 'hidden';
        this.container.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        
        // Find or create a target element to append the container
        let target = document.getElementById('game-target') || document.body;
        target.appendChild(this.container);
    }

    /**
     * @method createLayer
     * @description Creates a new canvas layer
     * @param {string} name - Layer name
     * @param {boolean} isStatic - Whether the layer content is static
     * @returns {CanvasRenderingContext2D} The layer's context
     */
    createLayer(name, isStatic = false) {
        if (!this.container) {
            console.error('Container not initialized');
            return null;
        }

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.filter = name === 'background' ? 'blur(1px)' : 'none';
        
        this.container.appendChild(canvas);
        
        this.layers.set(name, {
            canvas,
            context,
            isStatic,
            isDirty: true
        });

        return context;
    }

    getContext(layerName) {
        return this.layers.get(layerName)?.context;
    }

    markDirty(layerName) {
        const layer = this.layers.get(layerName);
        if (layer) {
            layer.isDirty = true;
        }
    }

    clear(layerName) {
        const layer = this.layers.get(layerName);
        if (layer) {
            layer.context.clearRect(0, 0, this.width, this.height);
            layer.isDirty = true;
        }
    }

    clearAll() {
        this.layers.forEach((layer, name) => {
            if (!layer.isStatic || layer.isDirty) {
                this.clear(name);
            }
        });
    }

    render(renderFunctions) {
        // Clear dynamic layers
        this.layers.forEach((layer, name) => {
            if (!layer.isStatic) {
                this.clear(name);
            }
        });

        // Execute render functions for each layer
        renderFunctions.forEach((func, layerName) => {
            const layer = this.layers.get(layerName);
            if (layer && (layer.isDirty || !layer.isStatic)) {
                func(layer.context);
                layer.isDirty = false;
            }
        });
    }
} 