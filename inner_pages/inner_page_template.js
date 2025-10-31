// Inner Page Template - duplicated logic from landing page
document.addEventListener('DOMContentLoaded', function() {
    const heroContainer = document.getElementById('hero-container');
    const mainContent = document.getElementById('main-content');

    // Initialize D3 circles animation (identical behavior)
    initD3Circles();

    // Inner pages: reveal immediately, no fade timing
    if (mainContent) mainContent.classList.remove('hidden');

    // Flip body from preload -> preload-done on first animation frame so everything appears at once
    requestAnimationFrame(() => {
        document.body.classList.remove('preload');
        document.body.classList.add('preload-done');
    });

    // Minimal copy of the D3 animation from script.js with the same interfaces
    function initD3Circles() {
        const svg = d3.select('#graph-svg');
        const knowledgeGraphContainer = d3.select('.knowledge-graph');
        let width = knowledgeGraphContainer.node().clientWidth; // container width (may change via CSS/grid)
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
        // Expose enhanced color to CSS variables so multiple titles match exactly
        document.documentElement.style.setProperty('--enhanced-color', enhancedColor);
        if (document.body.classList.contains('capability-page')) {
            const descriptorColor = getDarkestColor(colors) || '#061036';
            document.documentElement.style.setProperty('--capability-descriptor-color', descriptorColor);
        }
        const heroCopyTitle = document.querySelector('.hero-copy h2');
        if (heroCopyTitle) heroCopyTitle.style.color = enhancedColor;
        const resourcesTitle = document.querySelector('.resources-section h3');
        if (resourcesTitle) resourcesTitle.style.color = enhancedColor;
        const barkleyText = document.querySelector('.data-column.right-column strong');
        if (barkleyText) barkleyText.style.color = enhancedColor;

        // Match nav active link color to the section color (inner pages only)
        (function colorActiveNav(){
            let activeLink = document.querySelector('.nav-links a.active');
            if (!activeLink) {
                const current = (location.pathname || '').split('/').pop();
                document.querySelectorAll('.nav-links a').forEach(a => {
                    const href = a.getAttribute('href') || '';
                    if (href.endsWith(current)) activeLink = a;
                });
            }
            if (activeLink) activeLink.style.color = enhancedColor;
        })();

        // Anchor balloons vertically to the centerline of the hero container (no hero text on inner pages)
        const heroContainerRect = document.querySelector('.hero-container').getBoundingClientRect();
        const knowledgeGraphRect = document.querySelector('.knowledge-graph').getBoundingClientRect();
        const heroTextRelativeY = (heroContainerRect.top + heroContainerRect.bottom) / 2 - knowledgeGraphRect.top;

        // Responsive density and sizing (Section 2 only)
        const containerW = width;
        let nodeCount = 40;
        if (containerW < 1200) nodeCount = 30;
        if (containerW < 900) nodeCount = 22;
        const nodes = d3.range(nodeCount).map(i => ({
            id: i,
            group: Math.floor(i / 5),
            color: colors[i % colors.length],
            baseSize: (containerW < 1200
              ? Math.random() * 75 + 38
              : Math.random() * 89.23 + 44.62),
            layers: Math.floor(Math.random() * 7) + 4,
            x: Math.random() * (width + 200) - 100,
            y: heroTextRelativeY + (Math.random() - 0.5) * 60,
            animationSpeed: Math.random() * 0.08 + 0.04,
            animationOffset: Math.random() * Math.PI * 2,
            verticalSpeed: Math.random() * 0.024 + 0.012,
            verticalOffset: Math.random() * Math.PI * 2,
            verticalAmplitude: (containerW < 1200
              ? Math.random() * 30 + 26
              : Math.random() * 36 + 31.2),
            horizontalSpeed: baseCarouselSpeed + (Math.random() - 0.5) * speedVariance,
            // Approximate maximum outer radius, including breathing scale
            maxRadius: (Math.random() * 89.23 + 44.62) * 0.8 * 1.3 // fallback; refined below per-group
        }));

        nodes.sort((a, b) => a.x - b.x);
        const balloonGroups = svg.append('g').selectAll('g').data(nodes).enter().append('g').attr('transform', d => `translate(${d.x}, ${d.y})`).style('opacity', 1);

        balloonGroups.each(function(d){
            const group = d3.select(this);
            const maxLayer = d.layers - 1;
            let computedMax = 0;
            for (let layer = 0; layer < d.layers; layer++) {
                const normalizedLayer = layer / (d.layers - 1);
                const curvedGrowth = Math.pow(normalizedLayer, 1.75);
                const layerSize = Math.max(1, d.baseSize * (0.3 + curvedGrowth * 0.5));
                const layerOpacity = Math.max(0.1, 0.4 - (layer * 0.05));
                const distanceFromEdge = Math.min(layer, maxLayer - layer);
                const constructionDelay = distanceFromEdge * 150;
                const deconstructionDelay = layer * 150;
                group.append('circle').attr('r', layerSize).attr('fill', d.color).attr('opacity', 0).datum({ ...d, layer, layerSize, layerOpacity, constructionDelay, deconstructionDelay, isConstructed:false, isDeconstructing:false });
                if (layerSize > computedMax) computedMax = layerSize;
            }
            // store a conservative max radius including breathing scale (1.3x)
            d.maxRadius = Math.max(d.maxRadius || 0, computedMax * 1.3);
        });

        let carouselTime = 0; let initialLoadComplete = false; let heroAnimationTime = 0; let lastHeroCycle = 0;
        const totalDistance = width + 200 + 150; const cycleTimeMs = (totalDistance / baseCarouselSpeed) * 16.67 * 0.6;

        function animate(){
            carouselTime += 0.016; heroAnimationTime += 16.67;
            const GUTTER = 12; // keep balloons off text gutter (aligned to Section 2 padding)
            const LEFT_BOUNDARY = 0 + GUTTER;
            const RIGHT_BOUNDARY = width - GUTTER;
            const FADE_LEAD = 8; // deconstruction begins very close to the right boundary
            const CONSTRUCT_SHIFT = Math.max(12, (RIGHT_BOUNDARY - LEFT_BOUNDARY) * 0.02); // move materialisation window rightwards
            const CONSTRUCT_WINDOW = Math.max(60, (RIGHT_BOUNDARY - LEFT_BOUNDARY) * 0.04); // narrower, proportional window
            balloonGroups.each(function(d){
                const group = d3.select(this);
                d.x += d.horizontalSpeed;
                const verticalTime = carouselTime * d.verticalSpeed + d.verticalOffset;
                const verticalFloat = Math.sin(verticalTime) * d.verticalAmplitude;
                const currentY = d.y + verticalFloat;
                // Start deconstruction before the outer edge reaches the right boundary
                if ((d.x + (d.maxRadius||0)) >= (RIGHT_BOUNDARY - FADE_LEAD) && !d.isDeconstructing) {
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
                // Construct only when the balloon center has moved sufficiently into the band (shifted right), with a smaller window
                const constructGateLeft = LEFT_BOUNDARY + (d.maxRadius||0) + FADE_LEAD + CONSTRUCT_SHIFT;
                const shouldConstructWindowRight = constructGateLeft + CONSTRUCT_WINDOW;
                const shouldConstruct = (
                    d.x > constructGateLeft && d.x < shouldConstructWindowRight && !d.isConstructed && !d.isDeconstructing
                );
                if (shouldConstruct) {
                    d.isConstructed = true;
                    group.selectAll('circle').each(function(ld, li){ d3.select(this).transition().delay(ld.constructionDelay||0).duration(720).attr('opacity', Math.max(0.1, ld.layerOpacity||0.3)).on('end', ()=>{ ld.isConstructed=true; }); });
                }
                group.attr('transform', `translate(${d.x}, ${currentY})`);
                group.selectAll('circle').each(function(ld){
                    const time = carouselTime * d.animationSpeed + d.animationOffset;
                    const scale = 1 + Math.sin(time) * 0.3;
                    const opacity = ld.layerOpacity * (0.8 + Math.sin(time * 0.7) * 0.2);
                    const newRadius = ld.layerSize * scale;
                    if (!isNaN(newRadius) && newRadius > 0) {
                        d3.select(this).attr('r', newRadius);
                    }
                    // Only show breathing opacity for layers that have been constructed
                    if (ld.isConstructed) {
                        d3.select(this).attr('opacity', Math.max(0, Math.min(1, opacity)));
                    } else {
                        d3.select(this).attr('opacity', 0);
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

        function adjustColorLuminance(hex, luminance) {
            if (typeof hex !== 'string') return null;
            let normalized = hex.replace(/[^0-9a-f]/gi, '');
            if (normalized.length === 3) {
                normalized = normalized.split('').map(ch => ch + ch).join('');
            }
            if (normalized.length !== 6) return null;
            const factor = Math.max(-1, Math.min(1, luminance || 0));
            let result = '#';
            for (let i = 0; i < 3; i++) {
                const channel = parseInt(normalized.substr(i * 2, 2), 16);
                if (Number.isNaN(channel)) return null;
                const adjusted = Math.max(0, Math.min(255, Math.round(channel + channel * factor)));
                result += adjusted.toString(16).padStart(2, '0');
            }
            return result;
        }

        function getDarkestColor(colorsList) {
            if (!Array.isArray(colorsList) || colorsList.length === 0) return null;
            let darkest = null;
            let lowestLuminance = Infinity;
            colorsList.forEach(color => {
                const luminance = getRelativeLuminance(color);
                if (luminance !== null && luminance < lowestLuminance) {
                    lowestLuminance = luminance;
                    darkest = color;
                }
            });
            return darkest;
        }

        function getRelativeLuminance(hex) {
            if (typeof hex !== 'string') return null;
            let normalized = hex.replace(/[^0-9a-f]/gi, '');
            if (normalized.length === 3) {
                normalized = normalized.split('').map(ch => ch + ch).join('');
            }
            if (normalized.length !== 6) return null;
            const channels = [0, 1, 2].map(i => parseInt(normalized.substr(i * 2, 2), 16) / 255);
            if (channels.some(c => Number.isNaN(c))) return null;
            const srgb = channels.map(component => component <= 0.03928 ? component / 12.92 : Math.pow((component + 0.055) / 1.055, 2.4));
            return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
        }
    }
});


