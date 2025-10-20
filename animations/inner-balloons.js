/*
  Inner Balloons Animation (non-landing pages)
  Modes:
    - type1: single primary colored balloon + grey companions clustered in the right column; brief intro then freeze
    - type2: transparent/colored swirl across the header band (10%–80% width); brief drift then freeze

  Usage (global):
    initInnerBalloons({
      containerSelector: '.inner-balloons',
      svgId: 'inner-balloons-svg',
      mode: 'type1' | 'type2' | 'colored' | 'transparent',
      nodeCount: 40,
      layerRange: [4, 10],
      curvedExponent: 1.75,
      introDurationMs: 4000,
      constructWindowPct: [0.10, 0.80],
      transparency: [0.12, 0.35],
      keepDrift: false,
      backgroundImageUrl: undefined,
      primaryHue: 'auto',
      clusterSize: 7
    });
*/

(function () {
  const palette = [
    '#87CEEB',
    '#4682B4',
    '#1E90FF',
    '#000080',
    '#DC143C',
    '#FF4500',
    '#FF8C00'
  ];

  function pickEnhancedColor() {
    const idx = Math.floor(Math.random() * palette.length);
    return palette[idx];
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function measure(containerSel) {
    const el = document.querySelector(containerSel);
    const rect = el ? el.getBoundingClientRect() : { width: 0, height: 0, top: 0 };
    return { el, width: rect.width, height: rect.height, rect };
  }

  function centerOf(selector, relativeToRect) {
    const target = document.querySelector(selector);
    if (!target) return { cx: relativeToRect.width * 0.5, cy: relativeToRect.height * 0.5 };
    const r = target.getBoundingClientRect();
    const cy = (r.top + r.bottom) / 2 - relativeToRect.top;
    return { cx: relativeToRect.width * 0.5, cy };
  }

  function makeNodes(count, rangeLayers, width, height, yCenter, constructWindowPct, baseSpeed) {
    // Random number of balloons between 10-15
    const actualCount = Math.floor(Math.random() * 6) + 10; // 10-15 balloons
    const nodes = [];
    for (let i = 0; i < actualCount; i++) {
      const layers = Math.floor(Math.random() * (rangeLayers[1] - rangeLayers[0] + 1)) + rangeLayers[0];
      const baseSize = Math.random() * 43.5 + 21.75; // 30% increase from previous size
      const x = (Math.random() * (constructWindowPct[1] - constructWindowPct[0]) + constructWindowPct[0]) * width;
      
      // Add velocity and vector properties for different movement directions
      const velocity = Math.random() * 1.0 + 0.5; // Random velocity between 0.5-1.5 (much more movement)
      const angle = Math.random() * Math.PI * 2; // Random direction (0-2π radians)
      const vx = Math.cos(angle) * velocity; // X component of velocity
      const vy = Math.sin(angle) * velocity; // Y component of velocity
      
      nodes.push({
        id: i,
        layers,
        baseSize,
        x,
        y: yCenter + (Math.random() - 0.5) * clamp(height * 0.2, 40, 120),
        animationSpeed: Math.random() * 0.08 + 0.04,
        animationOffset: Math.random() * Math.PI * 2,
        verticalSpeed: Math.random() * 0.024 + 0.012,
        verticalOffset: Math.random() * Math.PI * 2,
        verticalAmplitude: Math.random() * 36 + 31.2,
        horizontalSpeed: baseSpeed + (Math.random() - 0.5) * baseSpeed * 0.6,
        isConstructed: false,
        // New velocity and vector properties
        velocity: velocity,
        vx: vx, // X velocity component
        vy: vy, // Y velocity component
        angle: angle // Direction angle in radians
      });
    }
    return nodes;
  }

  function appendLayers(group, d, curvedExponent, opacityFn, delays) {
    // Random materialization start time within 1.5 second window
    const materializationStart = Math.random() * 1500; // 0-1.5 seconds
    // Random materialization duration between 0.65-1.95 seconds (30% slower)
    const materializationDuration = Math.random() * 1300 + 650; // 0.65-1.95 seconds
    
    for (let layer = 0; layer < d.layers; layer++) {
      const norm = d.layers <= 1 ? 1 : layer / (d.layers - 1);
      const growth = Math.pow(norm, curvedExponent);
      const r = Math.max(1, d.baseSize * (0.3 + growth * 0.5));
      const opacity = opacityFn(layer, d.layers);
      const constructionDelay = materializationStart + (Math.min(layer, d.layers - 1 - layer)) * delays.constructStep;
      group.append('circle')
        .attr('r', 0)
        .attr('fill', d.color)
        .attr('opacity', 0)
        .attr('class', `layer-${layer}`)
        .transition()
        .delay(constructionDelay)
        .duration(materializationDuration)
        .attr('r', r)
        .attr('opacity', opacity)
        .end?.()
        .catch(() => {});
    }
  }

  function animateRAF(state) {
    if (state.frozen) return;
    const { groups, nodes, t0, microDrift, width, height } = state;
    const now = performance.now();
    const elapsed = now - t0;

    // Zero gravity phase: 0-3 seconds, then slow down over 2 seconds
    const zeroGravityEnd = 3000; // 3 seconds
    const slowDownDuration = 2000; // 2 seconds
    const slowDownEnd = zeroGravityEnd + slowDownDuration;
    
    let speedMultiplier = 1;
    if (elapsed > zeroGravityEnd) {
      if (elapsed <= slowDownEnd) {
        // Gradual slowdown over 2 seconds
        const slowDownProgress = (elapsed - zeroGravityEnd) / slowDownDuration;
        speedMultiplier = 1 - (slowDownProgress * 0.9); // Slow down to 10% of original speed
      } else {
        // After slowdown, maintain very slow movement
        speedMultiplier = 0.1;
        // Freeze after the slowdown period if keepDrift is false
        if (!state.keepDrift) {
          state.frozen = true;
        }
      }
    }

    // Add weak repulsive force between balloons
    nodes.forEach((d, i) => {
      let repulsiveForceX = 0;
      let repulsiveForceY = 0;
      
      nodes.forEach((other, j) => {
        if (i !== j) {
          const dx = d.x - other.x;
          const dy = d.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (d.baseSize + other.baseSize) * 0.6; // Minimum distance between balloons
          
          if (distance < minDistance && distance > 0) {
            const force = (minDistance - distance) / minDistance;
            repulsiveForceX += (dx / distance) * force * 0.03; // Very weak horizontal repulsion (per frame)
            repulsiveForceY += (dy / distance) * force * 0.03; // Very weak vertical repulsion (per frame)
          }
        }
      });
      
      // Calculate weak gravity center (midpoint of column 2 of section 2)
      const gravityCenterX = width * 0.75; // Approximate center of right column
      const gravityCenterY = height * 0.5; // Vertical center
      const gravityStrength = 0.01; // Weak gravity (per frame)
      
      // Calculate gravity force towards center
      const gravityDx = gravityCenterX - d.x;
      const gravityDy = gravityCenterY - d.y;
      const gravityDistance = Math.sqrt(gravityDx * gravityDx + gravityDy * gravityDy);
      const gravityForceX = gravityDistance > 0 ? (gravityDx / gravityDistance) * gravityStrength : 0;
      const gravityForceY = gravityDistance > 0 ? (gravityDy / gravityDistance) * gravityStrength : 0;
      
      // Apply movement using velocity vectors with speed multiplier, repulsive forces, and gravity
      const oldX = d.x;
      const oldY = d.y;
      d.x += (d.vx * speedMultiplier) + repulsiveForceX + gravityForceX;
      d.y += (d.vy * speedMultiplier) + repulsiveForceY + gravityForceY;
      
      // Debug logging for first few balloons
      if (i < 3 && elapsed < 1000) {
        console.log(`Balloon ${i}: vx=${d.vx}, vy=${d.vy}, speedMult=${speedMultiplier}, moved from (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) to (${d.x.toFixed(1)}, ${d.y.toFixed(1)})`);
      }
      
      // Add subtle breathing animation on top of vector movement
      let amp = d.verticalAmplitude;
      if (microDrift) amp = amp * 0.2; // reduce amplitude after freeze when requested
      const verticalTime = elapsed * 0.001 * d.verticalSpeed + d.verticalOffset;
      const breathingOffset = Math.sin(verticalTime) * amp * 0.1; // Reduced breathing effect
      
      // Update position - works for both regular balloons and mask elements
      groups[i].attr('transform', `translate(${d.x}, ${d.y + breathingOffset})`);
    });

    // Don't freeze based on introDurationMs - let the zero gravity timing control the freeze
    // if (elapsed >= state.introDurationMs) {
    //   if (!state.keepDrift) {
    //     state.frozen = true;
    //   } else if (!state.microDrift) {
    //     state.microDrift = true;
    //     state.nodes.forEach(n => { n.horizontalSpeed = 0; });
    //   }
    // }

    if (!state.frozen) requestAnimationFrame(() => animateRAF(state));
  }

  function type2Swirl(svg, dims, opts) {
    const enhanced = pickEnhancedColor();
    const colorPool = [...palette, enhanced];

    const yAnchor = centerOf('.inner-hero-content h1, .inner-hero-content', dims.rect).cy;

    // Widen safe band to keep clear of left text column
    const windowPct = opts.constructWindowPct || [0.14, 0.86];
    const nodes = makeNodes(opts.nodeCount, opts.layerRange, dims.width, dims.height, yAnchor, windowPct, 0.15);
    
    // Add velocity properties to transparent balloons
    nodes.forEach((n, i) => { 
      n.color = colorPool[i % colorPool.length];
      // Add velocity properties for transparent balloons
      const velocity = Math.random() * 1.0 + 0.5; // Random velocity between 0.5-1.5
      const angle = Math.random() * Math.PI * 2; // Random direction
      n.vx = Math.cos(angle) * velocity;
      n.vy = Math.sin(angle) * velocity;
      n.velocity = velocity;
      n.angle = angle;
      
      // Debug logging for first few balloons
      if (i < 3) {
        console.log(`Transparent balloon ${i}: velocity=${velocity.toFixed(2)}, angle=${angle.toFixed(2)}, vx=${n.vx.toFixed(2)}, vy=${n.vy.toFixed(2)}`);
      }
    });

    if (opts.mode === 'transparent') {
      svg.selectAll('*').remove();
      const defs = svg.append('defs');
      const mask = defs.append('mask').attr('id', 'revealMask').attr('maskUnits', 'userSpaceOnUse');
      mask.append('rect').attr('x', 0).attr('y', 0).attr('width', dims.width).attr('height', dims.height).attr('fill', 'white');

      const g = mask.append('g');
      const groups = nodes.map(n => g.append('g').attr('transform', `translate(${n.x}, ${n.y})`));

      // Layered transparency per balloon: 3 concentric circles with increasing opacity and smaller radius
      const delays = { constructStep: 150, constructDuration: 320 };
      groups.forEach((gr, idx) => {
        const d = nodes[idx];
        const baseR = Math.max(1, d.baseSize * (0.3 + Math.pow(1, opts.curvedExponent) * 0.5));
        const r1 = baseR * 1.0;   // outer
        const r2 = baseR * 0.70;  // middle
        const r3 = baseR * 0.45;  // inner

        // Random materialization start time within 1.5 second window
        const materializationStart = Math.random() * 1500; // 0-1.5 seconds
        // Random materialization duration between 0.65-1.95 seconds (30% slower)
        const materializationDuration = Math.random() * 1300 + 650; // 0.65-1.95 seconds

        // Circle 1: ~90% transparency (black 0.9)
        gr.append('circle')
          .attr('r', 0)
          .attr('fill', 'black')
          .attr('opacity', 0)
          .transition()
          .delay(materializationStart)
          .duration(materializationDuration)
          .attr('r', r1)
          .attr('opacity', 0.90);

        // Circle 2: ~95% transparency
        gr.append('circle')
          .attr('r', 0)
          .attr('fill', 'black')
          .attr('opacity', 0)
          .transition()
          .delay(materializationStart + 200)
          .duration(materializationDuration)
          .attr('r', r2)
          .attr('opacity', 0.95);

        // Circle 3: 100% transparency at core
        gr.append('circle')
          .attr('r', 0)
          .attr('fill', 'black')
          .attr('opacity', 0)
          .transition()
          .delay(materializationStart + 350)
          .duration(materializationDuration)
          .attr('r', r3)
          .attr('opacity', 1.0);
      });

      svg.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', dims.width).attr('height', dims.height)
        .attr('fill', 'white')
        .attr('mask', 'url(#revealMask)');

      const state = {
        groups, nodes,
        width: dims.width, height: dims.height,
        introDurationMs: opts.introDurationMs,
        keepDrift: !!opts.keepDrift,
        frozen: false,
        microDrift: false,
        t0: performance.now()
      };
      requestAnimationFrame(() => animateRAF(state));
      return;
    }

    // Colored type2
    nodes.forEach((n, i) => { n.color = colorPool[i % colorPool.length]; });
    const g = svg.append('g');
    const groups = nodes.map(n => g.append('g').attr('transform', `translate(${n.x}, ${n.y})`));

    const opacityFn = (layer, total) => clamp(0.15 + (0.4 - 0.05 * layer), 0.12, 0.4);
    const delays = { constructStep: 150, constructDuration: 720 };
    groups.forEach((gr, idx) => appendLayers(gr, nodes[idx], opts.curvedExponent, opacityFn, delays));

    const state = {
      groups, nodes,
      width: dims.width, height: dims.height,
      introDurationMs: opts.introDurationMs,
      keepDrift: !!opts.keepDrift,
      frozen: false,
      microDrift: false,
      t0: performance.now()
    };
    requestAnimationFrame(() => animateRAF(state));
  }

  function type1Cluster(svg, dims, opts) {
    const clusterSize = Math.max(3, opts.clusterSize || 7);
    const yAnchor = centerOf('.section2-right, .inner-hero-content h1, .inner-hero-content', dims.rect).cy;
    const cx = dims.width * 0.72;
    const cy = yAnchor;

    const primary = opts.primaryHue === 'auto' ? pickEnhancedColor() : opts.primaryHue;
    const greys = ['#EFEFEF', '#E3E3E3', '#D8D8D8', '#CECECE'];

    const baseSpeed = 0.08;
    const nodes = [];
    for (let i = 0; i < clusterSize; i++) {
      const layers = Math.floor(Math.random() * (opts.layerRange[1] - opts.layerRange[0] + 1)) + opts.layerRange[0];
      const baseSize = (i === 0 ? 1.2 : 1.0) * (Math.random() * 34.13 + 24.38); // 30% increase from previous size
      const angle = Math.random() * Math.PI * 2;
      const radius = (i === 0 ? 0 : Math.random() * 120 + 30);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius * 0.6;
      
      // Add velocity and vector properties for type1 cluster balloons
      const velocity = Math.random() * 0.5 + 0.2; // Moderate velocity for cluster balloons (0.2-0.7, more movement)
      const moveAngle = Math.random() * Math.PI * 2; // Random movement direction
      const vx = Math.cos(moveAngle) * velocity;
      const vy = Math.sin(moveAngle) * velocity;
      
      nodes.push({
        id: i,
        layers,
        baseSize,
        x,
        y,
        color: i === 0 ? primary : greys[i % greys.length],
        animationSpeed: Math.random() * 0.06 + 0.03,
        animationOffset: Math.random() * Math.PI * 2,
        verticalSpeed: Math.random() * 0.015 + 0.008,
        verticalOffset: Math.random() * Math.PI * 2,
        verticalAmplitude: Math.random() * 18 + 10,
        horizontalSpeed: baseSpeed * (Math.random() - 0.5) * 0.1,
        // New velocity and vector properties
        velocity: velocity,
        vx: vx, // X velocity component
        vy: vy, // Y velocity component
        angle: moveAngle // Direction angle in radians
      });
    }

    const g = svg.append('g');
    const groups = nodes.map(n => g.append('g').attr('transform', `translate(${n.x}, ${n.y})`));

    const opacityFn = (layer) => clamp(0.15 + (0.4 - 0.05 * layer), 0.12, 0.4);
    const delays = { constructStep: 150, constructDuration: 600 };
    groups.forEach((gr, idx) => appendLayers(gr, nodes[idx], opts.curvedExponent, opacityFn, delays));

    const state = {
      groups, nodes,
      width: dims.width, height: dims.height,
      introDurationMs: Math.max(2000, Math.min(opts.introDurationMs || 3000, 5000)),
      keepDrift: false,
      frozen: false,
      microDrift: false,
      t0: performance.now()
    };
    requestAnimationFrame(() => animateRAF(state));
  }

  function initInnerBalloons(options) {
    const opts = Object.assign({
      containerSelector: '.inner-balloons',
      svgId: 'inner-balloons-svg',
      mode: 'type2',
      nodeCount: 8, // Max 8 balloons
      layerRange: [4, 10],
      curvedExponent: 1.75,
      introDurationMs: 6000, // 50% longer movement time
      constructWindowPct: [0.14, 0.86],
      transparency: [0.12, 0.35],
      keepDrift: false,
      backgroundImageUrl: undefined,
      primaryHue: 'auto',
      clusterSize: 7
    }, options || {});

    const dims = measure(opts.containerSelector);
    if (!dims.el) { console.warn('inner-balloons container not found:', opts.containerSelector); return; }

    if (opts.backgroundImageUrl) {
      const hero = dims.el.closest('.inner-hero');
      if (hero) {
        hero.style.backgroundImage = `url(${opts.backgroundImageUrl})`;
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';
      }
    }

    const svg = d3.select(`#${opts.svgId}`).attr('width', dims.width).attr('height', dims.height)
      .attr('role', 'img').attr('aria-hidden', 'true').attr('focusable', 'false');
    svg.selectAll('*').remove();

    const mode = (opts.mode === 'colored' || opts.mode === 'transparent') ? 'type2' : opts.mode;
    if (mode === 'type1') type1Cluster(svg, dims, opts); else type2Swirl(svg, dims, opts);

    if (window._innerBalloonsResizeHandler) window.removeEventListener('resize', window._innerBalloonsResizeHandler);
    window._innerBalloonsResizeHandler = () => { initInnerBalloons(opts); };
    window.addEventListener('resize', window._innerBalloonsResizeHandler, { passive: true });
  }

  // --- Section 2 Bubbles (unique load) ---
  function initSection2Bubbles(options) {
    const opts = Object.assign({
      containerSelector: '#section2-bubbles-svg',
      maxBubbles: 5,
      durationMs: 1500
    }, options || {});

    // Single-run guard to avoid duplicates if called again (e.g., key presses)
    if (window._section2BubblesInited) return;
    window._section2BubblesInited = true;

    const svgEl = document.querySelector(opts.containerSelector);
    if (!svgEl) return;
    const svg = d3.select(opts.containerSelector);
    const rect = svgEl.getBoundingClientRect();
    const width = rect.width; const height = rect.height;
    svg.attr('width', width).attr('height', height);
    svg.selectAll('*').remove();

    const minX = width * 0.5;
    const maxX = width * 0.95;

    const count = Math.min(5, Math.max(1, opts.maxBubbles));
    for (let i = 0; i < count; i++) {
      const delay = Math.random() * opts.durationMs;
      const x = minX + Math.random() * (maxX - minX);
      const y = height * (0.25 + Math.random() * 0.5);
      const baseR = 30 + Math.random() * 70;

      const g = svg.append('g').attr('transform', `translate(${x}, ${y})`).style('opacity', 0);
      g.transition().delay(delay).duration(200).style('opacity', 1);

      g.append('circle')
        .attr('r', 0)
        .attr('fill', '#FFFFFF')
        .attr('opacity', 0.25)
        .transition()
        .delay(delay)
        .duration(500)
        .attr('r', baseR);

      g.append('circle')
        .attr('r', 0)
        .attr('fill', '#EDEDED')
        .attr('opacity', 0.2)
        .transition()
        .delay(delay + 120)
        .duration(500)
        .attr('r', baseR * 0.6);
    }
  }

  // Expose
  window.initInnerBalloons = initInnerBalloons;
  window.initSection2Bubbles = initSection2Bubbles;
})();
