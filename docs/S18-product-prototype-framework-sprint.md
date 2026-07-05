# S18 Product Prototype Framework Sprint

## Intent

S18 turns the current site from a collection of capable pages into a coherent product prototype. The goal is to let `caolei / githoldder` evaluate the final product direction through a usable information architecture, clear routes, meaningful page states, and visual systems that match the knowledge-work domain.

This sprint is prototype-driven: every feature should appear in a route, panel, or workflow that can be inspected. Documents and scripts are not enough unless the user can see how the product will feel.

## Current Baseline

Implemented or partially implemented routes:

| Route | Current role | S18 decision |
| --- | --- | --- |
| `/` | Workbench homepage with hotlinks, recent notes, graph preview, compact shelf | Keep as command center, reduce generic copy, add stronger topic modules |
| `/notes/` | Note index | Evolve into knowledge library with filters, tags, featured clusters |
| `/notes/[slug]/` | Markdown note detail, Canvas/Excalidraw-aware detail pages | Add backlinks, related notes, topic theme, reading mode controls |
| `/search/` | Static search page | Upgrade to fuzzy command-search with title/tag/body/wiki graph ranking |
| `/projects/` | Project index | Keep as shipping/work portfolio, connect projects to notes and decks |
| `/projects/[slug]/` | Project detail | Add evidence, related notes, graph focus link |
| `/library/` | Book shelf page | Upgrade visual bookshelf and dual actions: source book / annotator note |
| `/resume/` | Public resume | Keep public artifact, ensure identity/privacy and export links |
| `/decks/` | Deck index | Upgrade to Deck Studio entry with preview/export status |
| `/slides/[slug]/` | Generated deck preview | Keep generated output route |
| `/lab/graph` | Semantic graph lab | Use as map/cluster exploration route |
| `/lab/graph-3d` | Experimental 3D graph | Keep experimental, not primary navigation |
| `/lab/canvas` | Canvas lab | Keep as diagnostics/showcase for Canvas fidelity |
| `/lab/typst` | Typst Lab MVP | Grow into Overleaf-like document lab |
| `/admin/` | Admin dashboard | Become local-only content studio shell |
| `/admin/resume` | Resume admin | Fold into studio navigation later |
| `/admin/agent` | Agent/admin surface | Keep internal and clearly separate from public routes |

## Product Pillars

### 1. Command Center

The homepage should answer three questions within one viewport:

1. What is this knowledge system about?
2. Where should I go next?
3. What is active, valuable, or worth revisiting today?

Required modules:

- Identity and current focus: `githoldder / caolei`, no legal-name exposure.
- Global quick actions: Search, Notes, Graph, Library, Decks, Typst Lab, Admin.
- Featured knowledge hotlinks: handpicked essays, wiki clusters, project-deck bundles.
- Visual topic surfaces: rotating but deterministic topic backgrounds.
- Book window: beautiful shelf preview with source and annotator-note actions.
- Status strip: notes count, graph edges, media assets, deck build state, latest build time.

### 2. Knowledge Reader

Notes should feel like a digital garden and a technical blog at the same time.

Required page elements:

- Article header with title, date, tags, reading mode, graph focus.
- Backlinks and outgoing links.
- Related notes from wiki graph, tag overlap, and explicit links.
- Topic theme: palette, background image, subtle interaction pattern.
- Reading modes:
  - `essay`: calm long-form reading.
  - `wiki`: dense reference layout with backlinks.
  - `technical`: code/architecture-heavy layout.
  - `book-note`: source book + annotator anchors.
  - `canvas`: full-width visual board.
  - `project-log`: evidence-first implementation journal.

### 3. Search And Navigation

Search should become the fastest route through the system, not just a text filter.

Required behavior:

- Fuzzy matching over title, aliases, tags, headings, body tokens, and wiki graph tokens.
- Ranking order: exact title > alias > tag > heading > backlink/hotlink > body.
- Keyboard-first command palette behavior.
- Result groups: Notes, Projects, Books, Decks, Resume, Labs.
- Quick actions: open note, focus graph, copy route, open related cluster.

### 4. Library And Annotator

The library should look like a real shelf/window, not generic cards.

Required behavior:

- Book shelf visualization with stable spine dimensions and no overflowing titles.
- Two actions per book:
  - open source/original book when available.
  - open annotator note and jump to quoted/page/text-position selector when available.
- Shelf filters: reading status, topic, annotation count, source availability.
- Featured book window on homepage.

### 5. Content Studio

The admin side should be a local-first studio, not a public CMS.

Required tools:

- Source tree for approved roots.
- Markdown/YAML/Typst editor.
- Media picker and upload manifest.
- Deck editor with build/export state.
- Typst compile preview and error log.
- Publish dry-run and explicit approval gate.
- No remote write from public pages.

### 6. Deck, Reveal, And PPTX

Decks should be first-class knowledge artifacts.

Required behavior:

- Deck index shows source, preview, PDF, PPTX, build log, publish status.
- Markdown decks use Slidev preview.
- PPTX high-fidelity import/export uses local Keynote adapter after explicit approval.
- PDF export status appears in manifest.
- Reveal/raw HTML remains compatibility mode, not the preferred authoring path.

### 7. Typst Lab

Typst Lab should become the document lab for resume and future structured PDFs.

Required behavior:

- Project tree, editor, PDF preview, build log, help links.
- Compile job endpoint with error line reporting.
- Download PDF/JSON/source bundle.
- Later: template selection, version snapshots, Git sync, project import.

### 8. Media, Music, And Ambient Tools

The homepage can host light personal-lab tools, but they must serve the knowledge mood.

Required behavior:

- Media upload and library manifest for images/audio/video.
- Music player with playlist and soft waveform/lyric surface.
- Theme color tuner for homepage and reading pages.
- Generated topic background pool with contrast metadata.

## Route Definition Target

### Public Routes

| Route | Purpose | Primary user action |
| --- | --- | --- |
| `/` | Command center | Choose next knowledge path |
| `/search/` | Command search | Find anything quickly |
| `/notes/` | Knowledge index | Browse/filter notes |
| `/notes/[slug]/` | Reading surface | Read, follow links, inspect backlinks |
| `/projects/` | Project portfolio | Inspect shipped work |
| `/projects/[slug]/` | Project case | Read evidence and related notes |
| `/library/` | Book shelf | Open book source or annotator note |
| `/decks/` | Public deck gallery | Preview/download decks |
| `/resume/` | Public resume | Read/download resume |

### Lab Routes

| Route | Purpose | Visibility |
| --- | --- | --- |
| `/lab/graph` | Knowledge graph exploration | Public but experimental |
| `/lab/canvas` | Canvas preview diagnostics | Public showcase |
| `/lab/graph-3d` | 3D graph experiment | Experimental |
| `/lab/typst` | Local document lab | Local-first, working surface |

### Local Admin Routes

| Route | Purpose | Visibility |
| --- | --- | --- |
| `/admin/` | Content studio dashboard | Local-only intent |
| `/admin/resume` | Resume source/evidence panel | Local-only intent |
| `/admin/agent` | Agent operations surface | Local-only intent |

## Navigation Model

Primary navigation should stay small:

- Workbench
- Search
- Notes
- Graph
- Library
- Projects
- Studio

Secondary destinations should appear contextually:

- Resume appears in Workbench and Projects.
- Decks appear in Workbench, Notes, Projects, and Studio.
- Typst Lab appears under Studio and Labs, not as a top-level public nav item.
- Canvas and 3D graph remain Labs, not primary nav.

## UX Standards

### Functionality

- Every visible module must link to real content, generated indexes, or a local tool.
- No mock walls.
- Empty states must say what data source is missing and how to build it.
- Export/publish actions must show status and safety level.

### Ease Of Use

- One-click path from homepage to search, notes, graph, books, projects, decks, and studio.
- Keyboard-first search.
- Stable controls: no shifting buttons, cards, or book spines.
- Mobile navigation remains scrollable but compact.

### Convenience

- Every artifact should have at least one next action:
  - read
  - search related
  - focus graph
  - open source
  - edit locally
  - export
  - publish dry-run

### Readability

- Article pages prioritize text measure, heading hierarchy, and contextual side panels.
- Dense wiki/reference pages can use split panes.
- Canvas/deck pages can go full-width.
- The app avoids oversized marketing hero layouts except where a real visual artifact carries meaning.

### Beauty

- Use restrained, domain-specific visuals: paper, graph, shelf, instrument, map, studio.
- Avoid one-note palettes; topic pages should vary by subject.
- Generated backgrounds should be used as topic ambience, not generic decoration.
- Book shelf and graph modules should feel tactile and precise.
- Motion should be soft, purposeful, and tied to cursor/click/route state.

## S18 Task Breakdown

### S18-T01 Route And Navigation Contract

Define and implement the final top-level navigation, contextual labs/studio links, and route labels.

Acceptance:

- Primary nav has no more than seven items.
- Every nav item maps to a real route.
- Search is reachable from header and homepage.

### S18-T02 Homepage Product Prototype

Redesign homepage into the command center.

Acceptance:

- First viewport shows identity, quick actions, featured hotlinks, and one visual artifact.
- No generic mock copy.
- Book window, graph status, topic hotlinks, and build status are data-backed.

### S18-T03 Search Command Surface

Use `public/assets/wiki/search.json` and `graph.json` to upgrade search.

Acceptance:

- Fuzzy search ranks title, alias, tag, heading, backlink, and body.
- Result groups are visible.
- Keyboard navigation works.

### S18-T04 Note Reading Prototype

Upgrade note detail pages with backlinks, related notes, topic theme, and reading modes.

Acceptance:

- Backlinks and outgoing links render from wiki graph.
- Reading mode is inferred from tags/source type and can be overridden.
- Canvas notes remain full-width.

### S18-T05 Library Shelf Prototype

Redesign library into a shelf/window.

Acceptance:

- Titles never overflow spines.
- Each book exposes source/open-original and annotator-note actions.
- Filters and featured shelves are data-backed.

### S18-T06 Studio Shell

Unify admin, Typst Lab, media upload, and deck editing into a local studio prototype.

Acceptance:

- Studio dashboard links to source editor, media, decks, Typst, resume, publish dry-run.
- Local-only warning is visible.
- No public route triggers remote writes.

### S18-T07 Deck And PPTX Studio Prototype

Expose deck source, preview, build log, PDF/PPTX status, and Keynote check.

Acceptance:

- Deck cards show export/publish state from manifest.
- Keynote check result is visible in studio.
- Publish dry-run is visible but not automatic.

### S18-T08 Typst Lab Compile Job

Move Typst Lab from save-only MVP to compile-preview loop.

Acceptance:

- Compile job endpoint returns success/error/log.
- Errors show line/context where possible.
- PDF preview refreshes after successful compile.

### S18-T09 Media, Music, And Theme Tools

Prototype media picker, music player, lyric/waveform surface, and theme tuner.

Acceptance:

- Media manifest drives picker.
- Music player has playlist, play/pause, lyric placeholder, and waveform visualization.
- Theme tuner can change preview palette without breaking contrast.

### S18-T10 Visual QA Recovery

Fix visual screenshot pipeline by replacing or repairing Python Playwright dependency.

Acceptance:

- `npm run test:smoke` produces route screenshots.
- `npm run test:visual` produces visual review index.
- Reports include homepage, library, notes, search, decks, Typst Lab, and studio.

## Implementation Order

1. Commit and push the S15-S17 archive.
2. Implement S18 route/navigation and homepage command center.
3. Upgrade search and note reader using wiki graph data.
4. Upgrade library shelf and book dual actions.
5. Build studio shell, then wire Typst/deck/media tools into it.
6. Repair screenshot QA and run visual acceptance.

## Done Definition

S18 is done when the site can be evaluated as a coherent product prototype:

- A user can understand the product from the homepage in under 30 seconds.
- A user can navigate to every major tool from one or two clicks.
- Notes feel like a connected knowledge system, not a flat archive.
- Library, decks, Typst, media, and studio have visible routes and clear actions.
- Visual QA produces screenshots for manual review.
