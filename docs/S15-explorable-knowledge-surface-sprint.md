# S15 Explorable Knowledge Surface Sprint

**Date:** 2026-07-04
**Status:** Drafted from user request and multi-agent research
**Intent:** Turn the public site from a static portfolio/blog surface into a data-driven, explorable knowledge interface inspired by high-quality interactive essays, while keeping the local-first content pipeline safe.

## Source Signals

- User wants the Canvas viewer to stop showing node type labels that compress content.
- User wants the homepage, navigation, logo, transition animations, cursor, article backgrounds, featured hotlinks, library shelf, annotator flow, reveal/deck pipeline, resume, and Typst lab redesigned as one coherent system.
- Latest design decision: the global logo should express the knowledge garden growth cycle with three simple states — seed, plant, tree — rather than a dense constellation mark. Route changes, clicks, and cursor motion should share one lightweight interaction language.
- The visual benchmark is the kind of interactive data essay exemplified by Amelia Wattenberger's D3 writing: visuals must explain data rather than decorate the page.
- Research source notes:
  - Open Library Covers API supports ISBN/OLID/Cover ID cover URLs with S/M/L sizes, `?default=false`, and asks public sites to link back.
  - Open Library Search API returns Work and Edition level metadata, including fields useful for cover and source links.
  - Typst has official syntax docs suitable for deep-linking from a future Typst lab.
  - Obsidian Canvas does not expose a stable static-web rendering API in this repo; the site should continue rendering `.canvas` JSON, with better fidelity and explicit scope.

## Guiding Principles

1. **Data First:** Every visual treatment should be traceable to content data: tags, stage, annotation count, graph degree, book metadata, project tech, or build status.
2. **Explorable, Not Decorative:** Use interaction to reveal structure, not to add noise.
3. **Local-First:** No external publishing, Cloudflare writes, R2 upload, remote plugin install, or hosted mutation without an explicit approval gate.
4. **Public Safety:** Do not leak local Obsidian paths, private notes, evidence files, API keys, or copyrighted full-text assets.
5. **Graceful Fallbacks:** Book covers, generated theme art, PDF anchors, and deck exports must have fallbacks when external metadata or viewer behavior fails.

## Professional Tooling Research

The site should not spend agent context hand-authoring every visual or animation primitive. Use professional design/animation tools as source-of-truth where they reduce token cost, visual drift, and implementation risk.

Primary sources checked:
- Figma MCP server guide: `https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server`
- Figma Plugin API reference: `https://developers.figma.com/docs/plugins/api/api-reference/`
- Rive Web runtime docs: `https://rive.app/docs/runtimes/web/web-js`
- LottieFiles dotLottie web docs: `https://developers.lottiefiles.com/docs/dotlottie-player/dotlottie-web/`

Current Codex/Figma capabilities available in this environment:
- `mcp__codex_apps__figma._use_figma`: write native Figma/FigJam/Slides content with the Figma Plugin API.
- `mcp__codex_apps__figma._generate_figma_design`: capture a live/local web page into an existing Figma design file.
- `mcp__codex_apps__figma._generate_diagram`: generate simple FigJam diagrams from Mermaid.
- `mcp__codex_apps__figma._generate_deck`: generate editable Figma Slides decks.
- `mcp__codex_apps__figma._upload_assets`: upload generated raster assets into Figma files.
- `mcp__codex_apps__figma._get_design_context`: retrieve selected Figma node context for implementation.

Tooling matrix:

| Need | Preferred tool | Why | Repo output |
| --- | --- | --- | --- |
| Static layout direction, book-window composition, visual design system | Figma MCP / Figma Design | Editable frames, reusable components, design tokens, lower token churn than hand-tuning CSS blindly | Figma URL plus extracted specs; later Astro/CSS implementation |
| Logo concept exploration | Figma Draw / Figma Plugin API through MCP | Fast vector iteration, named layers for seed/plant/tree states | `public/assets/brand/growth-logo.svg` or Figma node export |
| Logo state-machine animation | Rive | Rive Web runtime supports `.riv` files, canvas rendering, state machines, and static asset loading; ideal for `seed -> plant -> tree` states | `public/assets/brand/growth-logo.riv` with SVG fallback |
| Lightweight decorative micro-animation | dotLottie / LottieFiles | dotLottie-web has a small web player API, canvas rendering, loop/speed/segment control | `public/assets/motion/*.lottie` or `.json` |
| Thematic article/background raster images | image generation model, then Figma upload optional | Bitmap generation belongs to image models; Figma is for composition/placement review | `public/assets/generated/*.png` |
| Architecture/flow diagrams | FigJam Mermaid via Figma MCP | Structured diagrams are cheaper and more reliable than bespoke SVG | FigJam file URL; optional exported SVG/PNG |
| Deck visual concepts | Figma Slides / generate_deck | Editable pitch/storytelling surface before coding Slidev theme | Figma Slides URL, then Slidev/MD implementation |

Decision:
- S15 should use **Figma MCP first** for layout/design-system exploration and editable review artifacts.
- S15 should use **Rive first** for the final interactive logo if the `.riv` workflow is available; otherwise implement the same state contract as inline SVG.
- S15 should use **dotLottie/Lottie only** for simple passive motion, not for core navigation state, because the logo needs explicit click/route/focus control.
- S15 should continue using image generation models for bitmap backgrounds and book-window art, then optionally place generated assets into Figma for composition review.

Guardrails:
- Do not install third-party MCP bridges casually. Prefer the official Figma MCP capability already exposed in Codex. Third-party Figma MCP packages have had security issues in the ecosystem, so any new bridge requires a separate review.
- Do not require network/runtime design tooling on the public site. Public pages must ship local static assets with SVG fallback.
- Do not make Figma the runtime dependency. Figma is for design production and review; Astro remains the runtime.
- Do not let generated motion violate `prefers-reduced-motion`.
- Do not add Rive/Lottie runtime before an actual exported asset exists.

## S15 Task Breakdown

### S15-T01 Canvas Viewer Fidelity Fix

Goal: Make `.canvas` previews readable without exposing implementation labels.

Work:
- Remove synthetic `TEXT`, `FILE`, and `LINK` type labels from node cards.
- Preserve node color, group boundaries, edge arrows, edge labels, edge widths, and side-aware connectors.
- Keep fit-to-bounds view controls.

Acceptance:
- `canvas-gtd流程图` no longer displays type labels inside cards.
- Node content has more vertical space.
- Existing build passes.

### S15-T02 Data-Driven Visual Taxonomy

Goal: Create a reusable theme taxonomy driven by note tags and project tech.

Work:
- Add `src/lib/themeTaxonomy.ts`.
- Map high-frequency tags into domains:
  - `systems`: knowledge systems, Obsidian, canvas, personal dashboards
  - `engineering`: project experience, CS self-study, computer fundamentals
  - `cognition`: thinking modes, logic, feedback, abstraction
  - `planning`: personal planning, time management, GTD
  - `language`: Japanese, English, grammar, language learning
- Let layout/pages set CSS variables such as `--theme-a`, `--theme-b`, `--theme-grid`.

Acceptance:
- Home and note pages can derive a visual theme from tags without hard-coded per-page CSS.
- Project tech can map into the same system.

### S15-T03 Navigation, Logo, Cursor, and Motion Foundation

Goal: Establish a refined global interaction language.

Work:
- Replace text-only logo with a compact **growth-state SVG mark** plus handle text.
  - State 1: `seed` — a small seed/point with a soft ground arc. Used for initial load, inactive pages, and first hover.
  - State 2: `plant` — a sprout with two leaves. Used for hover/focus, active navigation, and successful clicks.
  - State 3: `tree` — a small branching tree/canopy. Used after route navigation completes or when the user intentionally clicks the logo.
- Keep the logo visually simple:
  - no dense graph/constellation metaphor
  - no long animated path drawing on every frame
  - no layout shift when the label changes
  - label variants limited to `githoldder`, `caolei`, `seed`, `tree`, or a short math symbol state
- Design workflow:
  - Create an editable Figma frame named `Brand / Growth Logo`.
  - Keep three named groups: `seed`, `plant`, `tree`.
  - Use Figma MCP for vector/component iteration when a Figma file is available.
  - Export static SVG fallback from the approved vector.
  - If a high-quality `.riv` export is available, implement Rive runtime behind a progressive-enhancement wrapper; otherwise keep inline SVG state transitions.
- Simplify nav to: 工作台 / 笔记 / 项目 / 图谱 / 图书馆 / 简历, moving search to a utility action.
- Add a subtle `SoftCursor` component enabled only for fine pointers and no reduced-motion preference.
- Add page transition polish using CSS view transitions where stable, with no blocking JS.

Acceptance:
- Header feels like a scientific workbench, not a generic blog nav.
- Logo communicates a garden growth loop in one glance.
- Hover changes the mark from seed toward plant; click advances seed -> plant -> tree -> seed.
- Route completion can briefly pulse the logo into the tree state without stealing focus.
- Cursor is subtle, non-obstructive, and disabled on touch/reduced motion.

### S15-T03A Route, Click, and Cursor Feedback Contract

Goal: Make every route switch and meaningful click feel acknowledged without turning the site into a game.

Interaction contract:
- **Route start:** header underline compresses toward the clicked nav item; cursor ring tightens once.
- **Route complete:** logo briefly enters `tree` state, then settles to the page's default state.
- **Primary click:** cursor ring contracts, then releases with a small color flash from `--theme-a` to `--theme-b`.
- **Secondary/utility click:** cursor dot brightens only; no large pulse.
- **Disabled/reduced-motion:** cursor stays native and route feedback uses color/opacity only.
- **Keyboard focus:** all interactive elements receive a visible focus ring; logo state changes on focus the same way as hover.
- **Touch devices:** no custom cursor; tap feedback is color/opacity and no path animation.

Implementation notes:
- Centralize page-interaction events in one component, e.g. `InteractionFeedback.astro`, instead of scattering event listeners across pages.
- Use CSS custom properties:
  - `--interaction-x`
  - `--interaction-y`
  - `--interaction-state`
  - `--route-phase`
- Avoid adding a heavy animation dependency for S15. CSS transitions and small inline SVG state changes are enough.
- Keep all feedback under 280ms except page transition affordances.

Acceptance:
- Clicking every top-nav route produces one consistent feedback cycle.
- Clicking the logo cycles seed -> plant -> tree -> seed.
- Reduced-motion users receive no transform-heavy animation.
- The implementation can be visually tested on homepage, notes, library, and resume routes.

### S15-T04 Homepage Explorable Essay

Goal: Rebuild homepage as an explorable knowledge surface.

Work:
- Remove oversized explanatory mock/stat blocks from the first viewport.
- Keep the first viewport focused on:
  - compact identity/offer line
  - growth-state logo
  - book-window preview
  - 3-5 handpicked hotlinks
- Defer `TopicConstellation` and `Knowledge Weather` to later lab/detail pages unless they prove visually necessary.
- Promote 3-5 keystone notes from content data, not only hard-coded cards.
- Add individually curated hotlinks for typical experience/knowledge posts.
- Add `Projects as Instruments`: project cards as tool/instrument panels showing tech, status, and linked themes.
- Add music player and lyric waveform as a local-only/static UI first; later audio can be configured.
- Add homepage theme color tuner that changes CSS variables locally.

Acceptance:
- Homepage first viewport communicates the knowledge system immediately.
- Each major visual unit is backed by repository data.
- No large explanatory mock area appears above the main content.
- No external audio, tracking, or hosted service is introduced.

### S15-T05 Generated Thematic Background Assets

Goal: Create controlled bitmap backgrounds per theme tag group.

Work:
- Use image generation for a small curated set of backgrounds:
  - systems / engineering / cognition / planning / language
- Store final project assets under `public/assets/generated/`.
- Reference them as optional low-opacity art layers on article pages.
- Keep CSS/data fallback when images are missing.

Initial asset:
- `public/assets/generated/scientific-garden-hero-seed.png`

Acceptance:
- Assets are saved in project, not only in the generator cache.
- Generated images contain no text/logos and do not overpower article readability.

### S15-T06 Open Library Cover Shelf

Goal: Turn the homepage/library books section into a visual bookshelf with cover art and dual actions.

Work:
- Extend `scripts/build-library-index.js` to add optional metadata:
  - `isbn`
  - `coverUrl`
  - `openLibraryUrl`
  - `openLibraryWorkKey`
  - `openLibraryEditionKey`
- Prefer cached/local metadata at build time; do not make client-side search calls for every book.
- Use Open Library cover URL patterns where safe.
- Render shelf cards with two actions:
  - `看原书/书目来源` to Open Library or local PDF if no external metadata
  - `看我的 annotator 笔记` to `/notes/${book.slug}/`

Acceptance:
- Coverless books have polished local fallbacks.
- Public pages include a courtesy link path when Open Library metadata is used.
- No mass crawling.

### S15-T07 Annotator PDF Deep Linking

Goal: Make annotation cards locate the corresponding PDF region more reliably.

Short-term:
- Preserve more Annotator selector metadata in `build-library-index.js`.
- Add `data-page`, `data-position-start`, `data-position-end` when available.
- Click priority:
  1. `#page=N&search="quote"`
  2. `#search="quote"`
  3. Scroll card and show a non-blocking “未精确定位” note

Long-term:
- Replace plain PDF iframe with PDF.js.
- Anchor Web Annotation selectors to the PDF.js text layer:
  - `TextQuoteSelector`
  - `TextPositionSelector`
  - prefix/suffix fallback
  - page/rect geometry if available

Acceptance:
- Current browser PDF flow improves without large dependency churn.
- PDF.js migration is planned as a separate reader subsystem, not mixed into the homepage redesign.

### S15-T08 Deck / Reveal / Admin Editing / Cloudflare Pipeline

Goal: Formalize the MD-to-slide delivery path.

Work:
- Treat `content/decks/*.md` as the primary source.
- Keep Reveal as historical compatibility/import path unless a concrete source exists.
- Extend `public/assets/decks/manifest.json` with:
  - `formats.html`
  - `formats.pdf`
  - `formats.pptx`
  - `content_hash`
  - `updated_at`
  - `build_log`
  - optional `cloudflare_url`
- Connect admin editor to:
  - `GET /source/file`
  - `POST /source/save`
  - deck rebuild
  - search index rebuild
- Keep Cloudflare Pages/R2 publication behind explicit L4 approval.

Acceptance:
- Local edit/save/rebuild loop is documented and testable.
- External deployment remains gated.

### S15-T09 Resume Redesign

Goal: Make resume more recruiter-efficient without losing structured source truth.

Work:
- Research-backed layout direction:
  - one-page dense PDF
  - clear target role
  - project bullets centered on impact, technical difficulty, and measurable results
  - skills grouped by job relevance
  - awards compressed
- Extend `resume.yaml` later with:
  - `role`
  - `impact`
  - `metrics`
- Update Typst template after data model is ready.

Acceptance:
- PDF remains ATS-safe and printable.
- Web resume keeps richer evidence links.

### S15-T10 Typst Document Lab

Goal: Split Typst into its own online/local document editing lab.

Work:
- Add route proposal: `/lab/typst`.
- MVP layout:
  - file selector
  - Typst source editor
  - PDF/PNG preview
  - build log
  - help sidebar deep-linking to Typst syntax docs
- Use existing local API save/build path first.

Acceptance:
- The page can preview `content/resume/template.typ` and `public/assets/resume.pdf`.
- It clearly distinguishes local build from cloud collaboration.

## Execution Order

1. Finish S15-T01 immediately.
2. Add theme taxonomy and global shell changes.
3. Build homepage explorable sections with real content data.
4. Add generated theme assets.
5. Upgrade library metadata and shelf.
6. Improve annotator short-term deep linking.
7. Plan PDF.js reader, deck pipeline, resume, and Typst lab as follow-on implementation batches.

## Current Known Risks

- Open Library search/cover matching may be weak for Chinese titles or Z-Library filenames. Use cached manual overrides.
- Browser PDF `#search` behavior is not consistent enough for precise academic annotation anchoring.
- Too many generated backgrounds can make the site feel generic unless each is tied to a theme taxonomy.
- Adding D3/animation dependencies too early may hurt the static-first posture.
- Cloudflare and remote publishing remain external writes and require explicit approval.
