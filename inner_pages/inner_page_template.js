// Inner Page Template - duplicated logic from landing page
document.addEventListener('DOMContentLoaded', function() {
    const heroContainer = document.getElementById('hero-container');
    const mainContent = document.getElementById('main-content');

    // Initialize D3 circles animation (identical behavior)
    initD3Circles();

    // Start hero animation sequence
    startHeroAnimation();

    function startHeroAnimation() {
        setTimeout(() => { showMainContent(); }, 2500);
    }

    function showMainContent() {
        if (mainContent) mainContent.classList.remove('hidden');
    }

    // Minimal copy of the D3 animation from script.js with the same interfaces
    function initD3Circles() {
        const svg = d3.select('#graph-svg');
        const knowledgeGraphContainer = d3.select('.knowledge-graph');
        const width = knowledgeGraphContainer.node().clientWidth;
        const height = knowledgeGraphContainer.node().clientHeight;
        const baseCarouselSpeed = 0.2625;
        const speedVariance = 0.4;
        svg.attr('width', width).attr('height', height);

        const baseColors = ['#87CEEB','#4682B4','#1E90FF','#000080','#DC143C','#FF4500','#FF8C00','#FF69B4','#8A2BE2','#FF1493'];
        const enhancedColorIndex = Math.floor(Math.random() * baseColors.length);
        const enhancedColor = baseColors[enhancedColorIndex];
        const colors = [...baseColors, enhancedColor];

        const knowledgeTitle = document.querySelector('.data-section h2');
        if (knowledgeTitle) knowledgeTitle.style.color = enhancedColor;
        const barkleyText = document.querySelector('.data-column.right-column strong');
        if (barkleyText) barkleyText.style.color = enhancedColor;

        // Anchor balloons vertically to the centerline of the hero container (no hero text on inner pages)
        const heroContainerRect = document.querySelector('.hero-container').getBoundingClientRect();
        const knowledgeGraphRect = document.querySelector('.knowledge-graph').getBoundingClientRect();
        const heroTextRelativeY = (heroContainerRect.top + heroContainerRect.bottom) / 2 - knowledgeGraphRect.top;

        const nodeCount = 40;
        const nodes = d3.range(nodeCount).map(i => ({
            id: i,
            group: Math.floor(i / 5),
            color: colors[i % colors.length],
            baseSize: Math.random() * 89.23 + 44.62,
            layers: Math.floor(Math.random() * 7) + 4,
            x: Math.random() * (width + 200) - 100,
            y: heroTextRelativeY + (Math.random() - 0.5) * 60,
            animationSpeed: Math.random() * 0.08 + 0.04,
            animationOffset: Math.random() * Math.PI * 2,
            verticalSpeed: Math.random() * 0.024 + 0.012,
            verticalOffset: Math.random() * Math.PI * 2,
            verticalAmplitude: Math.random() * 36 + 31.2,
            horizontalSpeed: baseCarouselSpeed + (Math.random() - 0.5) * speedVariance
        }));

        nodes.sort((a, b) => a.x - b.x);
        const balloonGroups = svg.append('g').selectAll('g').data(nodes).enter().append('g').attr('transform', d => `translate(${d.x}, ${d.y})`).style('opacity', 1);

        balloonGroups.each(function(d){
            const group = d3.select(this);
            const maxLayer = d.layers - 1;
            for (let layer = 0; layer < d.layers; layer++) {
                const normalizedLayer = layer / (d.layers - 1);
                const curvedGrowth = Math.pow(normalizedLayer, 1.75);
                const layerSize = Math.max(1, d.baseSize * (0.3 + curvedGrowth * 0.5));
                const layerOpacity = Math.max(0.1, 0.4 - (layer * 0.05));
                const distanceFromEdge = Math.min(layer, maxLayer - layer);
                const constructionDelay = distanceFromEdge * 150;
                const deconstructionDelay = layer * 150;
                group.append('circle').attr('r', layerSize).attr('fill', d.color).attr('opacity', 0).datum({ ...d, layer, layerSize, layerOpacity, constructionDelay, deconstructionDelay, isConstructed:false, isDeconstructing:false });
            }
        });

        let carouselTime = 0; let initialLoadComplete = false; let heroAnimationTime = 0; let lastHeroCycle = 0;
        const totalDistance = width + 200 + 150; const cycleTimeMs = (totalDistance / baseCarouselSpeed) * 16.67 * 0.6;

        function animate(){
            carouselTime += 0.016; heroAnimationTime += 16.67;
            balloonGroups.each(function(d){
                const group = d3.select(this);
                d.x += d.horizontalSpeed;
                const verticalTime = carouselTime * d.verticalSpeed + d.verticalOffset;
                const verticalFloat = Math.sin(verticalTime) * d.verticalAmplitude;
                const currentY = d.y + verticalFloat;
                if (d.x > width * 0.8 + 100 && !d.isDeconstructing) {
                    d.isDeconstructing = true;
                    group.selectAll('circle').transition().delay(ld=>ld.deconstructionDelay).duration(600).attr('opacity',0).on('end', ld=>{ ld.isConstructed=false; });
                }
                if (d.x > width + 200) {
                    d.x = -100 - Math.random()*50;
                    const heroRect = document.querySelector('.hero-container').getBoundingClientRect();
                    const kgRect = document.querySelector('.knowledge-graph').getBoundingClientRect();
                    const relY = (heroRect.top + heroRect.bottom)/2 - kgRect.top;
                    d.y = relY + (Math.random()-0.5)*60;
                    d.isDeconstructing=false; d.isConstructed=false;
                }
                const shouldConstruct = (!initialLoadComplete && d.x > width*0.1 && d.x < width*0.8 && !d.isConstructed && !d.isDeconstructing) || (initialLoadComplete && d.x > width*0.1 && d.x < width*0.1+100 && !d.isConstructed && !d.isDeconstructing);
                if (shouldConstruct) {
                    d.isConstructed = true;
                    group.selectAll('circle').each(function(ld, li){ d3.select(this).transition().delay(ld.constructionDelay||0).duration(720).attr('opacity', Math.max(0.1, ld.layerOpacity||0.3)).on('end', ()=>{ ld.isConstructed=true; }); });
                }
                group.attr('transform', `translate(${d.x}, ${currentY})`);
                group.selectAll('circle').each(function(ld){
                    const time = carouselTime * d.animationSpeed + d.animationOffset; // no undefined layerDelay
                    const scale = 1 + Math.sin(time) * 0.3;
                    const opacity = ld.layerOpacity * (0.8 + Math.sin(time * 0.7) * 0.2);
                    const newRadius = ld.layerSize * scale;
                    if (!isNaN(newRadius) && newRadius > 0) {
                        d3.select(this).attr('r', newRadius).attr('opacity', Math.max(0, Math.min(1, opacity)));
                    }
                });
            });
            const currentCycle = Math.floor(heroAnimationTime / cycleTimeMs);
            if (currentCycle > lastHeroCycle) {
                lastHeroCycle = currentCycle; triggerHeroAnimation();
            }
            requestAnimationFrame(animate);
        }

        function triggerHeroAnimation(){
            const letters = document.querySelectorAll('.letter');
            if (lastHeroCycle % 2 === 0) {
                letters.forEach(letter => { letter.style.transition='color 1.5s ease-out'; letter.style.color='#ffffff'; letter.style.animation='none'; });
            } else {
                const map = { b:'#87CEEB', a:'#4682B4', r:'#1E90FF', k:'#000080', l:'#DC143C', e:'#FF4500', y:'#FF8C00' };
                letters.forEach(letter => { const key = letter.getAttribute('data-letter'); const color = map[key]; if (color) { letter.style.transition='color 1.5s ease-out'; letter.style.color = color; }});
            }
        }

        animate();
    }
});


