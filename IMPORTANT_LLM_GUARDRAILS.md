# IMPORTANT LLM GUARDRAILS - READ BEFORE ANY CHANGES

## 🚨 CRITICAL REQUIREMENTS - NEVER VIOLATE

### **Hero Text Behavior:**
- Hero text MUST remain white and visible at ALL TIMES
- Hero container MUST NEVER fade out
- Hero text animation: white → colors → white (stays white after)
- Hero text z-index: 10 (always in front)
- Hero text font: Arial, font-weight: 300 (thin), font-size: 13.5rem

### **Navigation Behavior:**
- Navigation MUST fade in as hero text changes from multi-coloured to white
- Navigation is right-justified
- No Barkley logo in navigation

### **Background Animation Requirements:**
- ALL animations must load BEHIND hero text (z-index: 5)
- Hero text must ALWAYS be visible in front (z-index: 10)
- Animations reveal white hero text as colored elements pass behind
- Current animation: D3.js layered balloon circles with breathing effect

### **Animation System (Authoritative Current Parameters):**
- Current working animation: D3.js layered balloon circles
- Balloon groups: ~40 nodes total (subject to tuning for density)
- Layers per balloon: 4–10 (curved growth across layers)
- Curved growth exponent: 1.75 (controls inner→outer radius progression)
- Construction pattern: outermost + innermost appear first, then next pairs inward/outward
- Materialization window (subsequent flow): starts at 10% of section width; construction duration 720ms per layer
- Initial page load: balloons seeded across 10%–80% of width; respect same construction timing
- Dematerialization window: begins at 80% of width; deconstruction duration 600ms per layer
- Horizontal flow: left → right with base speed plus variance per balloon; continuous recycling
- Vertical alignment: balloons vertically anchored to hero text center; gentle sine-wave vertical drift
- Color system: “sea → sunset” palette with one randomly enhanced color per load

## 🔒 PROTECTION PROTOCOLS

### **Before ANY Code Changes:**
1. Ask: "Should I proceed with [specific change]?"
2. Confirm: "This will [specific effect] - is this correct?"
3. Never assume - always ask for approval

### **Animation Experiment Protocol:**
1. New animation must load behind hero text (z-index: 1)
2. Hero text stays white and visible (z-index: 10)
3. Test one animation at a time
4. Verify hero text remains visible before proceeding

### **Memory Protection:**
- Reference this file in EVERY response
- Never make decisions without explicit approval
- Document exact requirements before changes
- Test each change individually

## 📋 CURRENT WORKING STATE (DO NOT BREAK)

- **Hero text**: White, visible, never fades out, Arial font, weight 300, size 13.5rem
- **Navigation**: Fades in as hero text changes from multi-coloured to white, right-justified
- **Background**: D3.js layered balloon circles behind hero text
- **Timing**: Hero animation completes, then navigation appears
- **Z-index**: Hero text (10), Background animation (5)
- **Animation**: Parameters as listed in the Authoritative Current Parameters section above

## ⚠️ COMMON FAILURES TO AVOID

1. Making hero text transparent/invisible
2. Fading out hero container
3. Putting animations in front of hero text
4. Changing timing without approval
5. Making assumptions about requirements
6. Changing hero text font, weight, or size without explicit approval
7. Breaking the layered balloon animation system

---

## ✅ IMPLEMENTATION CONTRACT (BUILD-FROM-SCRATCH SPEC)

### Files
- Required:
  - `index.html`
  - `styles.css`
  - `script.js`
  - Secondary pages with placeholder content: `about.html`, `services.html`, `portfolio.html`, `contact.html`, `blog.html`
- CDN: `<script src="https://d3js.org/d3.v7.min.js"></script>` loaded before `script.js`
- Load order: include `styles.css` in `<head>`, D3 before `script.js`, `script.js` just before `</body>`

### DOM Structure (key IDs/classes)
- Wrapper: `<div class="page-wrapper">`
- Background animation container: `<div class="knowledge-graph"><svg id="graph-svg"></svg></div>`
- Hero container: `<div id="hero-container" class="hero-container"><div class="hero-text">` with seven `<span class="letter" data-letter="b|a|r|k|l|e|y">`
- Main content wrapper: `<div id="main-content" class="main-content hidden">`
- Navigation: `<header class="header"><nav class="nav"><ul class="nav-links"> ... </ul></nav></header>`
- Knowledge section:
  - `<section class="data-section">`
  - `<h2>KNOWLEDGE</h2>`
  - `<div class="data-columns">`
    - `<div class="data-column left-column">` (3 paragraphs)
    - `<div class="data-column right-column">` (3 paragraphs)
- Grey navigation footer:
  - `<section class="grey-nav-section"><div class="grey-nav-container">`
  - Row 1 (Capabilities links) as implemented
  - Row 2: `.data-columns` with left `.site-map-section` and right `.disclaimer-section` (right-justified)

### Exact Text Content
- Knowledge H2: `KNOWLEDGE`
- Knowledge left column (3 paragraphs):
  1. `Data is exhaust. Knowledge is leverage.`
  2. `Barkley enables organisations to continousouly map, navigate, predict and react to knowledge as it evolves.`
  3. `Domain-fluent AIs work beside our Forward-Deployed Engineers to surface, structure, and use knowledge at scale — converting operational noise into compound efficiency.`
- Knowledge right column (3 paragraphs):
  1. `As domains evolve, the system learns and adapts in real time — wiring insight directly into process, compliance, and decision.`
  2. `The result: knowledge that executes, decisions that move faster, cost less, and stay aligned.`
  3. `Replace bureaucracy with intelligence, and pull efficiency forward by orders of magnitude. This capability is Barkley.`
- Capabilities links: `Data Processing Platform`, `AI & Machine Learning`, `FDE`, `Domain Fluency`, `Knowledge Management`, `Process Automation`
- Site Map links: `Sectors`, `Capabilities`, `Platform`, `Contact`, `Social`
- Disclaimer (3 lines):
  - `Copyright 2025 Barkley. All rights reserved.`
  - `Terms of Use | Privacy & Cookies`
  - `Intellectual Property Guidelines | UK Modern Slavery Act`

### Layout & Styling Constants
- Hero/animation: `.hero-container` and `.knowledge-graph` `position: absolute; top: 0; height: 75vh; width: 100%`
- Main content offset: `#main-content { padding-top: 75vh; }`
- Z-indexes: `.header { z-index: 100 }`, `.hero-text { z-index: 10 }`, `.knowledge-graph { z-index: 5 }`
- Max widths: `.data-section` and `.grey-nav-container` `max-width: 1210px; margin: 0 auto;`
- Horizontal padding: `padding: 0 clamp(0rem, 3.6vw, 2.7rem)`; extra left padding for grey nav via trailing clamp with +33px equivalent
- Columns: `.data-columns` flex row with `gap: 3rem`; `.data-column.left-column` and `.right-column` both `flex: 1`
- Disclaimer: right-aligned with subtle `border-top: 1px solid #E0E0E0`
- Navigation: fixed header, thin grey bottom border, right-justified links; labels: `Sectors | Capabilities | Platform | Contact | Social`

### Animation Contract (script.js)
- Selectors: `const svg = d3.select('#graph-svg'); const container = d3.select('.knowledge-graph'); svg sized to container.clientWidth/Height`
- Node model per balloon: `{ id, x, y, baseSize, layers, color, animationSpeed, animationOffset, verticalSpeed, verticalOffset, verticalAmplitude, horizontalSpeed, isConstructed, isDeconstructing }`
- Seeding: `x` uniformly across 10%–80% width on initial load; thereafter spawn within 10% window; recycle to left after exiting right
- Windows: construct when `x ∈ [0.1W, 0.1W+100]` (post-initial); deconstruct when `x > 0.8W+100`; recycle at `x > W+200`
- Timing: construction `.duration(720)`; deconstruction `.duration(600)`; per-layer delays to realize outer+inner pairing
- Growth: per-layer radius using curved exponent 1.75; opacity decreases on outer layers; min radius guardrails
- Vertical anchoring: compute hero text vertical center via `getBoundingClientRect()`; update on resize
- Color palette: sea→sunset; randomly choose an enhanced color each load; apply to Knowledge `h2` and bold `Barkley`
- Hero text color cycle synchronized to carousel cycle; hero stays visible white outside color cycles; nav fade aligned to color→white onset

### Acceptance Checklist
- On refresh, balloons fill 10%–80% width and construct in place
- During flow, construction starts at 10% width and deconstruction at 80% width; recycling is continuous
- Hero text always visible, never fades out; appears in front of animation
- Navigation fades in exactly as hero transitions back to white; links right-justified with specified labels
- Site Map appears in left column and disclaimer appears right-justified in same row

---
**REFERENCE THIS FILE IN EVERY RESPONSE**
