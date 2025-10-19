// Hero Animation Script
document.addEventListener('DOMContentLoaded', function() {
    const heroContainer = document.getElementById('hero-container');
    const mainContent = document.getElementById('main-content');
    
    // Always start the hero animation sequence on page load/refresh
    startHeroAnimation();
    
    function startHeroAnimation() {
        // Wait for color animation to complete (0.5s delay + 2s duration = 2.5s)
        setTimeout(() => {
            // Show main content (navigation) at the same time hero starts fading out
            showMainContent();
            
            // Fade out hero container
            heroContainer.classList.add('fade-out');
            
            // Hide hero container after fade-out transition completes
            setTimeout(() => {
                heroContainer.style.display = 'none';
            }, 2000); // Wait for fade-out transition to complete
        }, 2500);
    }
    
    function showMainContent() {
        mainContent.classList.remove('hidden');
    }
    
    // Add some interactive effects to the letters
    const letters = document.querySelectorAll('.letter');
    letters.forEach(letter => {
        letter.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.transition = 'transform 0.3s ease';
        });
        
        letter.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});
