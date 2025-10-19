// Hero Animation Script
document.addEventListener('DOMContentLoaded', function() {
    const heroContainer = document.getElementById('hero-container');
    const mainContent = document.getElementById('main-content');
    
    // Initialize D3 circles animation
    console.log('About to initialize D3 circles animation...');
    initD3Circles();
    console.log('D3 circles animation initialization called');
    
    // Always start the hero animation sequence on page load/refresh
    startHeroAnimation();
    
    function startHeroAnimation() {
        // Navigation fades in as hero text changes from multi-coloured to white
        // Hero text: 0.5s delay + 2s duration = 2.5s (when it starts fading back to white)
        setTimeout(() => {
            // Show main content (navigation)
            showMainContent();
        }, 2500); // Fade in navigation as hero text transitions from colors to white
    }
    
    function showMainContent() {
        mainContent.classList.remove('hidden');
    }
    
    
// D3.js Overlapping Circles Animation (inspired by the attached images)
function initD3Circles() {
    console.log('initD3Circles function called');
    const svg = d3.select('#graph-svg');
    console.log('SVG selected:', svg);
    const knowledgeGraphContainer = d3.select('.knowledge-graph');
    const width = knowledgeGraphContainer.node().clientWidth;
    const height = knowledgeGraphContainer.node().clientHeight;
    console.log('Canvas dimensions:', width, 'x', height);
    
    // Speed configuration
    const baseCarouselSpeed = 0.2625; // Base speed (30% reduction from 0.375)
    const speedVariance = 0.4; // Variance factor for speed variation (reduced from 0.5)
    
    // Set SVG dimensions
    svg.attr('width', width).attr('height', height);
    
        // Handle window resize
        window.addEventListener('resize', () => {
            const newWidth = knowledgeGraphContainer.node().clientWidth;
            const newHeight = knowledgeGraphContainer.node().clientHeight;
            svg.attr('width', newWidth).attr('height', newHeight);
            
            // Recalculate Hero text position for responsive alignment
            const heroText = document.querySelector('.hero-text');
            const heroTextRect = heroText.getBoundingClientRect();
            const knowledgeGraphRect = document.querySelector('.knowledge-graph').getBoundingClientRect();
            const heroTextRelativeY = (heroTextRect.top + heroTextRect.bottom) / 2 - knowledgeGraphRect.top;
            
            // Update all nodes' Y positions to maintain alignment
            nodes.forEach(node => {
                node.y = heroTextRelativeY + (Math.random() - 0.5) * 60;
            });
        });
    
    // Sea-to-sunset color palette (from the images)
    const baseColors = [
        '#87CEEB', // Light blue
        '#4682B4', // Steel blue
        '#1E90FF', // Dodger blue
        '#000080', // Navy blue
        '#DC143C', // Crimson
        '#FF4500', // Orange red
        '#FF8C00', // Dark orange
        '#FF69B4', // Hot pink
        '#8A2BE2', // Blue violet
        '#FF1493', // Deep pink
    ];
    
    // Randomly select one color to have enhanced probability (18%)
    const enhancedColorIndex = Math.floor(Math.random() * baseColors.length);
    const enhancedColor = baseColors[enhancedColorIndex];
    
    // Create color array with enhanced probability for one random color
    const colors = [...baseColors]; // Start with all base colors
    colors.push(enhancedColor); // Add the enhanced color once more (18% probability)
    
        console.log(`Enhanced color for this session: ${enhancedColor} (index ${enhancedColorIndex})`);

        // Assign the enhanced color to the KNOWLEDGE title
        const knowledgeTitle = document.querySelector('.data-section h2');
        if (knowledgeTitle) {
            knowledgeTitle.style.color = enhancedColor;
        }

        // Assign the same enhanced color to the bold 'Barkley' text
        const barkleyText = document.querySelector('.data-column.right-column strong');
        if (barkleyText) {
            barkleyText.style.color = enhancedColor;
        }
    
    // Get the actual Hero text position to anchor circles properly
    const heroText = document.querySelector('.hero-text');
    const heroTextRect = heroText.getBoundingClientRect();
    const heroContainerRect = document.querySelector('.hero-container').getBoundingClientRect();
    
    // Calculate the Hero text's center relative to the knowledge-graph container
    const heroTextCenterY = (heroTextRect.top + heroTextRect.bottom) / 2;
    const knowledgeGraphRect = document.querySelector('.knowledge-graph').getBoundingClientRect();
    const heroTextRelativeY = heroTextCenterY - knowledgeGraphRect.top;
    
    console.log('Hero text center Y:', heroTextCenterY);
    console.log('Knowledge graph top:', knowledgeGraphRect.top);
    console.log('Hero text relative Y:', heroTextRelativeY);
    console.log('Container height:', height);

    // Create layered balloon-like circles
    const nodeCount = 40; // More nodes for denser, more continuous stream
    const nodes = d3.range(nodeCount).map(i => {
        const baseSize = Math.random() * 89.23 + 44.62; // Base size for the balloon (10% increase from previous)
        const layers = Math.floor(Math.random() * 7) + 4; // 4-10 layers per balloon
        
        // Debug logging
        if (isNaN(baseSize) || isNaN(layers)) {
            console.error('NaN detected in node creation:', { i, baseSize, layers });
        }
        
        return {
            id: i,
            group: Math.floor(i / 5), // Create clusters
            color: colors[i % colors.length],
            baseSize: baseSize,
            layers: layers,
            x: Math.random() * (width + 200) - 100, // Spread across entire width plus some off-screen
            y: heroTextRelativeY + (Math.random() - 0.5) * 60, // Anchor to actual Hero text center
            animationSpeed: Math.random() * 0.08 + 0.04, // Different expansion rates (2x faster)
            animationOffset: Math.random() * Math.PI * 2, // Different starting phases
            verticalSpeed: Math.random() * 0.024 + 0.012, // Vertical floating speed (20% faster)
            verticalOffset: Math.random() * Math.PI * 2, // Vertical animation phase
            verticalAmplitude: Math.random() * 36 + 31.2, // Vertical floating range (31.2-67.2px, 20% increase)
            horizontalSpeed: baseCarouselSpeed + (Math.random() - 0.5) * speedVariance // Individual horizontal speed with variance
        };
    });
    
    // Create carousel movement - no force simulation needed
    // We'll handle movement manually for smooth carousel effect
    
    // Sort nodes by x position for left-to-right animation
    nodes.sort((a, b) => a.x - b.x);
    
    // Create layered balloon circles - simplified approach
    console.log('Creating balloon groups for', nodes.length, 'nodes');
    const balloonGroups = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .attr('transform', d => `translate(${d.x}, ${d.y})`)
        .style('opacity', 1); // Make groups visible immediately
    
    console.log('Balloon groups created:', balloonGroups.size());
    
    
    // Create multiple layers for each balloon
    balloonGroups.each(function(d, i) {
        const group = d3.select(this);
        
        // Create layers (outer to inner for construction, inner to outer for deconstruction)
        for (let layer = 0; layer < d.layers; layer++) {
            // Safety check for baseSize
            const safeBaseSize = isNaN(d.baseSize) ? 50 : d.baseSize;
            // Curved growth function with constant 2
            const normalizedLayer = layer / (d.layers - 1); // 0 to 1
            const curvedGrowth = Math.pow(normalizedLayer, 1.75); // Curved function with constant 1.75
            const layerSize = safeBaseSize * (0.3 + curvedGrowth * 0.5); // Curved layer sizing
            const layerOpacity = Math.max(0.1, 0.4 - (layer * 0.05)); // Outer layers more transparent, minimum 0.1
            // Construction: biggest and smallest appear first, then work inward/outward
            const maxLayer = d.layers - 1;
            const distanceFromEdge = Math.min(layer, maxLayer - layer);
            const constructionDelay = distanceFromEdge * 150; // Edge layers (biggest/smallest) appear first
            const deconstructionDelay = layer * 150; // Inner layers disappear first
            
            // Debug logging
            if (isNaN(layerSize)) {
                console.error('NaN layerSize detected:', { baseSize: d.baseSize, safeBaseSize, layer, layerSize });
            }
            
            group.append('circle')
                .attr('r', Math.max(1, layerSize)) // Ensure minimum radius of 1
                .attr('fill', d.color)
                .attr('opacity', 0) // Start invisible
                .attr('class', `balloon-layer-${layer}`)
                .datum({
                    ...d,
                    layer: layer,
                    layerSize: Math.max(1, layerSize),
                    layerOpacity: layerOpacity,
                    constructionDelay: constructionDelay,
                    deconstructionDelay: deconstructionDelay,
                    isConstructed: false,
                    isDeconstructing: false
                });
        }
    });
    
    // Start all circles invisible for construction effect
    balloonGroups.each(function(d, i) {
        const group = d3.select(this);
        const circles = group.selectAll('circle');
        
        console.log(`Balloon ${i}: ${circles.size()} circles, position (${d.x}, ${d.y}), baseSize: ${d.baseSize}`);
        
        // Keep circles invisible initially
        circles.attr('opacity', 0);
        
        // Debug: Check if circles are being created with valid positions
        circles.each(function(layerData, layerIndex) {
            console.log(`  Layer ${layerIndex}: size ${layerData.layerSize}, opacity ${layerData.layerOpacity}, delay ${layerData.constructionDelay}`);
        });
        
        // Mark as not constructed initially
        circles.each(function(layerData) {
            layerData.isConstructed = false;
        });
        
        // TEMPORARY: Make first few balloons visible for debugging
        if (i < 3) {
            console.log(`Making balloon ${i} visible for debugging`);
            circles.attr('opacity', 0.5);
        }
    });
    
    // Carousel movement animation
    let carouselTime = 0;
    let initialLoadComplete = false;
    
    // Calculate cycle time for hero animation synchronization (using average speed)
    const totalDistance = width + 200 + 150; // width + off-screen distance + average circle size
    const averageSpeed = baseCarouselSpeed; // Use base speed for cycle calculation
    const cycleTimeMs = (totalDistance / averageSpeed) * 16.67 * 0.6; // 60% of full cycle for reasonable timing
    
    // Hero animation timing
    let heroAnimationTime = 0;
    let lastHeroCycle = 0;
    
    const animate = () => {
        carouselTime += 0.016; // ~60fps
        heroAnimationTime += 16.67; // milliseconds
        
        balloonGroups.each(function(d, i) {
            const group = d3.select(this);
            
            // Move balloons from left to right in carousel fashion with individual speeds
            d.x += d.horizontalSpeed;
            
            // Add gentle vertical floating motion (like balloons in wind)
            const verticalTime = carouselTime * d.verticalSpeed + d.verticalOffset;
            const verticalFloat = Math.sin(verticalTime) * d.verticalAmplitude;
            d.currentY = d.y + verticalFloat;
            
            // Handle deconstruction at right boundary (20% earlier)
            if (d.x > width * 0.8 + 100 && !d.isDeconstructing) {
                d.isDeconstructing = true;
                group.selectAll('circle')
                    .transition()
                    .delay((layerData) => layerData.deconstructionDelay)
                    .duration(600)
                    .attr('opacity', 0)
                    .on('end', function(layerData) {
                        layerData.isConstructed = false;
                    });
            }
            
            // Reset position when balloon goes off screen
            if (d.x > width + 200) {
                d.x = -100 - Math.random() * 50; // Start closer to screen edge with some randomness
                // Recalculate Hero text position for responsive alignment
                const heroText = document.querySelector('.hero-text');
                const heroTextRect = heroText.getBoundingClientRect();
                const knowledgeGraphRect = document.querySelector('.knowledge-graph').getBoundingClientRect();
                const heroTextRelativeY = (heroTextRect.top + heroTextRect.bottom) / 2 - knowledgeGraphRect.top;
                d.y = heroTextRelativeY + (Math.random() - 0.5) * 60; // Anchor to actual Hero text center
                d.isDeconstructing = false; // Reset deconstruction state
                d.isConstructed = false; // Reset construction state for new cycle
                console.log(`Recycling balloon ${d.id} to position ${d.x}`);
            }
            
            // Handle construction logic
            let shouldConstruct = false;
            
            if (!initialLoadComplete) {
                // Initial load: construct balloons across entire width
                shouldConstruct = d.x > -100 && d.x < width + 100 && !d.isConstructed && !d.isDeconstructing;
            } else {
                // Subsequent loads: only construct from left boundary (10% later)
                shouldConstruct = d.x > width * 0.1 && d.x < width * 0.1 + 100 && !d.isConstructed && !d.isDeconstructing;
            }
            
            if (shouldConstruct) {
                console.log(`Constructing balloon ${d.id} at position ${d.x}`);
                d.isConstructed = true; // Prevent multiple construction attempts
                
                // Get all circles for this balloon
                const circles = group.selectAll('circle');
                console.log(`Balloon ${d.id} has ${circles.size()} circles to construct`);
                
                circles.each(function(layerData, layerIndex) {
                    const circle = d3.select(this);
                    const delay = layerData.constructionDelay || 0;
                    const opacity = Math.max(0.1, layerData.layerOpacity || 0.3);
                    
                    console.log(`Layer ${layerIndex}: delay ${delay}ms, opacity ${opacity}`);
                    
                    circle.transition()
                        .delay(delay)
                        .duration(720)
                        .attr('opacity', opacity)
                        .on('end', function() {
                            layerData.isConstructed = true;
                            console.log(`Layer ${layerIndex} construction complete`);
                        });
                });
            }
            
            // Update position with vertical floating
            group.attr('transform', `translate(${d.x}, ${d.currentY})`);
            
            // Breathing animation for layers
            group.selectAll('circle').each(function(layerData) {
                const circle = d3.select(this);
                const time = carouselTime * d.animationSpeed + d.animationOffset + layerData.layerDelay;
                
                // Create breathing/expanding effect
                const scale = 1 + Math.sin(time) * 0.3; // Scale between 0.7 and 1.3
                const opacity = layerData.layerOpacity * (0.8 + Math.sin(time * 0.7) * 0.2);
                
                // Safety check for layerSize
                const safeLayerSize = isNaN(layerData.layerSize) ? 20 : layerData.layerSize;
                const newRadius = safeLayerSize * scale;
                
                // Ensure radius is valid
                if (!isNaN(newRadius) && newRadius > 0) {
                    circle
                        .attr('r', newRadius)
                        .attr('opacity', Math.max(0, Math.min(1, opacity)));
                }
            });
        });
        
        // Check if initial load is complete (after 3 seconds)
        if (!initialLoadComplete && carouselTime > 3) {
            initialLoadComplete = true;
            console.log('Initial load complete, switching to left-to-right mode');
        }
        
        // Continuous hero animation synchronized with circle cycles
        const currentCycle = Math.floor(heroAnimationTime / cycleTimeMs);
        if (currentCycle > lastHeroCycle) {
            lastHeroCycle = currentCycle;
            console.log('Triggering hero animation cycle:', currentCycle);
            triggerHeroAnimation();
        }
        
        requestAnimationFrame(animate);
    };
    
    // Function to trigger hero animation cycle
    function triggerHeroAnimation() {
        const letters = document.querySelectorAll('.letter');
        
        // Alternate between white and colored cycles
        if (lastHeroCycle % 2 === 0) {
            // Even cycles: Smoothly fade to white and stay white for the full cycle
            letters.forEach(letter => {
                letter.style.transition = 'color 1.5s ease-out';
                letter.style.color = '#ffffff';
                letter.style.animation = 'none';
            });
        } else {
            // Odd cycles: Smoothly fade to colors and stay colored for the full cycle
            letters.forEach((letter, index) => {
                const letterData = letter.getAttribute('data-letter');
                let targetColor = '';
                
                // Assign colors based on letter
                switch(letterData) {
                    case 'b': targetColor = '#87CEEB'; break; // Light blue
                    case 'a': targetColor = '#4682B4'; break; // Steel blue
                    case 'r': targetColor = '#1E90FF'; break; // Dodger blue
                    case 'k': targetColor = '#000080'; break; // Navy blue
                    case 'l': targetColor = '#DC143C'; break; // Crimson
                    case 'e': targetColor = '#FF4500'; break; // Orange red
                    case 'y': targetColor = '#FF8C00'; break; // Dark orange
                }
                
                if (targetColor) {
                    // Create smooth transition from white to color (3x longer)
                    letter.style.transition = 'color 1.5s ease-out';
                    letter.style.color = targetColor;
                }
            });
        }
    }
    
    animate();
    
    console.log('D3 circles animation initialized successfully');
}
    
});
