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

### Balloon Animation – Consistency with Landing Page
Use the same visual and behavioral rules as the landing balloons, with two differences: short intro animation then stop, and optional transparency mode to reveal a background image.

Authoritative parameters (aligned with guardrails):
- Nodes (balloons): ~40 total (tune per header width)
- Layers per balloon: 4–10
- Curved growth exponent: 1.75
- Construction pattern: outermost + innermost first, then pairs inward/outward
- Construction duration per layer: 720ms; per-layer delay to realize pairing
- Deconstruction disabled after intro (for inner pages)
- Horizontal flow: enable only for intro (2–4 seconds), then freeze positions
- Vertical drift: gentle sine-wave (low amplitude) can be kept or damped to near-zero after freeze
- Color palette: sea→sunset; one randomly enhanced color per load
- Anchor vertically to header text center (compute via `getBoundingClientRect()`)
- Sizing SVG to container: size from `.inner-balloons` bounds, not window

Intro animation timeline (inner pages):
1. 0–2.5s: Construct balloons within visible band (10%–80% width) using landing page pairing rule
2. 2.5–4s: Optional brief left→right drift (reduced speed); then stop
3. ≥4s: Freeze—remove transitions/animations; maintain final opacities

Freeze behavior:
- Stop RAF updates; remove active transitions; keep SVG elements in place.

Transparency modes:
- `mode: "colored"` → normal landing palette
- `mode: "transparent"` → reduce fill alpha (e.g., `opacity: 0.15–0.35` by layer) so an underlying background image is revealed
- Optional: accept a `backgroundImageUrl` style on `.inner-hero` with `background-size: cover; background-position: center;`

Public API (config object in `initInnerBalloons(options)`):
```js
{
  containerSelector: '.inner-balloons',
  svgId: 'inner-balloons-svg',
  nodeCount: 40,
  layerRange: [4,10],
  curvedExponent: 1.75,
  introDurationMs: 4000,         // total time before freeze
  constructWindowPct: [0.10,0.80],
  mode: 'colored' | 'transparent',
  backgroundImageUrl: undefined,  // set on .inner-hero when provided
  verticalDriftAfterFreeze: false // if true, keep a very small sine drift
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
- New function `initInnerBalloons(options)` colocated in `script.js` or `animations/inner-balloons.js` (preferred for modularity)
- Reuse color palette and probability enhancement logic from landing
- Reuse vertical anchoring logic via `getBoundingClientRect()` on header title
- Provide a `freeze()` helper to stop RAF and transitions at `introDurationMs`

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
- Header balloons construct with landing rules, animate briefly, then stop
- Transparent mode reveals a background image when set
- Blue section renders with correct spacing and responsive behavior
- Footer present and consistent

## Next Steps
1. Create `animations/inner-balloons.js` implementing `initInnerBalloons(options)` using landing specs
2. Add minimal CSS for `.inner-hero`, `.inner-balloons`, `.inner-hero-content`, and `.blue-section`
3. Build one sample inner page using this template (e.g., `about.html`) and validate on mobile/desktop
