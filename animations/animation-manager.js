// Animation Manager - Easy switching between different animations
import { KnowledgeGraphAnimation } from './knowledge-graph.js';
import { initHeroCircles } from './hero-circles.js';

export class AnimationManager {
    constructor() {
        this.currentAnimation = null;
        this.availableAnimations = {
      'knowledge-graph': KnowledgeGraphAnimation,
      'hero-circles': class HeroCirclesAnimation {
        constructor(containerId, options = {}) {
          this.containerId = containerId;
          this.options = options;
          this.ctrl = null;
        }
        init() {
          // Default containerSelector assumes the same structure as index.html
          const containerSelector = this.options.containerSelector || '.knowledge-graph';
          this.ctrl = initHeroCircles(Object.assign({
            svgId: this.containerId,
            containerSelector
          }, this.options));
        }
        pause() { this.ctrl?.pause?.(); }
        resume() { this.ctrl?.resume?.(); }
        destroy() { this.ctrl?.destroy?.(); this.ctrl = null; }
      }
        };
    }
    
    // Initialize a specific animation
  initAnimation(animationType, containerId, options = {}) {
        // Clean up current animation if it exists
        if (this.currentAnimation) {
            this.currentAnimation.destroy();
        }
        
        // Create new animation
    const AnimationClass = this.availableAnimations[animationType];
        if (!AnimationClass) {
            console.error(`Animation type '${animationType}' not found`);
            return null;
        }
        
    this.currentAnimation = new AnimationClass(containerId, options);
        this.currentAnimation.init();
        
        console.log(`Initialized ${animationType} animation`);
        return this.currentAnimation;
    }
    
    // Get list of available animations
    getAvailableAnimations() {
        return Object.keys(this.availableAnimations);
    }
    
    // Pause current animation
    pause() {
        if (this.currentAnimation && this.currentAnimation.pause) {
            this.currentAnimation.pause();
        }
    }
    
    // Resume current animation
    resume() {
        if (this.currentAnimation && this.currentAnimation.resume) {
            this.currentAnimation.resume();
        }
    }
    
    // Destroy current animation
    destroy() {
        if (this.currentAnimation) {
            this.currentAnimation.destroy();
            this.currentAnimation = null;
        }
    }
}
