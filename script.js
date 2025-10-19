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
    
// D3.js Overlapping Circles Animation (inspired by the attached images)
function initD3Circles() {
    console.log('initD3Circles function called');
    const svg = d3.select('#graph-svg');
    console.log('SVG selected:', svg);
    const width = window.innerWidth;
    const height = window.innerHeight;
    console.log('Canvas dimensions:', width, 'x', height);
    
    // Set SVG dimensions
    svg.attr('width', width).attr('height', height);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        svg.attr('width', newWidth).attr('height', newHeight);
    });
    
    // Sea-to-sunset color palette (from the images)
    const colors = [
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
    
    // Create layered balloon-like circles
    const nodeCount = 25; // Fewer nodes but each will have multiple layers
    const nodes = d3.range(nodeCount).map(i => ({
        id: i,
        group: Math.floor(i / 5), // Create clusters
        color: colors[i % colors.length],
        baseSize: Math.random() * 60 + 30, // Base size for the balloon
        layers: Math.floor(Math.random() * 4) + 3, // 3-6 layers per balloon
        x: Math.random() * width,
        y: Math.random() * height,
        animationSpeed: Math.random() * 0.02 + 0.01, // Different expansion rates
        animationOffset: Math.random() * Math.PI * 2 // Different starting phases
    }));
    
    // Create force simulation for organic clustering
    const simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody()
            .strength(-300) // Stronger repulsion for better clustering
            .distanceMax(400)
        )
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide()
            .radius(d => d.size * 0.8) // Allow some overlap
        )
        .force('x', d3.forceX(d => {
            // Create two main clusters like in the images
            if (d.group === 0) return width * 0.3;
            if (d.group === 1) return width * 0.7;
            return width / 2;
        }).strength(0.1))
        .force('y', d3.forceY(height / 2).strength(0.05));
    
    // Create layered balloon circles
    const balloonGroups = svg.append('g')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    
    // Create multiple layers for each balloon
    balloonGroups.each(function(d) {
        const group = d3.select(this);
        
        // Create layers (inner to outer)
        for (let layer = 0; layer < d.layers; layer++) {
            const layerSize = d.baseSize * (0.3 + layer * 0.2); // Each layer is larger
            const layerOpacity = 0.4 - (layer * 0.05); // Outer layers more transparent
            const layerDelay = layer * 0.5; // Stagger the animation
            
            group.append('circle')
                .attr('r', layerSize)
                .attr('fill', d.color)
                .attr('opacity', layerOpacity)
                .attr('class', `balloon-layer-${layer}`)
                .datum({
                    ...d,
                    layer: layer,
                    layerSize: layerSize,
                    layerOpacity: layerOpacity,
                    layerDelay: layerDelay
                });
        }
    });
    
    // Animation loop for expanding/contracting layers
    let animationTime = 0;
    const animate = () => {
        animationTime += 0.016; // ~60fps
        
        balloonGroups.each(function(d) {
            const group = d3.select(this);
            
            group.selectAll('circle').each(function(layerData) {
                const circle = d3.select(this);
                const time = animationTime * d.animationSpeed + d.animationOffset + layerData.layerDelay;
                
                // Create breathing/expanding effect
                const scale = 1 + Math.sin(time) * 0.3; // Scale between 0.7 and 1.3
                const opacity = layerData.layerOpacity * (0.8 + Math.sin(time * 0.7) * 0.2);
                
                circle
                    .attr('r', layerData.layerSize * scale)
                    .attr('opacity', opacity);
            });
        });
        
        requestAnimationFrame(animate);
    };
    
    animate();
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
        balloonGroups
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    });
    
    // Add gentle movement to keep animation alive
    setInterval(() => {
        nodes.forEach(node => {
            if (Math.random() < 0.15) {
                node.vx += (Math.random() - 0.5) * 0.3;
                node.vy += (Math.random() - 0.5) * 0.3;
            }
        });
        simulation.alpha(0.1).restart();
    }, 4000);
    
    console.log('D3 circles animation initialized successfully');
}
    
});
