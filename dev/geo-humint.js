// dev-only: HUMINT geospatial visualization over a D3 tile map (OSM)
// Depends on global d3 (include d3.v7). Standalone under dev/ only.

export function initGeoHumint(options = {}) {
  const opts = Object.assign({
    svgId: 'geo-svg',
    containerSelector: '.geo-canvas',
    // Web Mercator center (lon/lat) and zoom
    center: { lon: 30.5238, lat: 50.4501 }, // Kyiv default
    zoom: 12,
    // Spawn controls: rolling 4s, 1..5 per window
    spawnIntervalMs: 4000,
    minPerWindow: 1,
    maxPerWindow: 5,
    // Serial sizes (scaled by certainty)
    minSerialRadius: 14,
    maxSerialRadius: 48,
    // Sides
    sideColors: { enemy: '#e53935', friendly: '#1e88e5', neutral: '#43a047' },
    // Pulse period for links
    pulsePeriodMs: 1800
  }, options);

  const container = d3.select(opts.containerSelector);
  const svg = d3.select(`#${opts.svgId}`);
  if (container.empty() || svg.empty()) {
    console.error('geo-humint: container or svg not found', opts);
    return { pause(){}, resume(){}, destroy(){} };
  }

  let width = container.node().clientWidth || window.innerWidth;
  let height = container.node().clientHeight || window.innerHeight;
  svg.attr('width', width).attr('height', height);

  // Root layers
  const root = svg.append('g');
  const tileLayer = root.append('g');
  const serialLayer = root.append('g');
  const linkLayer = root.append('g');
  const pinLayer = root.append('g');
  const vehicleLayer = root.append('g');
  const defs = svg.append('defs');

  // Helpers
  const tileSize = 256;
  const z2 = () => Math.pow(2, opts.zoom);
  function lonToX(lon, z){ return (lon + 180) / 360 * tileSize * Math.pow(2, z); }
  function latToY(lat, z){
    const rad = lat * Math.PI / 180;
    const n = Math.log(Math.tan(Math.PI/4 + rad/2));
    return (1 - n/Math.PI) / 2 * tileSize * Math.pow(2, z);
  }
  function xToLon(x, z){ return x / (tileSize * Math.pow(2, z)) * 360 - 180; }
  function yToLat(y, z){
    const n = Math.PI - 2 * Math.PI * y / (tileSize * Math.pow(2, z));
    return (180/Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  let centerPxX = lonToX(opts.center.lon, opts.zoom);
  let centerPxY = latToY(opts.center.lat, opts.zoom);

  function project(lon, lat){
    const px = lonToX(lon, opts.zoom);
    const py = latToY(lat, opts.zoom);
    const topLeftX = centerPxX - width/2;
    const topLeftY = centerPxY - height/2;
    return [px - topLeftX, py - topLeftY];
  }

  function refreshTiles(){
    const topLeftX = centerPxX - width/2;
    const topLeftY = centerPxY - height/2;
    const x0 = Math.floor(topLeftX / tileSize);
    const y0 = Math.floor(topLeftY / tileSize);
    const x1 = Math.floor((centerPxX + width/2) / tileSize);
    const y1 = Math.floor((centerPxY + height/2) / tileSize);
    const tiles = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) tiles.push({ x, y, z: opts.zoom, key: `${opts.zoom}/${x}/${y}` });
    const sel = tileLayer.selectAll('image.osm').data(tiles, d => d.key);
    sel.enter().append('image').attr('class', 'osm')
      .attr('width', tileSize).attr('height', tileSize)
      .style('filter', 'grayscale(100%) brightness(0.85)')
      .attr('href', d => `https://a.tile.openstreetmap.org/${d.z}/${d.x}/${d.y}.png`)
      .merge(sel)
      .attr('x', d => d.x * tileSize - topLeftX)
      .attr('y', d => d.y * tileSize - topLeftY);
    sel.exit().remove();
  }
  refreshTiles();

  // Data state
  const serials = [];
  const pins = [];
  const vehicles = [];

  function rand(min, max){ return Math.random() * (max - min) + min; }
  function choice(a){ return a[Math.floor(Math.random()*a.length)]; }
  function colorForSide(side){ return side === 'enemy' ? opts.sideColors.enemy : side === 'friendly' ? opts.sideColors.friendly : opts.sideColors.neutral; }

  // Build layered serial (opaque center → transparent edge)
  function buildSerialLayers(g, serial){
    const layers = Math.floor(rand(5,9));
    const baseR = serial.radius;
    for (let i = 0; i < layers; i++){
      const norm = i/(layers-1);
      const curved = Math.pow(norm, 1.6);
      const r = Math.max(1, baseR * (0.35 + curved * 0.65));
      const gradId = `geo-serial-${serial.id}-${i}`;
      const grad = defs.append('radialGradient').attr('id', gradId).attr('cx','50%').attr('cy','50%').attr('r','50%');
      const centerA = 0.6, edgeA = 0.06;
      grad.append('stop').attr('offset','0%').attr('stop-color', serial.color).attr('stop-opacity', centerA);
      grad.append('stop').attr('offset','70%').attr('stop-color', serial.color).attr('stop-opacity', centerA*0.35);
      grad.append('stop').attr('offset','100%').attr('stop-color', serial.color).attr('stop-opacity', edgeA);
      g.append('circle')
        .attr('r', r)
        .attr('fill', `url(#${gradId})`)
        .attr('opacity', 1);
    }
  }

  let nextId = 1;
  // --- Vehicle simulation ----------------------------------------------------
  const YELLOW = '#FFD700';
  const VEHICLE_SPEED_PX_PER_SEC = 60; // considered pace
  const VEHICLE_COUNT = Math.max(1, Math.min(10, Math.floor(rand(1, 11))));

  function pxToLonLat(px, py){
    const topLeftX = centerPxX - width/2;
    const topLeftY = centerPxY - height/2;
    const lon = xToLon(topLeftX + px, opts.zoom);
    const lat = yToLat(topLeftY + py, opts.zoom);
    return { lon, lat };
  }

  function makePath(orientation){
    // Build a monotonic polyline across the viewport with subtle jitter
    const segments = 8;
    const margin = 40;
    const pts = [];
    if (orientation === 'E2W'){
      let x = width + margin; const endX = -margin; let y = rand(margin, height - margin);
      const stepX = (x - endX) / segments;
      for (let i=0;i<=segments;i++){
        const px = x - i * stepX;
        y = Math.max(margin, Math.min(height - margin, y + rand(-40, 40)));
        pts.push({ px, py: y });
      }
    } else { // S2N
      let y = height + margin; const endY = -margin; let x = rand(margin, width - margin);
      const stepY = (y - endY) / segments;
      for (let i=0;i<=segments;i++){
        const py = y - i * stepY;
        x = Math.max(margin, Math.min(width - margin, x + rand(-40, 40)));
        pts.push({ px: x, py });
      }
    }
    // Convert to lon/lat and compute segment lengths in px-space
    const lonlat = pts.map(p => pxToLonLat(p.px, p.py));
    const lens = []; let total = 0;
    for (let i=0;i<pts.length-1;i++){
      const dx = pts[i+1].px - pts[i].px; const dy = pts[i+1].py - pts[i].py;
      const len = Math.hypot(dx, dy); lens.push(len); total += len;
    }
    return { pts, lonlat, lens, total };
  }

  function spawnVehicle(){
    const orientation = Math.random() < 0.5 ? 'E2W' : 'S2N';
    const path = makePath(orientation);
    const v = {
      id: nextId++, orientation, path, dist: 0,
      lon: path.lonlat[0].lon, lat: path.lonlat[0].lat,
      color: '#000000', permanentColor: null,
      seen: { enemy: new Set(), friendly: new Set(), neutral: new Set() }
    };
    vehicles.push(v);
  }

  for (let i=0;i<VEHICLE_COUNT;i++) spawnVehicle();

  function advanceVehicle(v, dt){
    v.dist += VEHICLE_SPEED_PX_PER_SEC * dt;
    if (v.dist >= v.path.total){
      // recycle vehicle with fresh path and reset state
      const idx = vehicles.indexOf(v);
      if (idx >= 0) vehicles.splice(idx, 1);
      spawnVehicle();
      return;
    }
    // find segment and interpolate
    let d = v.dist; let seg = 0;
    while (seg < v.path.lens.length && d > v.path.lens[seg]){ d -= v.path.lens[seg]; seg++; }
    const a = v.path.lonlat[seg]; const b = v.path.lonlat[seg+1];
    const t = Math.max(0, Math.min(1, d / (v.path.lens[seg] || 1)));
    v.lon = a.lon + (b.lon - a.lon) * t;
    v.lat = a.lat + (b.lat - a.lat) * t;
  }

  function evaluateVehicleColor(v){
    if (v.permanentColor) { v.color = v.permanentColor; return; }
    // collisions this frame
    const collidingColors = new Set();
    const vx = project(v.lon, v.lat)[0];
    const vy = project(v.lon, v.lat)[1];
    serials.forEach(s => {
      const p = project(s.lon, s.lat);
      const dist = Math.hypot(vx - p[0], vy - p[1]);
      if (dist <= s.radius) {
        collidingColors.add(s.side);
        const set = v.seen[s.side];
        if (!set.has(s.id)) set.add(s.id);
      }
    });
    // permanence check
    for (const k of ['enemy','friendly','neutral']){
      if (v.seen[k].size >= 3) { v.permanentColor = colorForSide(k); v.color = v.permanentColor; return; }
    }
    // if colliding with multiple colors → yellow
    if (collidingColors.size >= 2) { v.color = YELLOW; return; }
    // two independent of same color → that color; single → yellow; none → black
    let twoColor = null;
    for (const k of ['enemy','friendly','neutral']) if (v.seen[k].size >= 2) { twoColor = k; break; }
    if (twoColor) { v.color = colorForSide(twoColor); return; }
    if (collidingColors.size >= 1) { v.color = YELLOW; return; }
    v.color = '#000000';
  }

  function renderVehicles(){
    const data = vehicles.map(v => ({ v, p: project(v.lon, v.lat) }));
    const g = vehicleLayer.selectAll('g.vehicle').data(data, d => d.v.id);
    const gEnter = g.enter().append('g').attr('class','vehicle');
    // simple NATO-like arrow (line + head)
    gEnter.append('path').attr('class','chassis').attr('fill','none').attr('stroke-width',2);
    gEnter.append('path').attr('class','head').attr('fill','none').attr('stroke-width',2);
    g.merge(gEnter)
      .attr('transform', d => `translate(${d.p[0]},${d.p[1]})`)
      .each(function(d){
        const node = d3.select(this);
        node.select('path.chassis').attr('stroke', d.v.color).attr('d', 'M -10 0 L 10 0');
        node.select('path.head').attr('stroke', d.v.color).attr('d', 'M 6 -4 L 10 0 L 6 4');
      });
    g.exit().remove();
  }
  function spawnWindow(){
    const count = Math.floor(rand(opts.minPerWindow, opts.maxPerWindow + 1));
    for (let i = 0; i < count; i++){
      const side = choice(['enemy','friendly','neutral']);
      const color = colorForSide(side);
      const certainty = Math.random();
      const radius = opts.minSerialRadius + certainty * (opts.maxSerialRadius - opts.minSerialRadius);
      // Choose a random vehicle and spawn near its current position
      if (vehicles.length === 0) break;
      const v = vehicles[Math.floor(Math.random()*vehicles.length)];
      const vp = project(v.lon, v.lat);
      const pinPxX = vp[0] + rand(-30, 30);
      const pinPxY = vp[1] + rand(-30, 30);
      const serialPxX = vp[0] + rand(-40, 40);
      const serialPxY = vp[1] + rand(-40, 40);
      const pinLon = xToLon((centerPxX - width/2) + pinPxX, opts.zoom);
      const pinLat = yToLat((centerPxY - height/2) + pinPxY, opts.zoom);
      const serialLon = xToLon((centerPxX - width/2) + serialPxX, opts.zoom);
      const serialLat = yToLat((centerPxY - height/2) + serialPxY, opts.zoom);
      const pin = { id: nextId++, lon: pinLon, lat: pinLat, color, side };
      const serial = { id: nextId++, lon: serialLon, lat: serialLat, radius, color, side };
      pins.push(pin); serials.push(serial);
    }
    mergeSerials();
    render();
  }

  function mergeSerials(){
    const by = { enemy: [], friendly: [], neutral: [] };
    serials.forEach(s => by[s.side].push(s));
    function mergeList(list){
      for (let i=0;i<list.length;i++){
        for (let j=i+1;j<list.length;j++){
          const a = list[i], b = list[j];
          const pa = project(a.lon, a.lat), pb = project(b.lon, b.lat);
          const dist = Math.hypot(pa[0]-pb[0], pa[1]-pb[1]);
          if (dist < (a.radius + b.radius) * 0.9){
            const lon = (a.lon + b.lon)/2, lat = (a.lat + b.lat)/2;
            const r = Math.sqrt(a.radius*a.radius + b.radius*b.radius);
            list[i] = { id: a.id, lon, lat, radius: r, color: a.color, side: a.side };
            list.splice(j,1); j--;
          }
        }
      }
      return list;
    }
    const merged = [...mergeList(by.enemy), ...mergeList(by.friendly), ...mergeList(by.neutral)];
    serials.length = 0; merged.forEach(s => serials.push(s));
  }

  function render(){
    refreshTiles();
    // Serials
    const s = serialLayer.selectAll('g.serial').data(serials, d=>d.id);
    const sEnter = s.enter().append('g').attr('class','serial')
      .attr('transform', d => { const p = project(d.lon, d.lat); return `translate(${p[0]},${p[1]})`; });
    sEnter.each(function(d){ buildSerialLayers(d3.select(this), d); });
    s.merge(sEnter).transition().duration(800)
      .attr('transform', d => { const p = project(d.lon, d.lat); return `translate(${p[0]},${p[1]})`; });
    s.exit().remove();

    // Pins
    const p = pinLayer.selectAll('circle.pin').data(pins, d=>d.id);
    p.enter().append('circle').attr('class','pin')
      .attr('r', 3.5).attr('fill', '#111').attr('stroke-width', 1.5)
      .attr('stroke', d=>d.color)
      .attr('cx', d => project(d.lon,d.lat)[0])
      .attr('cy', d => project(d.lon,d.lat)[1])
      .attr('opacity', 0).transition().duration(500).attr('opacity', 1);
    p.merge(p).transition().duration(800)
      .attr('cx', d => project(d.lon,d.lat)[0])
      .attr('cy', d => project(d.lon,d.lat)[1]);
    p.exit().transition().duration(400).attr('opacity',0).remove();

    // Links pin→nearest serial same side
    const links = [];
    pins.forEach(pin => {
      let best=null, bestDist=Infinity;
      serials.forEach(s => { if (s.side!==pin.side) return; const a=project(pin.lon,pin.lat), b=project(s.lon,s.lat); const d=Math.hypot(a[0]-b[0], a[1]-b[1]); if (d<bestDist){best=s;bestDist=d;} });
      if (best){ const a=project(pin.lon,pin.lat), b=project(best.lon,best.lat); links.push({ id:`${pin.id}-${best.id}`, x1:a[0], y1:a[1], x2:b[0], y2:b[1], color: pin.color }); }
    });
    const l = linkLayer.selectAll('line.link').data(links, d=>d.id);
    l.enter().append('line').attr('class','link')
      .attr('stroke-width', 1).attr('stroke', d=>d.color)
      .attr('x1', d=>d.x1).attr('y1', d=>d.y1).attr('x2', d=>d.x2).attr('y2', d=>d.y2)
      .attr('opacity', 0.25).transition().duration(300).attr('opacity', 0.8);
    l.merge(l).transition().duration(800)
      .attr('x1', d=>d.x1).attr('y1', d=>d.y1).attr('x2', d=>d.x2).attr('y2', d=>d.y2);
    l.exit().transition().duration(300).attr('opacity',0).remove();
  }

  // Pulse links
  const pulseStart = performance.now();
  let rafId = 0; let lastNow = 0;
  function animatePulse(now){
    const dt = lastNow ? (now - lastNow) / 1000 : 0; lastNow = now;
    // update vehicles
    vehicles.forEach(v => { advanceVehicle(v, dt); evaluateVehicleColor(v); });
    renderVehicles();
    // pulse links
    const phase = ((now - pulseStart) % opts.pulsePeriodMs) / opts.pulsePeriodMs;
    const alpha = 0.35 + Math.sin(phase * Math.PI * 2) * 0.35;
    linkLayer.selectAll('line.link').attr('opacity', 0.3 + alpha);
    rafId = requestAnimationFrame(animatePulse);
  }

  function onResize(){
    width = container.node().clientWidth || window.innerWidth;
    height = container.node().clientHeight || window.innerHeight;
    svg.attr('width', width).attr('height', height);
    render();
  }
  window.addEventListener('resize', onResize);

  const spawnTimer = setInterval(spawnWindow, opts.spawnIntervalMs);
  spawnWindow();
  rafId = requestAnimationFrame(animatePulse);

  return {
    pause(){ if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } },
    resume(){ if (!rafId) rafId = requestAnimationFrame(animatePulse); },
    destroy(){
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      clearInterval(spawnTimer);
      window.removeEventListener('resize', onResize);
      root.selectAll('*').remove();
    }
  };
}


