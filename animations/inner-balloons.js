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

  function makeNodes(count, rangeLayers, width, height, yCenter, constructWindowPct, baseSpeed, mode = 'default', options = {}) {
    // Use the provided count parameter instead of hardcoded range
    const actualCount = count;
    const nodes = [];
    
    // Helper function to find best spawn position (furthest from existing balloons)
    function findBestSpawnPosition(existingNodes, width, topBoundary, constructWindowPct) {
      const leftBound = constructWindowPct[0]; // Use configuration
      const rightBound = constructWindowPct[1]; // Use configuration
      const minDistance = 150; // Minimum distance from existing balloons
      
      let bestX = 0;
      let maxMinDistance = 0;
      
      // Try multiple random positions and pick the one with maximum minimum distance
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidateX = (Math.random() * (rightBound - leftBound) + leftBound) * width;
        
        // Calculate minimum distance to any existing balloon
        let minDistToExisting = Infinity;
        for (const existingNode of existingNodes) {
          const dx = candidateX - existingNode.x;
          const dy = topBoundary - existingNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          minDistToExisting = Math.min(minDistToExisting, distance);
        }
        
        // If this is the best position so far, keep it
        if (minDistToExisting > maxMinDistance) {
          maxMinDistance = minDistToExisting;
          bestX = candidateX;
        }
      }
      
      return bestX;
    }
    
    for (let i = 0; i < actualCount; i++) {
      // Use type-specific size multipliers from configuration
      const baseMaxSize = 140.96 * 1.4; // Base maximum size (197.34)
      const baseMinSize = baseMaxSize * 0.8; // Base minimum size (157.87)
      
      // Get size multipliers from the configuration (passed via options)
      const sizeMultiplier = options?.sizeMultiplier || 1.0;
      const minSizeMultiplier = options?.minSizeMultiplier || 0.8;
      
      const maxSize = baseMaxSize * sizeMultiplier;
      const minSize = baseMinSize * minSizeMultiplier;
      const baseSize = Math.random() * (maxSize - minSize) + minSize; // Range from 80% to 100% of max
      
      // Make number of layers proportional to balloon radius - use type-specific range
      const layerRange = options?.layerRange || [14, 24];
      const minLayers = layerRange[0];
      const maxLayers = layerRange[1];
      const sizeRatio = (baseSize - minSize) / (maxSize - minSize); // 0 to 1
      const layers = Math.floor(minLayers + (maxLayers - minLayers) * sizeRatio);
      
        // Use anti-clustering positioning
        const topBoundary = 60; // Navigation bar height
        const x = findBestSpawnPosition(nodes, width, topBoundary, constructWindowPct);
      
      // All balloons spawn at top boundary and drift down
      let minFallSpeed = 0.5 * 1.3 * 1.3; // Increased by 30% (0.5 * 1.3 * 1.3 = 0.845)
      let maxFallSpeed = 2.0 * 1.3 * 1.3; // Increased by 30% (2.0 * 1.3 * 1.3 = 3.38)
      
      // Type 3 specific speed increase (50% faster minimum speed)
      if (mode === 'type3') {
        minFallSpeed *= 1.5; // 50% increase for Type 3 minimum speed
        maxFallSpeed *= 1.5; // 50% increase for Type 3 maximum speed
      }
      
      const fallSpeed = Math.random() * (maxFallSpeed - minFallSpeed) + minFallSpeed;
      
      // Add horizontal force at inception
      const horizontalForce = (Math.random() - 0.5) * 1.0; // -0.5 to 0.5 horizontal drift
      
      const vx = horizontalForce; // Horizontal drift
      const vy = fallSpeed; // Downward fall speed
      
      // Remove swirl trajectory properties - no more circular motion
      
      // Calculate gravity factor proportional to radius (larger balloons have more gravity)
      const gravityFactor = baseSize / 50; // Normalize to reasonable gravity values
      
      nodes.push({
        id: i,
        layers,
        baseSize,
        x,
        y: topBoundary, // Spawn at top boundary
        animationSpeed: Math.random() * 0.08 + 0.04,
        animationOffset: Math.random() * Math.PI * 2,
        verticalSpeed: Math.random() * 0.024 + 0.012,
        verticalOffset: Math.random() * Math.PI * 2,
        verticalAmplitude: Math.random() * 43.2 + 37.44, // 20% increase in vertical movement
        horizontalSpeed: baseSpeed + (Math.random() - 0.5) * baseSpeed * 0.6,
        isConstructed: false,
        // New velocity and vector properties for falling motion
        velocity: fallSpeed, // Use fall speed
        vx: vx, // X velocity component (horizontal drift)
        vy: vy, // Y velocity component (downward fall)
        angle: Math.PI / 2, // Downward direction
        orbitalAngle: 0, // No orbital motion
        collisionCooldown: 0, // Collision cooldown counter
        gravityFactor: gravityFactor, // Gravity factor proportional to radius
        originalX: x, // Store original position
        originalY: topBoundary // Match the spawn position
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
        .duration(3600) // 5x slower than original (720 * 5)
        .attr('r', r)
        .attr('opacity', layerOpacity)
        .end?.()
        .catch(() => {});
    }
  }

  function animateRAF(state, opts) {
    // For Type 2 and Type 3, don't stop the animation loop even when "frozen" - we need it for dematerialization
    if (state.frozen && opts.mode !== 'type2' && opts.mode !== 'type3') return;
    const { groups, nodes, t0, microDrift, width, height } = state;
    const now = performance.now();
    const elapsed = now - t0;

    // Zero gravity phase: 0-3 seconds, then slow down over 2 seconds
    const zeroGravityEnd = 3000; // 3 seconds
    const slowDownDuration = 2000; // 2 seconds
    const slowDownEnd = zeroGravityEnd + slowDownDuration;
    
    let speedMultiplier = 1;
    
    // Type 3 specific speed increase (30% faster)
    if (opts.mode === 'type3') {
      speedMultiplier *= 1.3; // 30% increase for Type 3
    }
    
    if (elapsed > zeroGravityEnd) {
      if (elapsed <= slowDownEnd) {
        // Gradual slowdown over 2 seconds
        const slowDownProgress = (elapsed - zeroGravityEnd) / slowDownDuration;
        speedMultiplier = speedMultiplier * (1 - (slowDownProgress * 0.9)); // Slow down to 10% of original speed
      } else {
        // After slowdown, maintain very slow movement
        speedMultiplier = speedMultiplier * 0.1;
        // Don't freeze for Type 2 and Type 3 - we need the animation loop to continue for dematerialization
        if (!state.keepDrift && opts.mode !== 'type2' && opts.mode !== 'type3') {
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
            // Inverse square law repulsive force - stronger when closer
            const repulsiveStrength = 1 / (distance * distance); // Inverse square law
            const repulsiveAngle = Math.atan2(dy, dx);
            
            // Apply directional repulsive force (both X and Y components) - type-specific
            const repulsiveForceMultiplier = opts.repulsiveForce || 0.02;
            const repulsiveX = Math.cos(repulsiveAngle) * repulsiveStrength * repulsiveForceMultiplier;
            const repulsiveY = Math.sin(repulsiveAngle) * repulsiveStrength * repulsiveForceMultiplier;
            
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
      
      // Boundary bouncing to keep balloons in right portion (center + 100px)
      const rightBoundary = width * 0.5 + 100; // Left boundary: center + 100px
      const leftBoundary = -100; // Reduced by 100px
      const topBoundary = 60; // Navigation bar height (approximately 60px)
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
        
        // Type 3 specific: Reduce velocity after first bottom bounce
        if (opts.mode === 'type3' && !d.hasBouncedBottom) {
          d.hasBouncedBottom = true;
          d.vx *= 0.5; // Reduce horizontal velocity by 50%
          d.vy *= 0.5; // Reduce vertical velocity by 50%
          console.log(`Type 3 balloon ${i} first bottom bounce - velocity reduced by 50%`);
        }
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
      
        // Add breathing effect based on type-specific configuration
        if (opts.breathingEnabled) {
        groups[i].selectAll('circle').each(function(circleData) {
          if (circleData && circleData.layerSize) {
            const circle = d3.select(this);
            const baseRadius = circleData.layerSize;
            const layer = circleData.layer || 0;
            
            // Type 3: Original complex breathing effect
            const breathingRate = 0.8 + (layer * 0.1); // 0.8 to 1.8 seconds per breath cycle
            const breathingAmplitude = 0.05 + (layer * 0.02); // 5% to 15% size variation
            const breathingPhase = layer * 0.5; // Stagger the phases
            
            const breathingTime = elapsed * 0.001 * breathingRate + breathingPhase;
            const breathingScale = 1 + (Math.sin(breathingTime) * breathingAmplitude);
            const currentRadius = baseRadius * breathingScale;
            
            circle.attr('r', currentRadius);
          }
        });
      }
    });

    // Type 2 and Type 3 Dematerialization Logic (continuous cycling)
    if (opts.mode === 'type2' || opts.mode === 'type3') {
      // Check if balloons have stopped moving (after freeze period)
      if (elapsed > slowDownEnd) {
        // Debug: Log when we're in the dematerialization phase
        if (elapsed > slowDownEnd && !state.dematerializationPhaseStarted) {
          console.log(`${opts.mode} dematerialization phase started at ${elapsed.toFixed(0)}ms (slowDownEnd: ${slowDownEnd}ms)`);
          state.dematerializationPhaseStarted = true;
        }
        
        // Debug: Log current elapsed time every 2 seconds
        if (Math.floor(elapsed / 2000) !== Math.floor((elapsed - 16) / 2000)) {
          console.log(`${opts.mode} animation running at ${elapsed.toFixed(0)}ms`);
        }
        nodes.forEach((node, i) => {
          // Mark when this balloon stops moving (first time we enter the dematerialization phase)
          if (!node.stoppedMovingTime) {
            node.stoppedMovingTime = elapsed;
            console.log(`Balloon ${i} stopped moving at ${elapsed.toFixed(0)}ms`);
          }
          
          // Schedule dematerialization if not already scheduled and balloon hasn't been dematerialized
          if (!node.dematerializationScheduled && !node.isDematerialized && !node.isDematerializing) {
            // Random time to live between 45-90 seconds after THIS balloon stopped moving
            // Use type-specific timeToLive configuration
            const timeToLiveRange = opts.timeToLive || [45, 90];
            const timeToLive = timeToLiveRange[0] * 1000 + Math.random() * (timeToLiveRange[1] - timeToLiveRange[0]) * 1000;
            node.dematerializationTime = node.stoppedMovingTime + timeToLive;
            node.dematerializationScheduled = true;
            console.log(`Balloon ${i} scheduled for dematerialization in ${timeToLive.toFixed(0)}ms (${(timeToLive/1000).toFixed(1)}s) from when it stopped moving`);
          }
          
          // Check if it's time to start dematerialization
          if (node.dematerializationScheduled && !node.isDematerializing && !node.isDematerialized && 
              elapsed >= node.dematerializationTime) {
            console.log(`Triggering dematerialization for balloon ${i} at elapsed time ${elapsed.toFixed(0)}ms`);
            startDematerialization(state, i);
          }
        });
      }
    }

    // Don't freeze based on introDurationMs - let the zero gravity timing control the freeze
    // if (elapsed >= state.introDurationMs) {
    //   if (!state.keepDrift) {
    //     state.frozen = true;
    //   } else if (!state.microDrift) {
    //     state.microDrift = true;
    //     state.nodes.forEach(n => { n.horizontalSpeed = 0; });
    //   }
    // }

    if (!state.frozen) requestAnimationFrame(() => animateRAF(state, opts));
  }

  function type2Swirl(svg, dims, opts) {
    const enhanced = pickEnhancedColor();
    const colorPool = [...palette, enhanced];

    const yAnchor = centerOf('.inner-hero-content h1, .inner-hero-content', dims.rect).cy;

    // Widen safe band to keep clear of left text column
    const windowPct = opts.constructWindowPct || [0.14, 0.86];
    const nodes = makeNodes(opts.nodeCount, opts.layerRange, dims.width, dims.height, yAnchor, windowPct, 0.15, opts.mode, opts);
    
    // Add velocity properties and set colors based on type configuration
    nodes.forEach((n, i) => { 
      // Set color based on type-specific configuration
      if (opts.balloonColor === 'white') {
        n.color = 'white';
      } else if (opts.balloonColor === 'colored') {
        n.color = colorPool[i % colorPool.length];
      } else if (opts.balloonColor === 'transparent') {
        n.color = 'transparent';
      }
      
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
    

    if (opts.mode === 'transparent' || opts.mode === 'type2') {
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
            .duration(3600) // 5x slower than original (720 * 5)
            .attr('r', r)
            .attr('opacity', transparency);
        }
      });

      // Initialize dematerialization tracking for Type 2 (if continuous cycling is enabled)
      if (opts.continuousCycling) {
        nodes.forEach((node, i) => {
          node.dematerializationScheduled = false;
          node.dematerializationTime = null;
          node.isDematerializing = false;
          node.isDematerialized = false;
          node.stoppedMovingTime = null; // Track when this balloon stopped moving
        });
      }

      const state = {
        groups, nodes,
        width: dims.width, height: dims.height,
        introDurationMs: opts.introDurationMs,
        keepDrift: !!opts.keepDrift,
        frozen: false,
        microDrift: false,
        t0: performance.now(),
        svg: svg, // Add svg reference for dematerialization
        dims: dims, // Add dims reference for new balloon creation
        opts: opts // Add opts reference for new balloon creation
      };
      requestAnimationFrame(() => animateRAF(state, opts));
      return;
    }

    if (opts.mode === 'type3') {
      svg.selectAll('*').remove();
      
      // Type 3: Inverted transparency with solid background and bubble "holes"
      const backgroundColor = opts.backgroundColor || '#ffffff';
      const bubbleOpacity = opts.bubbleOpacity || 0.8;
      const transparencySteps = opts.transparencySteps || 5;
      
      // Create solid background rectangle
      svg.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', dims.width).attr('height', dims.height)
        .attr('fill', backgroundColor)
        .attr('opacity', 1.0);
      
      // Create SVG mask for bubble "holes"
      const defs = svg.append('defs');
      const mask = defs.append('mask').attr('id', 'type3Mask').attr('maskUnits', 'userSpaceOnUse');
      
      // White background in mask (shows the solid background)
      mask.append('rect')
        .attr('x', 0).attr('y', 0)
        .attr('width', dims.width).attr('height', dims.height)
        .attr('fill', 'white');
      
      // Black bubbles in mask (create "holes" in the background)
      const g = mask.append('g');
      const groups = nodes.map(n => g.append('g').attr('transform', `translate(${n.x}, ${n.y})`));

      console.log(`Creating ${groups.length} balloon groups for Type 3 inverted transparency mode`);
      groups.forEach((gr, idx) => {
        const d = nodes[idx];
        const materializationStart = Math.random() * 1500; // 0-1.5 seconds
        
        // Create multiple layers for each balloon
        console.log(`Creating ${d.layers} layers for Type 3 balloon ${idx} at position (${d.x.toFixed(1)}, ${d.y.toFixed(1)}) with baseSize ${d.baseSize.toFixed(1)}`);
        for (let layer = 0; layer < d.layers; layer++) {
          const norm = d.layers <= 1 ? 1 : layer / (d.layers - 1);
          // Use landing page non-linear scaling method
          const curvedGrowth = Math.pow(norm, 1.75); // Curved function with constant 1.75
          const r = Math.max(1, d.baseSize * (0.3 + curvedGrowth * 0.5)); // Curved layer sizing
          
          // Landing page construction method: biggest and smallest appear first
          const maxLayer = d.layers - 1;
          const distanceFromEdge = Math.min(layer, maxLayer - layer);
          const constructionDelay = materializationStart + (distanceFromEdge * 150); // Edge layers appear first
          
          // Inverted transparency: outer layers more opaque, inner layers more transparent
          // More overlapping bubbles = more background visible
          // Flattened curve: each layer contributes max 5% increase in transparency
          const transparency = Math.max(0.0, bubbleOpacity - (layer * 0.05)); // 5% per layer
          // Note: This creates the "swiss cheese" effect where bubbles create holes in the background
          
          console.log(`  Layer ${layer}: radius=${r.toFixed(1)}, transparency=${transparency.toFixed(2)}, delay=${constructionDelay}ms`);
          
          gr.append('circle')
            .attr('r', 0)
            .attr('fill', 'black') // Black fill in mask creates "holes"
            .attr('opacity', 0)
            .transition()
            .delay(constructionDelay)
            .duration(3600) // 5x slower than original (720 * 5)
            .attr('r', r)
            .attr('opacity', transparency);
        }
      });

      // Apply mask to background rectangle
      svg.select('rect').attr('mask', 'url(#type3Mask)');

      // Initialize dematerialization tracking for Type 3
      nodes.forEach((node, i) => {
        node.dematerializationScheduled = false;
        node.dematerializationTime = null;
        node.isDematerializing = false;
        node.isDematerialized = false;
        node.stoppedMovingTime = null; // Track when this balloon stopped moving
      });

      const state = {
        groups, nodes,
        width: dims.width, height: dims.height,
        introDurationMs: opts.introDurationMs,
        keepDrift: !!opts.keepDrift,
        frozen: false,
        microDrift: false,
        t0: performance.now(),
        svg: svg, // Add svg reference for dematerialization
        dims: dims, // Add dims reference for new balloon creation
        opts: opts // Add opts reference for new balloon creation
      };
      requestAnimationFrame(() => animateRAF(state, opts));
      return;
    }


    // White type2
    nodes.forEach((n, i) => { n.color = 'white'; });
    const g = svg.append('g');
    const groups = nodes.map(n => g.append('g').attr('transform', `translate(${n.x}, ${n.y})`));

    const opacityFn = (layer, total) => clamp(0.24 + (0.48 - 0.08 * layer), 0.16, 0.64); // 20% more transparent (0.3*0.8=0.24, 0.6*0.8=0.48, 0.1*0.8=0.08, 0.2*0.8=0.16, 0.8*0.8=0.64)
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
    requestAnimationFrame(() => animateRAF(state, opts));
  }

  function type1Cluster(svg, dims, opts) {
    // Use identical Type 2 behavior for Type 1
    return type2Swirl(svg, dims, opts);
  }

  function startDematerialization(state, balloonIndex) {
    const node = state.nodes[balloonIndex];
    const group = state.groups[balloonIndex];
    
    console.log(`Starting dematerialization for balloon ${balloonIndex} and creating replacement simultaneously`);
    node.isDematerializing = true;
    node.dematerializationStartTime = performance.now();
    
    // IMMEDIATELY create new balloon (simultaneous with dematerialization start)
    createNewBalloon(state, balloonIndex);
    
    // Get all circles in this balloon group
    const circles = group.selectAll('circle');
    const circleNodes = circles.nodes();
    
    console.log(`Dematerializing ${circleNodes.length} circles for balloon ${balloonIndex}`);
    
    // Let each layer complete its own dematerialization
    // The last layer to finish will trigger the completion
    let completedLayers = 0;
    const totalLayers = circleNodes.length;
    
    // Dematerialize each layer by fading opacity from center outwards
    circles.each(function(d, i) {
      const circle = d3.select(this);
      const layer = i; // Use index as layer since data binding isn't working
      
      // Calculate dematerialization delay (center outwards)
      const maxLayer = circleNodes.length - 1;
      const distanceFromCenter = Math.abs(layer - maxLayer / 2); // Distance from center
      const dematerializationDelay = distanceFromCenter * 200; // Center starts first, edges last
      
      console.log(`  Circle ${i}: layer=${layer}, distanceFromCenter=${distanceFromCenter.toFixed(1)}, delay=${dematerializationDelay}ms`);
      
      // Dematerialize by fading opacity only (no size change)
      circle.transition()
        .delay(dematerializationDelay)
        .duration(21600) // 6x slower than materialization (3600 * 6)
        .attr('opacity', 0) // Only fade opacity, keep radius unchanged
        .on('end', function() {
          completedLayers++;
          console.log(`Layer ${layer} dematerialized (${completedLayers}/${totalLayers})`);
          if (completedLayers === totalLayers) {
            completeDematerialization(state, balloonIndex);
          }
        });
    });
  }
  
  function completeDematerialization(state, balloonIndex) {
    const node = state.nodes[balloonIndex];
    console.log(`Balloon ${balloonIndex} fully dematerialized (replacement already created)`);
    
    node.isDematerialized = true;
    node.isDematerializing = false;
    
    // No need to create new balloon - it was already created in startDematerialization
  }
  
  function createNewBalloon(state, balloonIndex) {
    const { svg, dims, opts, nodes, groups } = state;
    const oldNode = nodes[balloonIndex];
    
    console.log(`Creating new balloon ${balloonIndex} to replace dematerialized balloon`);
    
    // Helper function to find best spawn position for new balloon (anti-clustering)
    function findBestNewBalloonPosition(existingNodes, width, topBoundary, constructWindowPct) {
      const leftBound = constructWindowPct[0]; // Use configuration
      const rightBound = constructWindowPct[1]; // Use configuration
      
      let bestX = 0;
      let maxMinDistance = 0;
      
      // Try multiple random positions and pick the one with maximum minimum distance
      for (let attempt = 0; attempt < 15; attempt++) { // More attempts for new balloons
        const candidateX = (Math.random() * (rightBound - leftBound) + leftBound) * width;
        
        // Calculate minimum distance to any existing balloon
        let minDistToExisting = Infinity;
        for (const existingNode of existingNodes) {
          if (existingNode && !existingNode.isDematerialized) { // Only consider active balloons
            const dx = candidateX - existingNode.x;
            const dy = topBoundary - existingNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            minDistToExisting = Math.min(minDistToExisting, distance);
          }
        }
        
        // If this is the best position so far, keep it
        if (minDistToExisting > maxMinDistance) {
          maxMinDistance = minDistToExisting;
          bestX = candidateX;
        }
      }
      
      return bestX;
    }
    
    // Create new balloon that spawns at top and falls down
    const topBoundary = 60; // Navigation bar height
    const bestX = findBestNewBalloonPosition(nodes, dims.width, topBoundary, opts.constructWindowPct);
    
    try {
      // Create balloon with anti-clustering positioning
      const newNodes = makeNodes(1, opts.layerRange, dims.width, dims.height, topBoundary, opts.constructWindowPct, 0.15, opts.mode, opts);
      const newNode = newNodes[0];
      
      // Override the X position with our anti-clustered position
      if (newNode) {
        newNode.x = bestX;
        newNode.originalX = bestX;
      }
      
      if (!newNode) {
        console.error(`Failed to create new balloon ${balloonIndex}: makeNodes returned empty array`);
        return;
      }
    
      // Copy properties from old node
      newNode.dematerializationScheduled = false;
      newNode.dematerializationTime = null;
      newNode.isDematerializing = false;
      newNode.isDematerialized = false;
      newNode.stoppedMovingTime = null; // Reset for new balloon
      
      // Add velocity properties for falling balloons (new balloons fall down)
      const minFallSpeed = 0.5 * 1.3 * 1.3; // Increased by 30% (0.5 * 1.3 * 1.3 = 0.845)
      const maxFallSpeed = 2.0 * 1.3 * 1.3; // Increased by 30% (2.0 * 1.3 * 1.3 = 3.38)
      const fallSpeed = Math.random() * (maxFallSpeed - minFallSpeed) + minFallSpeed;
      
      // Small horizontal drift
      const horizontalDrift = (Math.random() - 0.5) * 0.5; // -0.25 to 0.25
      
      newNode.vx = horizontalDrift; // Small horizontal movement
      newNode.vy = fallSpeed; // Downward fall speed (increased by 30%)
      newNode.velocity = fallSpeed;
      newNode.angle = Math.PI / 2; // Downward direction
      newNode.gravityFactor = newNode.baseSize / 50; // Gravity factor proportional to radius
      
      console.log(`New balloon ${balloonIndex} velocity: vx=${newNode.vx.toFixed(2)}, vy=${newNode.vy.toFixed(2)}, gravityFactor=${newNode.gravityFactor.toFixed(2)}`);
      
      // Replace the old node
      nodes[balloonIndex] = newNode;
      
      // Create new group for the new balloon
      const mask = svg.select('#type3Mask g');
      if (mask.empty()) {
        console.error(`Failed to find Type 3 mask for new balloon ${balloonIndex}`);
        return;
      }
      
      const newGroup = mask.append('g').attr('transform', `translate(${newNode.x}, ${newNode.y})`);
      groups[balloonIndex] = newGroup;
    
      // Materialize the new balloon
      const materializationStart = Math.random() * 1500; // 0-1.5 seconds
      const bubbleOpacity = opts.bubbleOpacity || 0.8;
      
      console.log(`Creating new balloon ${balloonIndex} at position (${newNode.x.toFixed(1)}, ${newNode.y.toFixed(1)})`);
      
      for (let layer = 0; layer < newNode.layers; layer++) {
        const norm = newNode.layers <= 1 ? 1 : layer / (newNode.layers - 1);
        const curvedGrowth = Math.pow(norm, 1.75);
        const r = Math.max(1, newNode.baseSize * (0.3 + curvedGrowth * 0.5));
        
        const maxLayer = newNode.layers - 1;
        const distanceFromEdge = Math.min(layer, maxLayer - layer);
        const constructionDelay = materializationStart + (distanceFromEdge * 150);
        
        const transparency = Math.max(0.0, bubbleOpacity - (layer * 0.05));
        
        newGroup.append('circle')
          .attr('r', 0)
          .attr('fill', 'black')
          .attr('opacity', 0)
          .transition()
          .delay(constructionDelay)
          .duration(3600) // 5x slower than original (720 * 5)
          .attr('r', r)
          .attr('opacity', transparency);
      }
      
      console.log(`New balloon ${balloonIndex} created and materializing`);
      
    } catch (error) {
      console.error(`Error creating new balloon ${balloonIndex}:`, error);
    }
  }

  // Type-specific configuration functions - each type has completely independent settings
  function getType1Config(options) {
    return Object.assign({
      containerSelector: '.inner-balloons',
      svgId: 'inner-balloons-svg',
      mode: 'type1',
      nodeCount: 11, // Increased by 3 balloons
      layerRange: [8, 20],
      curvedExponent: 1.75,
      introDurationMs: 6000,
      constructWindowPct: [0.14, 0.86],
      transparency: [0.12, 0.35],
      keepDrift: false,
      backgroundImageUrl: undefined,
      primaryHue: 'auto',
      clusterSize: 7,
      // Type 1 specific: colored balloons with sea-to-sunset palette
      balloonColor: 'colored',
      breathingEnabled: false,
      sizeMultiplier: 0.8, // 20% smaller max size
      minSizeMultiplier: 0.48 // 40% smaller min size
    }, options || {});
  }

  function getType2Config(options) {
    return Object.assign({
      containerSelector: '.inner-balloons',
      svgId: 'inner-balloons-svg',
      mode: 'type2',
      nodeCount: 11, // Increased by 3 balloons
      layerRange: [8, 20],
      curvedExponent: 1.75,
      introDurationMs: 6000,
      constructWindowPct: [0.14, 0.86],
      transparency: [0.084, 0.245], // 30% more transparent (0.12*0.7=0.084, 0.35*0.7=0.245)
      keepDrift: false,
      backgroundImageUrl: undefined,
      primaryHue: 'auto',
      clusterSize: 7,
      // Type 2 specific: white transparent balloons
      balloonColor: 'white',
      breathingEnabled: false,
      sizeMultiplier: 1.04, // 30% larger max size (0.8 * 1.3 = 1.04)
      minSizeMultiplier: 0.336, // 30% smaller min size (0.48 * 0.7 = 0.336)
      // Type 3 lifecycle characteristics added to Type 2:
      continuousCycling: true,
      timeToLive: [45, 90]
    }, options || {});
  }

  function getType3Config(options) {
    return Object.assign({
      containerSelector: '.inner-balloons',
      svgId: 'inner-balloons-svg',
      mode: 'type3',
      nodeCount: 5, // 5 balloons
      layerRange: [14, 24], // More layers for transparency effect
      curvedExponent: 1.75,
      introDurationMs: 6000,
      constructWindowPct: [0.5, 0.95], // Right portion only
      transparency: [0.12, 0.35],
      keepDrift: false,
      backgroundImageUrl: undefined,
      primaryHue: 'auto',
      clusterSize: 7,
      // Type 3 specific: inverted transparency with continuous cycling
      backgroundColor: '#ffffff',
      bubbleOpacity: 0.8,
      transparencySteps: 5,
      blendMode: 'multiply',
      balloonColor: 'transparent',
      breathingEnabled: true,
      sizeMultiplier: 1.0, // Original size
      minSizeMultiplier: 0.8, // Original min size
      continuousCycling: true,
      timeToLive: [45, 90],
      repulsiveForce: 0.125 // 25% stronger repulsive force
    }, options || {});
  }


  function initInnerBalloons(options) {
    // Get type-specific configuration
    const mode = options?.mode || 'type2';
    let opts;
    
    switch(mode) {
      case 'type1':
        opts = getType1Config(options);
        break;
      case 'type2':
        opts = getType2Config(options);
        break;
      case 'type3':
        opts = getType3Config(options);
        break;
      default:
        opts = getType2Config(options);
    }

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

    // Route to appropriate animation function based on mode
    if (opts.mode === 'type1') {
      type1Cluster(svg, dims, opts);
    } else if (opts.mode === 'type3') {
      type2Swirl(svg, dims, opts); // Type 3 implementation is inside type2Swirl
    } else {
      type2Swirl(svg, dims, opts); // Default to type2Swirl for type2 and others
    }

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
