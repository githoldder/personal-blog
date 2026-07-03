# Frontend Prototype Specification

This document defines the layout grids, routing hierarchy, and component interfaces for the public-facing pages in Sprint 07. All pages align with the visual principles defined in [docs/design-direction.md](file:///Users/caolei/Desktop/personal-blog/docs/design-direction.md).

---

## 1. Directory & Routing Hierarchy

All public views map directly to Astro routes.

```
src/pages/
├── index.astro                  # Landing page (Knowledge Dashboard)
├── notes/
│   └── index.astro              # Note garden list (🌱, 🌿, 🌳 stages)
├── projects/
│   └── index.astro              # Project collection & meta tags
├── decks/
│   └── index.astro              # Decks and Slidev lists
├── resume.astro                 # Structured professional timeline
├── search.astro                 # Client-side lookup
└── lab/
    └── graph.astro              # Semantic Graph interface with simulation controls
```

---

## 2. Core Layout Grid (Astro BaseLayout)

The public views utilize a responsive container layout that wraps standard Astro pages.

* **Top Header (Global Navigation)**: Horizontal scrolling tab bar. Explicitly labels the site scope.
* **Main Container**:
  * Public pages default to `max-w-4xl mx-auto px-4 py-8` (Maggie Appleton reading column).
  * High-density graphs and console portals default to `max-w-7xl mx-auto px-4 py-6` (Amelia Wattenberger dashboard).
* **Footer**: Links to raw JSON outputs (`resume.json`, `search-index.json`, `rss.xml`, `atom.xml`) representing data source provenance.

---

## 3. Landing Page Composition (`src/pages/index.astro`)

The new index page functions as a unified Knowledge Atlas rather than a generic developer portfolio. It divides the screen into visual sections:

```
┌────────────────────────────────────────────────────────┐
│                    GLOBAL HEADER                       │
├────────────────────────────────────────────────────────┤
│  [Hero Panel] Bio & Identity                           │
│  "Personal Knowledge Asset OS"                         │
├───────────────────────────┬────────────────────────────┤
│  [Left Panel: Knowledge]  │  [Right Panel: Science]    │
│  🌱 Notes Garden Preview  │  📊 System Stats & Index   │
│  - Note A (🌱 Seedling)   │  - Total Assets: N         │
│  - Note B (🌳 Evergreen)  │  - Build Time: UTC         │
│                           │                            │
│  🌿 Project Timeline      │  🕸️ Semantic Graph Entry    │
│  - Project X (Done)       │  - Graph Canvas Link       │
└───────────────────────────┴────────────────────────────┘
```

### Components on Landing Page
1. **Bio Panel**: Introduce identity and describe the local filesystem vault structure.
2. **Notes Garden Highlight**: List 3-4 recently updated notes, each labeled with its growth stage (🌱 / 🌿 / 🌳).
3. **Project Timeline Overview**: Highlight active work items.
4. **Interactive Graph Entry**: Embedded mini SVG preview or pointer indicating the relationship graph.

---

## 4. Reading Surface Specification (`src/pages/notes/index.astro`)

The Reading View prioritizes typographic elegance and metadata clarity:

* **Typographic Hierarchy**:
  * Title: `font-serif text-3xl md:text-4xl text-surface-900 font-bold`
  * Body text: `font-serif max-w-prose leading-relaxed text-surface-800`
  * Headings (H2/H3): `font-sans text-xl md:text-2xl text-surface-800 tracking-tight mt-8 mb-4`
* **Metadata Bar**:
  * Author Identity, Stable Last-Modified Timestamp, Category, and growth status tag.
* **Future Extension Hook**: Include a placeholder container for `## Backlinks` (Notes linking to the current view) and `## Related Assets` to make the graph-driven features explicit.

---

## 5. Library & Slides Grid (`src/pages/projects/index.astro` & `src/pages/decks/index.astro`)

* **List layouts**: Display content items as structured grid cards with clear metadata (e.g., tags, date, status).
* **Controls Placeholder**: Pre-styled visual badges for tag filtering and sort orders. Clicking them shows static feedback to prove interaction design.
