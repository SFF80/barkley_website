// D3.js Knowledge Graph Animation Module
// Note: D3.js must be loaded globally before this module is imported

export class KnowledgeGraphAnimation {
    constructor(containerId) {
        this.containerId = containerId;
        this.svg = null;
        this.simulation = null;
        this.nodes = [];
        this.links = [];
        this.nodeElements = null;
        this.linkElements = null;
        
        // Sea-to-sunset color palette
        this.colors = [
            '#87CEEB', // Light blue
            '#4682B4', // Steel blue
            '#1E90FF', // Dodger blue
            '#000080', // Navy blue
            '#DC143C', // Crimson
            '#FF4500', // Orange red
            '#FF8C00', // Dark orange
        ];
    }
    
    init() {
        console.log('Initializing Knowledge Graph Animation...');
        console.log('Container ID:', this.containerId);
        console.log('D3 available:', typeof d3 !== 'undefined');
        
        this.setupSVG();
        console.log('SVG setup complete');
        
        this.createNodes();
        console.log('Nodes created:', this.nodes.length);
        
        this.createLinks();
        console.log('Links created:', this.links.length);
        
        this.setupSimulation();
        console.log('Simulation setup complete');
        
        this.createElements();
        console.log('Elements created');
        
        this.addAnimations();
        console.log('Animations added');
        
        this.setupResizeHandler();
        console.log('Knowledge Graph Animation initialized successfully');
    }
    
    setupSVG() {
        this.svg = d3.select(`#${this.containerId}`);
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.svg.attr('width', width).attr('height', height);
    }
    
    createNodes() {
        const nodeCount = 25;
        this.nodes = d3.range(nodeCount).map(i => ({
            id: i,
            group: Math.floor(i / 4),
            color: this.colors[i % this.colors.length],
            size: Math.random() * 12 + 8,
            opacity: Math.random() * 0.8 + 0.4
        }));
    }
    
    createLinks() {
        this.links = [];
        for (let i = 0; i < this.nodes.length; i++) {
            const numLinks = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numLinks; j++) {
                const target = Math.floor(Math.random() * this.nodes.length);
                if (target !== i) {
                    this.links.push({
                        source: i,
                        target: target,
                        strength: Math.random() * 0.5 + 0.1
                    });
                }
            }
        }
    }
    
    setupSimulation() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
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
    }
    
    createElements() {
        // Create links
        this.linkElements = this.svg.append('g')
            .selectAll('line')
            .data(this.links)
            .enter().append('line')
            .attr('stroke', '#E0E0E0')
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.6);
        
        // Create nodes
        this.nodeElements = this.svg.append('g')
            .selectAll('circle')
            .data(this.nodes)
            .enter().append('circle')
            .attr('r', d => d.size)
            .attr('fill', d => d.color)
            .attr('stroke', '#E0E0E0')
            .attr('stroke-width', 1)
            .attr('opacity', d => d.opacity)
            .call(d3.drag()
                .on('start', this.dragstarted.bind(this))
                .on('drag', this.dragged.bind(this))
                .on('end', this.dragended.bind(this))
            );
    }
    
    addAnimations() {
        // Pulsing animation for nodes
        this.nodeElements.each(function(d) {
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
        
        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            this.updatePositions();
        });
        
        // Random movement to keep graph alive
        setInterval(() => {
            this.addRandomMovement();
        }, 3000);
    }
    
    updatePositions() {
        this.linkElements
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
        
        this.nodeElements
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }
    
    addRandomMovement() {
        this.nodes.forEach(node => {
            if (Math.random() < 0.1) {
                node.vx += (Math.random() - 0.5) * 0.5;
                node.vy += (Math.random() - 0.5) * 0.5;
            }
        });
        this.simulation.alpha(0.1).restart();
    }
    
    // Drag functions
    dragstarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    dragended(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    setupResizeHandler() {
        window.addEventListener('resize', () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            this.svg.attr('width', newWidth).attr('height', newHeight);
        });
    }
    
    // Public methods for external control
    pause() {
        this.simulation.stop();
    }
    
    resume() {
        this.simulation.restart();
    }
    
    destroy() {
        if (this.simulation) {
            this.simulation.stop();
        }
        if (this.svg) {
            this.svg.selectAll('*').remove();
        }
    }
}
