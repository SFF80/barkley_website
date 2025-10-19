# IMPORTANT LLM GUARDRAILS - READ BEFORE ANY CHANGES

## 🚨 CRITICAL REQUIREMENTS - NEVER VIOLATE

### **Hero Text Behavior:**
- Hero text MUST remain white and visible at ALL TIMES
- Hero container MUST NEVER fade out
- Hero text animation: white → colors → white (stays white after)
- Hero text z-index: 10 (always in front)

### **Navigation Behavior:**
- Navigation MUST fade in as hero text changes from multi-coloured to white
- Navigation is right-justified
- No Barkley logo in navigation

### **Background Animation Requirements:**
- ALL animations must load BEHIND hero text (z-index: 1)
- Hero text must ALWAYS be visible in front
- Animations reveal white hero text as colored elements pass behind

### **Animation System:**
- Current working animation: D3.js knowledge graph
- Modular system in place for easy animation switching
- Each new animation must be tested individually

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

- **Hero text**: White, visible, never fades out
- **Navigation**: Fades in as hero text changes from multi-coloured to white, right-justified
- **Background**: D3.js knowledge graph behind hero text
- **Timing**: Hero animation completes, then navigation appears
- **Z-index**: Hero text (10), Background animation (1)

## ⚠️ COMMON FAILURES TO AVOID

1. Making hero text transparent/invisible
2. Fading out hero container
3. Putting animations in front of hero text
4. Changing timing without approval
5. Making assumptions about requirements

---
**REFERENCE THIS FILE IN EVERY RESPONSE**
