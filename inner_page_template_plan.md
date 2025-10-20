# Inner Page Template Plan

Purpose: Define a reusable template for all non-landing pages with consistent structure, styling, and a header balloon animation that matches the landing page’s behavior and visuals.

## Page Layout (top → bottom)
1. Global Nav Bar (reuse current landing nav)
2. Header Section (hero-style) with balloon layer behind header text/content
3. Section 2 (Blue exemplar block)
4. Global Footer (new simple footer component)

## 1) Global Nav Bar
- Reuse existing nav HTML/CSS from `index.html` (right-justified links, no logo).
- Link labels: Sectors | Capabilities | Platform | Contact | Social.
- Keep fixed header, thin light-grey bottom border.

Implementation:
- Extract nav markup into a partial snippet (for now, copy/paste into each inner page; later we can DRY with a build step if desired).

## 2) Header Section with Balloons (Hero-Style)
Header composition:
- Wrapper: `<section class="inner-hero">` (relative container)
- Animation layer: `<div class="inner-balloons"><svg id="inner-balloons-svg"></svg></div>`
- Content layer (above balloons): `<div class="inner-hero-content">` containing `<h1>`, optional `<p>`, optional CTA

Z-indexing & positioning:
- `.inner-hero { position: relative; overflow: hidden; }`
- `.inner-balloons { position: absolute; inset: 0; z-index: 5; pointer-events: none; }`
- `.inner-hero-content { position: relative; z-index: 10; }`

Sizing:
- Height: `min(60vh, 680px)`; responsive padding `clamp(1.5rem, 5vw, 4rem)` left/right (match landing page padding logic).

Typography (inherit landing style):
- Title uses the same family as landing hero system: `Arial`, weight 300 by default; size via `clamp()` to suit inner page (e.g., `clamp(2.2rem, 6vw, 4rem)`).

### Balloon Animation – Current Type 1 & Type 2 Lifecycle
Both Type 1 and Type 2 now use identical balloon construction and behavior, featuring orbital mechanics with a single large gravitational body below the center.

Authoritative parameters (current implementation):
- Nodes (balloons): 20-30 total (90% reduction from original 400-600)
- Layers per balloon: 8-20 (2x increase in max internal circle layers)
- Balloon size: 47-141 radius (2x max size with 2x range for variance)
- Curved growth exponent: 1.75 (non-linear scaling for internal layers)
- Construction pattern: outermost + innermost first, then pairs inward/outward
- Construction duration per layer: 720ms; per-layer delay to realize pairing
- Materialization window: 0-1.5 seconds for all balloons
- Orbital mechanics: Single gravitational body at center bottom (20% below visible area)
- Gravity strength: 1.0 (very high gravity for strong attraction)
- Gravity factor: Proportional to balloon radius (larger balloons more affected)
- Unique velocity: Each balloon gets 0.5-3.5 random velocity with random direction
- Combined motion: 70% orbital motion + 30% random trajectory
- Repulsive forces: Continuous repulsive force between balloons (0.02 strength)
- Collision physics: Boundary bouncing and collision bouncing with 20% momentum loss
- Zero gravity phase: 0-3 seconds, then slow down over 2 seconds
- Color palette: Sea-to-sunset gradient; one randomly enhanced color per load
- Anchor vertically to header text center (compute via `getBoundingClientRect()`)
- Sizing SVG to container: size from `.inner-balloons` bounds, not window

Animation timeline (current implementation):
1. 0-1.5s: Materialize balloons with orbital velocity and unique trajectories
2. 0-3s: Zero gravity phase with full movement (orbital + random + repulsive forces)
3. 3-5s: Gradual slowdown to 10% of original speed
4. ≥5s: Freeze—maintain very slow movement or stop completely

Transparency modes (Type 1, Type 2, and Type 3):
- `mode: "colored"` → normal sea-to-sunset palette with 20-80% opacity range
- `mode: "transparent"` → white fill with 10-80% opacity range (increasing transparency from outer to inner layers)
- `mode: "type3"` → inverted transparency with solid background color and bubble "holes"
- Type 1 & 2: Light grey stroke for visibility of circle boundaries
- Type 1 & 2: Multiple concentric circles with decreasing opacity (union effect)
- Type 3: Bubbles create progressively transparent "holes" in solid background
- Optional: accept a `backgroundImageUrl` style on `.inner-hero` with `background-size: cover; background-position: center;`

### Type 3 Construction Plan (Inverted Transparency)
Type 3 creates bubbles of translucency→transparency in a solid background color, where overlapping bubbles become MORE transparent (not less).

**Core Concept:**
- **Solid background layer**: Completely opaque base color (e.g., white, blue, brand color)
- **Bubble "holes"**: Bubbles act as "erasers" that remove opacity from the background
- **Inverted transparency**: More overlapping bubbles = more background color visible
- **Total transparency**: Achieved at 5th internal bubble (0% opacity)

**Implementation Method:**
1. **Background rectangle**: Solid color fill (100% opacity) covering entire area
2. **Bubble mask system**: Bubbles subtract opacity from the background using SVG masks or blend modes
3. **Inverted opacity calculation**: 
   - Single bubble: 80% opacity (20% background visible)
   - 2 overlapping bubbles: 60% opacity (40% background visible)
   - 3 overlapping bubbles: 40% opacity (60% background visible)
   - 4 overlapping bubbles: 20% opacity (80% background visible)
   - 5+ overlapping bubbles: 0% opacity (100% background visible)
4. **Progressive transparency**: Each additional layer reduces bubble opacity, revealing more background

**Visual Effect:**
- **Base layer**: Solid colored "wall"
- **Bubble layer**: Creates progressively larger "windows" in the wall
- **Overlap areas**: Become "holes" showing pure background color
- **Result**: Areas with many overlapping bubbles become transparent windows

**Technical Implementation:**
- **SVG mask approach**: Use `mask` with white background and black bubbles
- **Blend mode approach**: Use `mix-blend-mode: multiply` or custom opacity stacking
- **Opacity stacking**: Calculate cumulative transparency based on overlap count
- **Background color**: Configurable via `backgroundColor` option

**Configuration Options:**
```js
{
  mode: 'type3',
  backgroundColor: '#ffffff',        // Solid background color
  bubbleOpacity: 0.8,               // Starting opacity for single bubbles
  transparencySteps: 5,             // Number of steps to total transparency
  blendMode: 'multiply'             // SVG blend mode for opacity calculation
}
```

Public API (config object in `initInnerBalloons(options)`):
```js
{
  containerSelector: '.inner-balloons',
  svgId: 'inner-balloons-svg',
  nodeCount: 20-30,              // Random count between 20-30 balloons
  layerRange: [8,20],            // 2x increase in max internal circle layers
  curvedExponent: 1.75,          // Non-linear scaling for internal layers
  introDurationMs: 6000,         // Total time before freeze (6 seconds)
  constructWindowPct: [0.14,0.86], // Construction window (right half)
  mode: 'type1' | 'type2' | 'transparent' | 'type3', // Type 1&2 identical, Type 3 inverted transparency
  backgroundImageUrl: undefined,  // Set on .inner-hero when provided
  keepDrift: false,              // Whether to continue movement after freeze
  gravityStrength: 1.0,          // Very high gravity for orbital mechanics
  repulsiveForce: 0.02,          // Continuous repulsive force between balloons
  collisionMomentumLoss: 0.2,    // 20% momentum loss on collisions
  zeroGravityEnd: 3000,          // End of zero gravity phase (3 seconds)
  slowDownDuration: 2000,        // Slowdown duration (2 seconds)
  // Type 3 specific options:
  backgroundColor: '#ffffff',     // Solid background color for Type 3
  bubbleOpacity: 0.8,            // Starting opacity for single bubbles
  transparencySteps: 5,          // Number of steps to total transparency
  blendMode: 'multiply'          // SVG blend mode for opacity calculation
}
```

Accessibility:
- Balloons are decorative; mark SVG as aria-hidden: `role="img" aria-hidden="true" focusable="false"`.

## 3) Blue Section / Section 2 Block
- Wrapper: `<section class="blue-section">`
- Background: brand blue (#0E5AA7 or to-be-confirmed), white text by default
- Content grid: responsive, typically two columns on desktop, single column on mobile
- Provide a reusable `.content-row` and `.content-col` pattern

## 4) Global Footer
- Simple footer with small text; can reuse the disclaimer patterns or a condensed version
- Provide slots for legal links and minimal sitemap if needed

## CSS Summary (new classes)
- `.inner-hero`, `.inner-balloons`, `#inner-balloons-svg`, `.inner-hero-content`
- `.blue-section`, `.content-row`, `.content-col`
- `.footer` (future)

## JS Summary
- Function `initInnerBalloons(options)` implemented in `animations/inner-balloons.js`
- Both Type 1 and Type 2 use identical `type2Swirl()` function for consistent behavior
- Orbital mechanics with single gravitational body below center (gravity strength 1.0)
- Unique velocity and trajectory for each balloon (0.5-3.5 random velocity + random direction)
- Combined motion: 70% orbital + 30% random trajectory
- Continuous repulsive forces between balloons (0.02 strength)
- Collision physics with boundary bouncing and 20% momentum loss
- Zero gravity phase (0-3s) then gradual slowdown (3-5s) then freeze
- Materialization window: 0-1.5 seconds for all balloons
- Multiple concentric circles with decreasing opacity (union effect)
- Sea-to-sunset color palette with one randomly enhanced color per load
- Vertical anchoring via `getBoundingClientRect()` on header title
- `freeze()` helper stops RAF and transitions at `introDurationMs`

## HTML Stub (example)
```html
<section class="inner-hero" style="background-image: url('optional.jpg');">
  <div class="inner-balloons"><svg id="inner-balloons-svg"></svg></div>
  <div class="inner-hero-content">
    <h1>Page Title</h1>
    <p>Optional supporting line.</p>
  </div>
</section>

<section class="blue-section">
  <div class="content-row">
    <div class="content-col">...</div>
    <div class="content-col">...</div>
  </div>
</section>
```

## Acceptance Checklist (Inner Pages)
- Nav matches landing (style and behavior); no logo
- Header balloons use orbital mechanics with single gravitational body below center
- 20-30 balloons with 8-20 layers each, materializing over 0-1.5 seconds
- Balloons show multiple concentric circles with decreasing opacity (union effect)
- Zero gravity phase (0-3s) then gradual slowdown (3-5s) then freeze
- Both Type 1 and Type 2 modes behave identically
- Type 3 mode creates inverted transparency with solid background and bubble "holes"
- Transparent mode reveals background image with white fill and light grey strokes
- Colored mode uses sea-to-sunset palette with 20-80% opacity range
- Type 3 mode: Bubbles create progressively transparent holes in solid background color
- Blue section renders with correct spacing and responsive behavior
- Footer present and consistent

## Next Steps
1. Create `animations/inner-balloons.js` implementing `initInnerBalloons(options)` using landing specs
2. Add minimal CSS for `.inner-hero`, `.inner-balloons`, `.inner-hero-content`, and `.blue-section`
3. Build one sample inner page using this template (e.g., `about.html`) and validate on mobile/desktop
