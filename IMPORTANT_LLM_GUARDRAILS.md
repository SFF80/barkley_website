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

### **Animation System:**
- Current working animation: D3.js layered balloon circles
- 25 balloon groups with 3-6 layers each
- Breathing/expanding animation with different rates per balloon
- Vertically aligned with hero text

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
- **Animation**: 25 balloon groups with breathing/expanding layers, vertically aligned

## ⚠️ COMMON FAILURES TO AVOID

1. Making hero text transparent/invisible
2. Fading out hero container
3. Putting animations in front of hero text
4. Changing timing without approval
5. Making assumptions about requirements
6. Changing hero text font, weight, or size without explicit approval
7. Breaking the layered balloon animation system

---
**REFERENCE THIS FILE IN EVERY RESPONSE**
