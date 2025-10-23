# Animation System

This directory contains modular animation components for the Barkley website.

## Structure

- `animation-manager.js` - Main manager for switching between animations
- `knowledge-graph.js` - D3.js knowledge graph animation
- `hero-circles.js` - Reusable carousel "balloon" circles animation
- `README.md` - This documentation

## Usage

### Basic Usage

```javascript
import { AnimationManager } from './animations/animation-manager.js';

const animationManager = new AnimationManager();
animationManager.initAnimation('knowledge-graph', 'graph-svg');
```

### Using the Hero Circles Animation (Reusable)

Direct module use (without the manager):

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script type="module">
  import { initHeroCircles } from './animations/hero-circles.js';
  initHeroCircles({
    svgId: 'graph-svg',
    containerSelector: '.knowledge-graph',
    // Optional anchoring controls:
    // anchorY: 300,                      // fixed vertical anchor (container coords)
    // anchorSelector: '.some-element',   // compute vertical center from element
    nodeCount: 40,
    baseCarouselSpeed: 0.2625,
    speedVariance: 0.4
  });
  // The function returns { pause, resume, destroy }
  // e.g., const ctrl = initHeroCircles(...); ctrl.destroy();
</script>
```

Via the Animation Manager:

```javascript
import { AnimationManager } from './animations/animation-manager.js';
const mgr = new AnimationManager();
mgr.initAnimation('hero-circles', 'graph-svg', {
  containerSelector: '.knowledge-graph',
  // anchorY: 300,
  // anchorSelector: '.some-element'
});
```

#### Hero Circles Options

```ts
type HeroCirclesOptions = {
  svgId: string;                 // required
  containerSelector: string;     // required
  anchorY?: number;              // optional explicit vertical anchor
  anchorSelector?: string;       // optional element to derive vertical center
  nodeCount?: number;            // default 40
  baseCarouselSpeed?: number;    // default 0.2625
  speedVariance?: number;        // default 0.4
};
```

### Available Animations

- `knowledge-graph` - D3.js force-directed graph with sea-to-sunset colors
- `hero-circles` - Carousel balloons/circles with layered construction and gentle vertical float

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
