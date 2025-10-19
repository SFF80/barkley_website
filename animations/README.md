# Animation System

This directory contains modular animation components for the Barkley website.

## Structure

- `animation-manager.js` - Main manager for switching between animations
- `knowledge-graph.js` - D3.js knowledge graph animation
- `README.md` - This documentation

## Usage

### Basic Usage

```javascript
import { AnimationManager } from './animations/animation-manager.js';

const animationManager = new AnimationManager();
animationManager.initAnimation('knowledge-graph', 'graph-svg');
```

### Available Animations

- `knowledge-graph` - D3.js force-directed graph with sea-to-sunset colors

### Animation Manager Methods

- `initAnimation(type, containerId)` - Initialize a specific animation
- `getAvailableAnimations()` - Get list of available animation types
- `pause()` - Pause current animation
- `resume()` - Resume current animation
- `destroy()` - Destroy current animation

## Creating New Animations

To add a new animation:

1. Create a new animation class in this directory
2. Export the class as a named export
3. Add it to the `availableAnimations` object in `animation-manager.js`

### Animation Class Requirements

Your animation class should implement:

```javascript
export class YourAnimation {
    constructor(containerId) {
        // Initialize with container ID
    }
    
    init() {
        // Start the animation
    }
    
    pause() {
        // Pause the animation (optional)
    }
    
    resume() {
        // Resume the animation (optional)
    }
    
    destroy() {
        // Clean up resources
    }
}
```

## Example: Adding a New Animation

1. Create `particle-system.js`:
```javascript
export class ParticleSystemAnimation {
    constructor(containerId) {
        this.containerId = containerId;
    }
    
    init() {
        // Your particle system code here
    }
    
    destroy() {
        // Cleanup code here
    }
}
```

2. Update `animation-manager.js`:
```javascript
import { ParticleSystemAnimation } from './particle-system.js';

export class AnimationManager {
    constructor() {
        this.availableAnimations = {
            'knowledge-graph': KnowledgeGraphAnimation,
            'particle-system': ParticleSystemAnimation  // Add this line
        };
    }
}
```

3. Use it in your main script:
```javascript
animationManager.initAnimation('particle-system', 'particle-canvas');
```
