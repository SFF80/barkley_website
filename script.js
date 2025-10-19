// Hero Animation Script
document.addEventListener('DOMContentLoaded', function() {
    const heroContainer = document.getElementById('hero-container');
    const mainContent = document.getElementById('main-content');
    
    // Initialize knowledge graph animation
    console.log('About to initialize knowledge graph...');
    initKnowledgeGraph();
    console.log('Knowledge graph initialization called');
    
    // Always start the hero animation sequence on page load/refresh
    startHeroAnimation();
    
    function startHeroAnimation() {
        // Wait for color animation to complete (0.5s delay + 2s duration = 2.5s)
        setTimeout(() => {
            // Show main content (navigation)
            showMainContent();
        }, 4500); // Wait longer for text animation to complete
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
    
    // D3.js Knowledge Graph Animation
    function initKnowledgeGraph() {
        console.log('initKnowledgeGraph function called');
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
        
        // Sea-to-sunset color palette
        const colors = [
            '#87CEEB', // Light blue
            '#4682B4', // Steel blue
            '#1E90FF', // Dodger blue
            '#000080', // Navy blue
            '#DC143C', // Crimson
            '#FF4500', // Orange red
            '#FF8C00', // Dark orange
        ];
        
        // Create nodes (concepts/ideas)
        const nodeCount = 25;
        const nodes = d3.range(nodeCount).map(i => ({
            id: i,
            group: Math.floor(i / 4), // Group nodes for clustering
            color: colors[i % colors.length],
            size: Math.random() * 12 + 8,
            opacity: Math.random() * 0.8 + 0.4
        }));
        
        // Create links (connections between concepts)
        const links = [];
        for (let i = 0; i < nodeCount; i++) {
            const numLinks = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numLinks; j++) {
                const target = Math.floor(Math.random() * nodeCount);
                if (target !== i) {
                    links.push({
                        source: i,
                        target: target,
                        strength: Math.random() * 0.5 + 0.1
                    });
                }
            }
        }
        
        // Create force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(d => 50 + Math.random() * 100)
                .strength(d => d.strength)
            )
            .force('charge', d3.forceManyBody()
                .strength(-200)
                .distanceMax(300)
            )
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => d.size + 5)
            );
        
        // Create SVG elements
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', '#E0E0E0')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.6);
        
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter().append('circle')
            .attr('r', d => d.size)
            .attr('fill', d => d.color)
            .attr('stroke', '#E0E0E0')
            .attr('stroke-width', 1)
            .attr('opacity', d => d.opacity)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended)
            );
        
        // Add pulsing animation to nodes
        node.each(function(d) {
            d3.select(this)
                .transition()
                .duration(2000 + Math.random() * 3000)
                .ease(d3.easeSinInOut)
                .attr('r', d.size * 1.3)
                .transition()
                .duration(2000 + Math.random() * 3000)
                .ease(d3.easeSinInOut)
                .attr('r', d.size)
                .on('end', function() {
                    d3.select(this).call(arguments.callee);
                });
        });
        
        // Update positions on each tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });
        
        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        // Add some random movement to keep the graph alive
        setInterval(() => {
            nodes.forEach(node => {
                if (Math.random() < 0.1) {
                    node.vx += (Math.random() - 0.5) * 0.5;
                    node.vy += (Math.random() - 0.5) * 0.5;
                }
            });
            simulation.alpha(0.1).restart();
        }, 3000);
    }
});
