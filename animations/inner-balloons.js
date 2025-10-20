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
    // Random number of balloons between 20-30 (90% reduction from 200-300)
    const actualCount = Math.floor(Math.random() * 11) + 20; // 20-30 balloons
    const nodes = [];
    for (let i = 0; i < actualCount; i++) {
      const layers = Math.floor(Math.random() * (rangeLayers[1] - rangeLayers[0] + 1)) + rangeLayers[0];
      const baseSize = Math.random() * 93.96 + 47.0; // 2x max size (doubled from previous)
      const x = (Math.random() * (constructWindowPct[1] - constructWindowPct[0]) + constructWindowPct[0]) * width;
      
      // Unique velocity and initial trajectory for each balloon
      const uniqueVelocity = Math.random() * 3.0 + 0.5; // Wide range: 0.5-3.5
      const uniqueAngle = Math.random() * Math.PI * 2; // Random direction (0-2π radians)
      
      // Calculate initial orbital velocity based on distance from the large gravitational body below
      const centerBodyX = width * 0.5; // Center horizontally
      const centerBodyY = height * 1.2; // Below the visible area (20% below bottom)
      
      // Calculate distance to the center gravitational body
      const dx = x - centerBodyX;
      const dy = yCenter - centerBodyY;
      const orbitalDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Mix orbital motion with unique trajectory
      const tangentialAngle = Math.atan2(-dx, dy); // Perpendicular to radius vector
      const orbitalVelocity = uniqueVelocity * Math.sqrt(1 / Math.max(orbitalDistance, 10)); // Orbital velocity decreases with distance
      
      // Combine orbital motion with unique random trajectory
      const orbitalVx = Math.cos(tangentialAngle) * orbitalVelocity;
      const orbitalVy = Math.sin(tangentialAngle) * orbitalVelocity;
      const randomVx = Math.cos(uniqueAngle) * uniqueVelocity * 0.3; // 30% random component
      const randomVy = Math.sin(uniqueAngle) * uniqueVelocity * 0.3; // 30% random component
      
      const vx = orbitalVx + randomVx; // Combined velocity
      const vy = orbitalVy + randomVy; // Combined velocity
      
      // Remove swirl trajectory properties - no more circular motion
      
      // Calculate gravity factor proportional to radius (larger balloons have more gravity)
      const gravityFactor = baseSize / 50; // Normalize to reasonable gravity values
      
      nodes.push({
        id: i,
        layers,
        baseSize,
        x,
        y: yCenter + (Math.random() - 0.5) * clamp(height * 0.1, 20, 60) + (height * 0.2), // Match originalY calculation
        animationSpeed: Math.random() * 0.08 + 0.04,
        animationOffset: Math.random() * Math.PI * 2,
        verticalSpeed: Math.random() * 0.024 + 0.012,
        verticalOffset: Math.random() * Math.PI * 2,
        verticalAmplitude: Math.random() * 43.2 + 37.44, // 20% increase in vertical movement
        horizontalSpeed: baseSpeed + (Math.random() - 0.5) * baseSpeed * 0.6,
        isConstructed: false,
        // New velocity and vector properties
        velocity: uniqueVelocity, // Use unique velocity
        vx: vx, // X velocity component (combined orbital + random)
        vy: vy, // Y velocity component (combined orbital + random)
        angle: uniqueAngle, // Use unique angle
        orbitalAngle: tangentialAngle, // Store orbital angle separately
        collisionCooldown: 0, // Collision cooldown counter
        gravityFactor: gravityFactor, // Gravity factor proportional to radius
        originalX: x, // Store original position
        originalY: yCenter + (Math.random() - 0.5) * clamp(height * 0.1, 20, 60) + (height * 0.2) // Reduced variance in materialization point
      });
    }
    return nodes;
  }

  function appendLayers(group, d, curvedExponent, opacityFn, delays) {
    // Random materialization start time within 1.5 second window
    const materializationStart = Math.random() * 1500; // 0-1.5 seconds
    
    for (let layer = 0; layer < d.layers; layer++) {
      const norm = d.layers <= 1 ? 1 : layer / (d.layers - 1);
      // Use landing page non-linear scaling method
      const curvedGrowth = Math.pow(norm, 1.75); // Curved function with constant 1.75 (from landing page)
      const r = Math.max(1, d.baseSize * (0.3 + curvedGrowth * 0.5)); // Curved layer sizing (from landing page)
      const layerOpacity = opacityFn ? opacityFn(layer, d.layers) : Math.max(0.2, 0.6 - (layer * 0.1)); // Use provided opacity function or default
      
      // Landing page construction method: biggest and smallest appear first, then work inward/outward
      const maxLayer = d.layers - 1;
      const distanceFromEdge = Math.min(layer, maxLayer - layer);
      const constructionDelay = materializationStart + (distanceFromEdge * 150); // Edge layers appear first
      const deconstructionDelay = layer * 150; // Inner layers disappear first
      
      group.append('circle')
        .attr('r', 0)
        .attr('fill', d.color)
        .attr('opacity', 0)
        .attr('class', `layer-${layer}`)
        .datum({
          layer: layer,
          layerSize: r,
          layerOpacity: layerOpacity,
          constructionDelay: constructionDelay,
          deconstructionDelay: deconstructionDelay,
          isConstructed: false,
          isDeconstructing: false
        })
        .transition()
        .delay(constructionDelay)
        .duration(720) // Landing page duration
        .attr('r', r)
        .attr('opacity', layerOpacity)
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

    // Add continuous repulsive force between balloons
    nodes.forEach((d, i) => {
      let repulsiveForceX = 0;
      let repulsiveForceY = 0;
      
      nodes.forEach((other, j) => {
        if (i !== j) {
          const dx = d.x - other.x;
          const dy = d.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (d.baseSize + other.baseSize) * 0.8; // Reduced minimum distance
          
          if (distance < minDistance && distance > 0) {
            // Linear repulsive force - prevents orbiting
            const repulsiveStrength = (minDistance - distance) / minDistance;
            const repulsiveAngle = Math.atan2(dy, dx);
            
            // Apply weaker, more linear repulsive force
            const repulsiveX = Math.cos(repulsiveAngle) * repulsiveStrength * 0.02;
            const repulsiveY = Math.sin(repulsiveAngle) * repulsiveStrength * 0.02;
            
            repulsiveForceX += repulsiveX;
            repulsiveForceY += repulsiveY;
          }
        }
      });
      
      // Orbital mechanics: Single large gravitational body below center
      const centerBodyX = width * 0.5; // Center horizontally
      const centerBodyY = height * 1.2; // Below the visible area (20% below bottom)
      const gravityStrength = 1.0; // Very high gravity for strong attraction
      
      // Calculate force from the large gravitational body below
      const centerDx = centerBodyX - d.x;
      const centerDy = centerBodyY - d.y;
      const centerDistance = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
      
      let totalGravityForceX = 0;
      let totalGravityForceY = 0;
      
      if (centerDistance > 0) {
        const centerForce = (gravityStrength * d.gravityFactor) / (centerDistance * centerDistance); // Inverse square law with balloon gravity factor
        totalGravityForceX = (centerDx / centerDistance) * centerForce;
        totalGravityForceY = (centerDy / centerDistance) * centerForce;
      }
      
        // Remove swirl trajectory - no more circular motion
      
      // Apply movement using velocity vectors with speed multiplier, repulsive forces, and orbital gravity
      const oldX = d.x;
      const oldY = d.y;
      d.x += (d.vx * speedMultiplier) + repulsiveForceX + totalGravityForceX;
      d.y += (d.vy * speedMultiplier) + repulsiveForceY + totalGravityForceY;
      
      // Boundary bouncing to keep balloons in right half (50% of width)
      const rightBoundary = width * 0.5; // Left boundary of right half
      const leftBoundary = 0;
      const topBoundary = 0;
      const bottomBoundary = height;
      
      // Bounce off left boundary (keep in right half)
      if (d.x < rightBoundary) {
        d.x = rightBoundary;
        d.vx = Math.abs(d.vx) * 0.8; // Bounce right with 20% momentum loss
      }
      
      // Bounce off right boundary
      if (d.x > width) {
        d.x = width;
        d.vx = -Math.abs(d.vx) * 0.8; // Bounce left with 20% momentum loss
      }
      
      // Bounce off top boundary
      if (d.y < topBoundary) {
        d.y = topBoundary;
        d.vy = Math.abs(d.vy) * 0.8; // Bounce down with 20% momentum loss
      }
      
      // Bounce off bottom boundary
      if (d.y > bottomBoundary) {
        d.y = bottomBoundary;
        d.vy = -Math.abs(d.vy) * 0.8; // Bounce up with 20% momentum loss
      }
      
      // Debug logging for first few balloons
      if (i < 3 && elapsed < 1000) {
        console.log(`Balloon ${i}: vx=${d.vx.toFixed(3)}, vy=${d.vy.toFixed(3)}, speedMult=${speedMultiplier.toFixed(3)}, moved from (${oldX.toFixed(1)}, ${oldY.toFixed(1)}) to (${d.x.toFixed(1)}, ${d.y.toFixed(1)})`);
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
      
      // Create balloons directly on SVG (not in mask) for visible concentric circles
      const g = svg.append('g');
      const groups = nodes.map(n => g.append('g').attr('transform', `translate(${n.x}, ${n.y})`));

      // Layered transparency per balloon: multiple concentric circles with increasing transparency
      console.log(`Creating ${groups.length} balloon groups for transparent mode`);
      groups.forEach((gr, idx) => {
        const d = nodes[idx];
        const materializationStart = Math.random() * 1500; // 0-1.5 seconds
        
        // Create multiple layers like landing page
        console.log(`Creating ${d.layers} layers for transparent balloon ${idx} at position (${d.x.toFixed(1)}, ${d.y.toFixed(1)}) with baseSize ${d.baseSize.toFixed(1)}`);
        for (let layer = 0; layer < d.layers; layer++) {
          const norm = d.layers <= 1 ? 1 : layer / (d.layers - 1);
          // Use landing page non-linear scaling method
          const curvedGrowth = Math.pow(norm, 1.75); // Curved function with constant 1.75
          const r = Math.max(1, d.baseSize * (0.3 + curvedGrowth * 0.5)); // Curved layer sizing
          
          // Landing page construction method: biggest and smallest appear first
          const maxLayer = d.layers - 1;
          const distanceFromEdge = Math.min(layer, maxLayer - layer);
          const constructionDelay = materializationStart + (distanceFromEdge * 150); // Edge layers appear first
          
          // Increasing transparency: outer layers more opaque, inner layers more transparent
          // Union of circles becomes increasingly transparent up to total transparency at 3+ layers
          const transparency = Math.max(0.1, 0.8 - (layer * 0.25)); // 80% to 10% opacity (decreasing)
          
          console.log(`  Layer ${layer}: radius=${r.toFixed(1)}, transparency=${transparency.toFixed(2)}, delay=${constructionDelay}ms`);
          
          gr.append('circle')
            .attr('r', 0)
            .attr('fill', 'white') // White fill for transparent effect
            .attr('opacity', 0)
            .attr('stroke', 'lightgrey') // Light grey stroke for visibility
            .attr('stroke-width', 1)
            .transition()
            .delay(constructionDelay)
            .duration(720) // Landing page duration
            .attr('r', r)
            .attr('opacity', transparency);
        }
      });

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

    const opacityFn = (layer, total) => clamp(0.3 + (0.6 - 0.1 * layer), 0.2, 0.8); // More visible opacity range
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
    // Use identical Type 2 behavior for Type 1
    return type2Swirl(svg, dims, opts);
  }

  function initInnerBalloons(options) {
    const opts = Object.assign({
      containerSelector: '.inner-balloons',
      svgId: 'inner-balloons-svg',
      mode: 'type2',
      nodeCount: 8, // Max 8 balloons
      layerRange: [8, 20], // 2x increase in max internal circle layers
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
