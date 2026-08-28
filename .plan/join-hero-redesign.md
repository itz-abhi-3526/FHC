# Join Page Hero Redesign — Implementation Plan

## Goal
Replace the existing `Hero()` + `HeroScene()` in Join.jsx (lines 80–252) with a new premium 8-bit arcade terminal panel. No other sections touched.

---

## Current State (lines 80–252 in Join.jsx)

**What exists now:**
- `HeroScene()` (lines 81–153): A 500px-tall scene with floating pixel-art assets (laptop, robot, microchip, code-bubble, globe, terminal) scattered around a central laptop
- `Hero()` (lines 155–252): Wraps `HeroScene` in an `ArcadeFrame`, uses `hero-content-grid` CSS (42%/58% split), left side has "JOIN" / "FHC" title + system panel + CTA, right side has the scene
- Background: `#08090B` (INK)
- Border: `PK` (#FF1687) corner brackets, subtle pink border
- Particles: 5 floating dots + 10 `hero-sparks`
- Uses `hero-content-grid`, `hero-text-col`, `hero-art-col` CSS classes from index.css

**What changes:**
- `HeroScene()` is **deleted entirely**
- `Hero()` is **rewritten** as a single self-contained arcade terminal panel
- The `hero-content-grid` / `hero-text-col` / `hero-art-col` CSS classes in index.css remain untouched (still used by Home.jsx hero)

---

## Design Structure

One self-contained arcade terminal panel with 3 zones:
1. **LEFT** (~42%): "JOIN_" / "FHC" heading + system panel + CTA
2. **RIGHT** (~55%): Speech bubble + robot-on-laptop composition
3. **BOTTOM**: Integrated HUD status bar

### Terminal Container
- Background: `#050810` (new dark navy)
- Outer border: 3px solid `#00D9FF` (cyan)
- Secondary border: 2px solid `#003366` (dark blue)
- Hot-pink accent corners/brackets
- CRT scanlines (reuse `.arcade-panel-scanlines` class)
- Pixel grid texture (reuse `.arcade-panel-grid` class)
- 4 sparse floating pixel particles (cyan, pink, yellow, green)
- 4 cyan HUD corner brackets (36px, `#00D9FF`, 0.5 opacity)

### Top HUD Bar (inside terminal, top)
- LEFT: `"FHC // PLAYER TERMINAL"` — cyan pixel text, 7px
- RIGHT: `"STATUS: ONLINE"` — cyan pixel text, 7px

### Left Content (~42%)
1. **Heading:**
   - Line 1: `"JOIN_"` — off-white `#FFF5DD`, `clamp(48px, 7vw, 90px)`, blinking `_` cursor
   - Line 2: `"FHC"` — hot pink `#FF007F`, `clamp(64px, 10vw, 130px)`
   - Pixel shadow offset (3px 3px 0 `#050810`)

2. **System Panel** (compact):
   - Title: `"FHC // PLAYER SYSTEM"` with cyan square indicator
   - Body: `"Be part of something bigger."` (bold) + `"FHC is where students turn curiosity into something real."`
   - Background: `#08090B` with thin `#00D9FF` border
   - Corner brackets (small, cyan)

3. **CTA Button:**
   - Text: `"▶ CREATE PLAYER"`
   - Black interior, hot-pink double border, pixel corner brackets
   - Hover: border glow, 1–2px movement, brightness increase
   - Uses `clipPath` for pixel corners (same pattern as existing)

### Right Content (~55%)
1. **Speech Bubble:**
   - Text: `"< />"` (or simple code symbol)
   - White/off-white fill, black pixel outline
   - Pixel-art speech bubble shape with tail
   - Positioned above/near the robot

2. **Robot + Laptop:**
   - Use existing assets: `hero-laptop.png` and `hero-robot.png` from `/assets/fhc-loader/`
   - Laptop sits in lower-right of visual area
   - "FHC_" in hot pink pixel typography on laptop screen (overlaid text)
   - Robot sits naturally on top of laptop
   - Both use `imageRendering: pixelated`
   - `float` animation (reuse existing keyframe)

### Circuit Traces (background layer)
- Small number of SVG PCB pathways connecting left/right areas
- Colors: cyan, pink, green, yellow
- Dashed pixel lines (strokeDasharray)
- Behind ALL content — never crossing text, panel, CTA, laptop, robot, or bubble
- Low opacity (0.12–0.18)

### Bottom Status Bar (inside terminal, bottom)
- LEFT: `"FHC // JOIN TERMINAL"` — cyan
- CENTER: pixel heart + segmented bars + `"NEW PLAYER DETECTED"` + `"01 / 01"` — pink/cyan
- RIGHT: `"INPUT REQUIRED"` — cyan
- Thin top separator line

---

## Color System

| Role | Hex | Usage |
|------|-----|-------|
| Primary | `#FF007F` | FHC text, CTA border, accents |
| Cyan | `#00D9FF` | HUD, borders, status text |
| Bright Blue | `#0066FF` | Circuit traces |
| Dark BG | `#050810` | Terminal background |
| Off-white | `#FFF5DD` | "JOIN_" text, body copy |
| Black | `#000000` | CTA interior, panel background |
| Green | `#39FF6A` | Circuit nodes |
| Yellow | `#FFD400` | Circuit nodes |

---

## Assets Used

| Asset | Path | Usage |
|-------|------|-------|
| hero-laptop.png | `/assets/fhc-loader/hero-laptop.png` | Right side laptop |
| hero-robot.png | `/assets/fhc-loader/hero-robot.png` | Right side robot |

No new asset files created.

---

## CSS Changes (index.css)

**NONE.** All CSS classes needed already exist:
- `.arcade-panel-scanlines` — CRT scanline overlay
- `.arcade-panel-grid` — pixel grid texture
- `.animate-arcade-cursor-slow` — blinking cursor
- `.animate-float` — floating animation (via Tailwind theme)
- `.animate-heart-pulse` — heart pulse
- `@keyframes float` — float keyframes

The existing `hero-content-grid` / `hero-text-col` / `hero-art-col` classes are **NOT used** by the new hero (they remain for Home.jsx).

---

## Implementation Steps

### Step 1: Delete `HeroScene()` (lines 81–153)
Remove the entire `HERO_SPARKS` constant and `HeroScene` function. These are no longer needed.

### Step 2: Rewrite `Hero()` (lines 155–252)
Replace with new terminal-panel design. Structure:

```
<ArcadeFrame label="FHC // PLAYER TERMINAL" rightLabel="STATUS: ONLINE">
  <section> {/* dark navy bg, scanlines, grid, particles, HUD frame */}
    <div> {/* main composition: flexbox two-column */}
      <div> {/* LEFT: heading + system panel + CTA */} </div>
      <div> {/* RIGHT: speech bubble + robot+laptop */} </div>
    </div>
    <div> {/* BOTTOM STATUS BAR */} </div>
  </section>
</ArcadeFrame>
```

### Step 3: Verify build
Run `npx vite build` to confirm no errors.

---

## Responsive Behavior

- **Desktop (≥1024px):** Two-column grid, ~42% left / ~55% right
- **Tablet (768–1023px):** Reduce laptop size and typography proportionally, keep two-column
- **Mobile (<768px):** Single column stack: heading → system panel → CTA → robot+laptop → status bar

---

## Constraints

- ✅ Only `Hero()` and `HeroScene()` are modified/deleted
- ✅ `CreateProfile`, `ReadyToLevelUp`, `Footer` untouched
- ✅ "Why Join FHC?" section untouched (it's in Home.jsx anyway)
- ✅ No new files created
- ✅ No new CSS classes added
- ✅ Navigation, routing, join functionality preserved
- ✅ `ArcadeFrame`, `PixelStaircase`, `ArcadeInput`, `ProfileAvatar`, `DomainSelector` components untouched
