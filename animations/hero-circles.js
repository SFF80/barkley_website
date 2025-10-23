// Hero Circles (carousel balloons) - reusable ES module
// Depends on global d3 (include d3.v7 before this module)

export function initHeroCircles(options = {}) {
  const opts = Object.assign({
    svgId: 'graph-svg',
    containerSelector: '.knowledge-graph',
    // Reusability: no hard dependency on hero text
    // Optional anchoring controls:
    // - anchorY: explicit numeric y in container coords
    // - anchorSelector: a selector to compute vertical center from (optional)
    nodeCount: 40,
    baseCarouselSpeed: 0.2625,
    speedVariance: 0.4
  }, options);

  const svg = d3.select(`#${opts.svgId}`);
  const container = d3.select(opts.containerSelector);
  if (svg.empty() || container.empty()) {
    console.error('hero-circles: container or svg not found', opts);
    return { pause(){}, resume(){}, destroy(){} };
  }

  let width = container.node().clientWidth || window.innerWidth;
  let height = container.node().clientHeight || window.innerHeight;
  svg.attr('width', width).attr('height', height);

  const baseColors = [
    '#87CEEB','#4682B4','#1E90FF','#000080','#DC143C','#FF4500','#FF8C00',
    '#FF69B4','#8A2BE2','#FF1493'
  ];
  const enhancedColorIndex = Math.floor(Math.random() * baseColors.length);
  const enhancedColor = baseColors[enhancedColorIndex];
  const colors = [...baseColors, enhancedColor];

  function getAnchorY() {
    // 1) explicit numeric override
    if (typeof opts.anchorY === 'number' && !Number.isNaN(opts.anchorY)) return opts.anchorY;
    // 2) selector center
    if (opts.anchorSelector) {
      const el = document.querySelector(opts.anchorSelector);
      if (el) {
        const r = el.getBoundingClientRect();
        const kgRect = container.node().getBoundingClientRect();
        return (r.top + r.bottom) / 2 - kgRect.top;
      }
    }
    // 3) fallback: container vertical center
    return height * 0.5;
  }

  const anchorY = getAnchorY();

  const nodes = d3.range(opts.nodeCount).map(i => {
    const baseSize = Math.random() * 89.23 + 44.62;
    const layers = Math.floor(Math.random() * 7) + 4; // 4-10
    return {
      id: i,
      group: Math.floor(i / 5),
      color: colors[i % colors.length],
      baseSize,
      layers,
      x: Math.random() * (width + 200) - 100,
      y: anchorY + (Math.random() - 0.5) * 60,
      animationSpeed: Math.random() * 0.08 + 0.04,
      animationOffset: Math.random() * Math.PI * 2,
      verticalSpeed: Math.random() * 0.024 + 0.012,
      verticalOffset: Math.random() * Math.PI * 2,
      verticalAmplitude: Math.random() * 36 + 31.2,
      horizontalSpeed: opts.baseCarouselSpeed + (Math.random() - 0.5) * opts.speedVariance
    };
  });

  nodes.sort((a, b) => a.x - b.x);

  const root = svg.append('g');
  const groups = root.selectAll('g').data(nodes).enter().append('g')
    .attr('transform', d => `translate(${d.x}, ${d.y})`)
    .style('opacity', 1);

  groups.each(function(d) {
    const g = d3.select(this);
    for (let layer = 0; layer < d.layers; layer++) {
      const norm = d.layers <= 1 ? 1 : layer / (d.layers - 1);
      const curvedGrowth = Math.pow(norm, 1.75);
      const layerSize = Math.max(1, d.baseSize * (0.3 + curvedGrowth * 0.5));
      const layerOpacity = Math.max(0.1, 0.4 - (layer * 0.05));
      const maxLayer = d.layers - 1;
      const distanceFromEdge = Math.min(layer, maxLayer - layer);
      const constructionDelay = distanceFromEdge * 150;
      const deconstructionDelay = layer * 150;
      g.append('circle')
        .attr('r', layerSize)
        .attr('fill', d.color)
        .attr('opacity', 0)
        .datum({
          layer, layerSize, layerOpacity, constructionDelay, deconstructionDelay,
          isConstructed: false, isDeconstructing: false
        });
    }
  });

  groups.each(function(d, i){
    const g = d3.select(this);
    g.selectAll('circle').each(function(ld){
      d3.select(this)
        .transition()
        .delay(ld.constructionDelay)
        .duration(720)
        .attr('opacity', ld.layerOpacity)
        .on('end', function(){ ld.isConstructed = true; });
    });
  });

  let rafId = 0;
  let carouselTime = 0;
  function animate(){
    carouselTime += 0.016;
    groups.each(function(d){
      const g = d3.select(this);
      d.x += d.horizontalSpeed;
      const vTime = carouselTime * d.verticalSpeed + d.verticalOffset;
      const vFloat = Math.sin(vTime) * d.verticalAmplitude;
      const currentY = d.y + vFloat;
      if (d.x > width * 0.8 + 100 && !d.isDeconstructing) {
        d.isDeconstructing = true;
        g.selectAll('circle').transition().delay(ld => ld.deconstructionDelay).duration(600).attr('opacity', 0)
          .on('end', function(ld){ ld.isConstructed = false; });
      }
      if (d.x > width + 200) {
        d.x = -100 - Math.random() * 50;
        const newY = getAnchorY() + (Math.random() - 0.5) * 60;
        d.y = newY;
        d.isDeconstructing = false;
      }
      g.attr('transform', `translate(${d.x}, ${currentY})`);
      g.selectAll('circle').each(function(ld){
        const t = carouselTime * d.animationSpeed + d.animationOffset + (ld.layerDelay || 0);
        const scale = 1 + Math.sin(t) * 0.3;
        const opacity = ld.layerOpacity * (0.8 + Math.sin(t * 0.7) * 0.2);
        const r = Math.max(1, ld.layerSize * scale);
        d3.select(this).attr('r', r).attr('opacity', Math.max(0, Math.min(1, opacity)));
      });
    });
    rafId = requestAnimationFrame(animate);
  }

  function onResize(){
    width = container.node().clientWidth || window.innerWidth;
    height = container.node().clientHeight || window.innerHeight;
    svg.attr('width', width).attr('height', height);
  }

  window.addEventListener('resize', onResize);
  rafId = requestAnimationFrame(animate);

  return {
    pause(){ if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } },
    resume(){ if (!rafId) rafId = requestAnimationFrame(animate); },
    destroy(){
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      window.removeEventListener('resize', onResize);
      root.selectAll('*').remove();
    }
  };
}


