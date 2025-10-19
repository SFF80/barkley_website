// Hero Animation Script
document.addEventListener('DOMContentLoaded', function() {
    const heroContainer = document.getElementById('hero-container');
    const mainContent = document.getElementById('main-content');
    
    // Always start the hero animation sequence on page load/refresh
    startHeroAnimation();
    
    function startHeroAnimation() {
        // Wait for all letters to finish animating (0.7s + 1s animation duration)
        setTimeout(() => {
            // Fade out hero container
            heroContainer.classList.add('fade-out');
            
            // Show main content after hero fades out
            setTimeout(() => {
                showMainContent();
            }, 2000); // Wait for fade-out transition to complete
        }, 1700);
    }
    
    function showMainContent() {
        heroContainer.style.display = 'none';
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
