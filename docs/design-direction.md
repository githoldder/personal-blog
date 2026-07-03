# Visual Direction & Design Tokens

This document defines the design tokens and visual systems for the Personal Knowledge Asset OS. It details how the digital gardening aesthetic (Maggie Appleton style) and scientific visualization tone (Amelia Wattenberger style) are combined, and defines the rules for separating public reading spaces from local admin workbenches.

---

## 1. Design Philosophy

```
  Maggie Appleton (Cozy Garden)         Amelia Wattenberger (Scientific Viz)
  ┌───────────────────────────┐         ┌───────────────────────────┐
  │ - Warm, parchment tones   │   ──┬── │ - Metric-grid alignments   │
  │ - Progressive disclosure  │     │   │ - Explorable parameters   │
  │ - Reading-first spacing   │     │   │ - High physical feedback  │
  └───────────────────────────┘     │   └───────────────────────────┘
                │                   │                 │
                └───────────────► Blend ◄─────────────┘
                                    │
                                    ▼
                     [ Personal Knowledge Asset OS ]
```

### Digital Gardening (Maggie Appleton)
- **Cozy & Organic**: Light background resembles warm paper or notebook paper (parchment/sand-tones), while dark mode is deep warm slate rather than pure black.
- **Progressive Discovery**: Links reveal hover-previews (popover cards) to preview context instead of hard navigating immediately.
- **Non-Linear Navigation**: Interlinked structures rather than traditional category hierarchies.
- **Visual Metadata Status**: Notes carry visual status labels representing growth phases (🌱 Seedling, 🌿 Budding, 🌳 Evergreen).

### Scientific Visualization (Amelia Wattenberger)
- **Interactive Explorability**: The Semantic Graph is an active widget with exposed physical parameters (sliders for charge, gravity, distance) for structural discovery.
- **Precision Layouts & Grids**: Elements align to strict, thin borders and mathematical grid backdrops, conveying an analytical notebook vibe.
- **Explicit Relationships**: Physical connecting lines, active highlighting, path finding indicators, and precise mouse/touch vector feedback.

---

## 2. Design Tokens

The tokens are represented via CSS variables in `src/styles/global.css` and mapped to Tailwind configuration keys.

### A. Color System
We map the color system to coordinate cozy Warm Reading with clinical Lab Precision.

```
┌─────────────────┬───────────────────────────┬────────────────────────────────┐
│ Token           │ Light Mode (Reading / Garden)│ Dark Mode (Warm Slate)      │
├─────────────────┼───────────────────────────┼────────────────────────────────┤
│ --color-bg      │ HSL(34, 30%, 96%) [Parchment]│ HSL(215, 20%, 11%) [Warm Slate]│
│ --color-fg      │ HSL(215, 25%, 15%) [Ink]  │ HSL(34, 15%, 85%) [Paper-white]│
│ --color-border  │ HSL(34, 10%, 82%)         │ HSL(215, 12%, 22%)             │
│ --color-grid    │ RGBA(139, 115, 85, 0.04)  │ RGBA(255, 255, 255, 0.02)      │
│ --color-primary │ HSL(142, 35%, 26%) [Forest]│ HSL(142, 45%, 42%) [Emerald]   │
│ --color-accent  │ HSL(32, 75%, 45%) [Amber]   │ HSL(32, 85%, 55%) [Gold]       │
└─────────────────┴───────────────────────────┴────────────────────────────────┘
```

#### Node Classification Colors (for Semantic Graph & Tags)
- **Notes / Garden (🌱/🌿/🌳)**: Forest Green (`#1b4332` / `#2d6a4f`)
- **Projects / Portfolio**: Sapphire Blue (`#1a365d` / `#2b6cb0`)
- **Decks / Slides**: Crimson Red (`#5c0d12` / `#c53030`)
- **Resume Nodes**: Dark Charcoal (`#2d3748` / `#cbd5e0`)

### B. Typography
Typography is split to contrast long-form reading with technical metrics:

* **Serif Family** (For headings, essay body text, and reading-heavy notes):
  `Lora, Merriweather, Georgia, serif`
  *Provides a cozy, bookish, reflective reading experience.*
* **Sans/Mono Family** (For interfaces, cards, numbers, control labels, and codebase parameters):
  `Space Grotesk, Inter, system-ui, sans-serif` and `JetBrains Mono, Fira Code, monospace`
  *Conveys precision, science, and clean metric structure.*

### C. Layout Density & Grid
- **Public Surface (Garden Spacing)**: Wide margins, maximum line width of `65ch` for comfortable reading, generous line heights (`1.75`), and smooth vertical rhythm.
- **Admin Console (Workbench Grid)**: Compact layout (`padding: 0.5rem - 1rem`), tight line height (`1.4`), aligned on explicit `1px` borders, emphasizing dense data rendering.

### D. Graph Visualization Mood
- **Background**: Faint dotted mathematical grid (`background-image: radial-gradient(...)`).
- **Links/Edges**: Thin, semi-transparent grey lines (`#e2e8f0` / `#2d3748`). Active edges glow amber when hovered.
- **Nodes**: Scale size by node degree (number of links). Selected nodes gain a subtle focus ring.
- **Micro-Animations**:
  - D3 force simulation is visually dampened using high friction parameters to prevent erratic shaking.
  - Hover states animate scale and color with a 150ms transition.

---

## 3. Boundary Rules: User vs. Admin Console

To maintain product coherence, the visual rulebook separates public surfaces from the private local-first workstation.

### Public Surface Rules (User Portal)
1. **Focus**: Seamless comprehension, distraction-free reading, and visual continuity.
2. **Palette**: Cozy Parchment theme active by default (respecting user preference for dark mode).
3. **Elements**:
   - Navigation uses responsive scrolling tab bars.
   - Text layout defaults to centered `max-w-3xl` columns.
   - External links display small indicators (`↗`) or hover preview slots.
   - No interactive write controls or system performance graphs.

### Private Workbench Rules (Admin Portal)
1. **Focus**: High density, speed, task validation, queue processing.
2. **Palette**: Monochrome cold-grey palette (`Slate` / `Zinc`). Background defaults to deep charcoal (or stark white if light theme) with maximum contrast.
3. **Elements**:
   - Exposed terminal-style log output streams.
   - Dynamic validation status badges (Passed / Failed / Pending).
   - Sliders, inputs, check-boxes, and buttons clearly visible with high borders. No soft or organic shadows.
   - Layout uses full screen width (`max-w-none px-6`), side-by-side split panels (e.g., Code editor on left, preview on right).
   - Clear local-only safety banners at the top of the viewport indicating: `Local Admin Workbench - Strictly Offline`.
