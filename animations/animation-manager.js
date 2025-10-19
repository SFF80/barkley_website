// Animation Manager - Easy switching between different animations
import { KnowledgeGraphAnimation } from './knowledge-graph.js';

export class AnimationManager {
    constructor() {
        this.currentAnimation = null;
        this.availableAnimations = {
            'knowledge-graph': KnowledgeGraphAnimation
        };
    }
    
    // Initialize a specific animation
    initAnimation(animationType, containerId) {
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
        
        this.currentAnimation = new AnimationClass(containerId);
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
