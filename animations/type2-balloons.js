// Type 2 Balloons - reusable module
// Transparent/colored layered circles spawning at top and drifting down (non-orbital)
// Depends on global d3

export function initType2Balloons(options = {}) {
  const opts = Object.assign({
    svgId: 'graph-svg',
    containerSelector: '.knowledge-graph',
    nodeCount: 10,
    layerRange: [8, 20],
    // vertical spawn anchor (top boundary within container)
    topBoundary: 60,
    // construct window on X as fraction of width
    constructWindowPct: [0.14, 0.86],
    // speed
    minFall: 0.4,
    maxFall: 1.2
  }, options);

  const svg = d3.select(`#${opts.svgId}`);
  const container = d3.select(opts.containerSelector);
  if (svg.empty() || container.empty()) {
    console.error('type2-balloons: container or svg not found', opts);
    return { pause(){}, resume(){}, destroy(){} };
  }

  const width = container.node().clientWidth || window.innerWidth;
  const height = container.node().clientHeight || window.innerHeight;
  svg.attr('width', width).attr('height', height);

  const colors = ['#FFFFFF'];

  function pickX(existing) {
    const left = opts.constructWindowPct[0];
    const right = opts.constructWindowPct[1];
    const tryX = () => (Math.random() * (right - left) + left) * width;
    let best = tryX();
    let bestScore = -Infinity;
    for (let i = 0; i < 10; i++) {
      const cand = tryX();
      let minD = Infinity;
      for (const e of existing) {
        const dx = cand - e.x;
        const dy = opts.topBoundary - e.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        minD = Math.min(minD, d);
      }
      if (minD > bestScore) { bestScore = minD; best = cand; }
    }
    return best;
  }

  const nodes = [];
  for (let i = 0; i < opts.nodeCount; i++) {
    const layers = Math.floor(Math.random() * (opts.layerRange[1] - opts.layerRange[0])) + opts.layerRange[0];
    const baseSize = Math.random() * 120 + 60;
    const x = pickX(nodes);
    const fall = Math.random() * (opts.maxFall - opts.minFall) + opts.minFall;
    nodes.push({ id:i, x, y: opts.topBoundary, layers, baseSize, vx: 0, vy: fall, color: colors[0] });
  }

  const root = svg.append('g');
  const groups = nodes.map(n => root.append('g').attr('transform', `translate(${n.x}, ${n.y})`));

  groups.forEach((g, idx) => {
    const d = nodes[idx];
    const start = Math.random() * 1200;
    for (let layer = 0; layer < d.layers; layer++) {
      const norm = d.layers <= 1 ? 1 : layer/(d.layers-1);
      const growth = Math.pow(norm, 1.75);
      const r = Math.max(1, d.baseSize * (0.3 + growth * 0.5));
      const distanceFromEdge = Math.min(layer, d.layers-1 - layer);
      const delay = start + distanceFromEdge * 120;
      g.append('circle')
        .attr('r', 0)
        .attr('fill', '#FFFFFF')
        .attr('opacity', Math.max(0.1, 0.8 - (layer * 0.25)))
        .attr('stroke', 'lightgrey')
        .attr('stroke-width', 1)
        .transition()
        .delay(delay)
        .duration(3600)
        .attr('r', r);
    }
  });

  let rafId = 0;
  function animate(){
    nodes.forEach((d, i) => {
      d.x += d.vx;
      d.y += d.vy;
      // keep within right side of container
      if (d.x < width*0.5 + 100) d.x = width*0.5 + 100;
      if (d.x > width) d.x = width;
      if (d.y > height) { d.y = opts.topBoundary; } // recycle to top
      groups[i].attr('transform', `translate(${d.x}, ${d.y})`);
    });
    rafId = requestAnimationFrame(animate);
  }
  rafId = requestAnimationFrame(animate);

  return {
    pause(){ if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } },
    resume(){ if (!rafId) rafId = requestAnimationFrame(animate); },
    destroy(){ if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } root.selectAll('*').remove(); }
  };
}


