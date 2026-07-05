# S16 Visual Quality And Acceptance Testing Sprint

**Date:** 2026-07-04
**Status:** Draft
**Intent:** Build a complete test design for the S15 explorable knowledge surface so visual changes, interaction motion, content pipelines, and public safety can be verified before release.

## Source Signals

- S15 changes are visual-heavy: homepage, navigation, dynamic logo, cursor feedback, Canvas fidelity, book shelf, annotator links, deck pipeline, resume, and Typst lab.
- Existing QA foundation already uses V-model structure under `tests/v-model`, Node test files under `tests/*.test.js`, Playwright scripts, and `npm run verify`.
- The next quality gap is not only more tests; it is a full gate system that combines white-box, black-box, smoke, top-down integration, visual screenshot review, regression, and acceptance testing.

## Testing Principles

1. **Evidence over taste:** Visual approval needs screenshots, viewport notes, reduced-motion notes, and a short pass/fail reason.
2. **Data contract first:** Components that render books, notes, Canvas files, resume data, deck manifests, and theme taxonomy must be tested before screenshot polish.
3. **Public safety is a release blocker:** No private paths, real names where alias is required, API keys, source-only notes, or raw evidence files should enter public output.
4. **Motion must be optional:** Every logo, cursor, transition, graph, and canvas animation must have a reduced-motion path.
5. **Regression stays cheap:** High-signal smoke and screenshot routes run often; full visual review runs before merge/release.

## Test Matrix

| Layer | Type | Scope | Primary tools | Gate |
| --- | --- | --- | --- | --- |
| Requirements | Black-box acceptance | S15/S16 task criteria, privacy rules, release rules | PRD docs, `validate:prd` | Must pass before implementation complete |
| Unit | White-box | Theme taxonomy, library metadata, annotator selectors, deck manifest helpers, route state helpers | `node --test` | Must pass in every verify run |
| Component | White-box + visual spot checks | `SiteMark`, `SoftCursor`, `CanvasViewer`, `ExcalidrawViewer`, book shelf, resume cards, Typst lab shell | DOM assertions, Playwright component/page probes | Must pass before visual sign-off |
| Integration | Top-down + bottom-up | Build assets -> pages -> public output; admin save -> rebuild -> preview; deck md -> html/pdf/pptx manifest | build scripts, local API, Playwright | Must pass before release candidate |
| System | Black-box | Homepage, notes, library, canvas, graph, decks, resume, admin, Typst lab | Playwright E2E, HTTP smoke | Must pass before release |
| Visual regression | Screenshot review | Desktop/mobile/tablet, light/dark or theme variants, reduced motion | Playwright screenshots, image diff later | Must pass manually first, automated later |
| Regression acceptance | Mixed | Previously fixed bugs and S11-S15 gates | `npm run verify`, curated route checklist | Must pass before merge/release |

## S16 Task Breakdown

### S16-T01 Test Inventory And Traceability

Goal: Make every S15 feature traceable to at least one verification method.

Work:
- Add a traceability table from S15 tasks to S16 tests.
- Mark each test as automated, manual, or future automation.
- Record required evidence artifacts:
  - command output
  - screenshot path
  - browser viewport
  - reduced-motion mode
  - known risk

Acceptance:
- Every S15 task has at least one unit/component/integration/system/visual test.
- No task relies on vague "looks good" acceptance only.

### S16-T02 White-Box Unit And Contract Tests

Goal: Protect data transformations and state machines before UI polish.

White-box targets:
- `src/lib/themeTaxonomy.ts`
  - tag-to-domain mapping
  - CSS variable generation
  - fallback domain behavior
- Canvas parser/renderer contracts
  - no synthetic `TEXT`, `FILE`, `LINK` labels in rendered cards
  - colors, arrows, edge labels, and group bounds preserved
- Library index builder
  - `isbn`, `coverUrl`, `openLibraryUrl`, local PDF fallback
  - coverless fallback metadata
  - "看原书/书目来源" and "看我的 annotator 笔记" targets
- Annotator selector extraction
  - page number
  - quote
  - position start/end
  - fallback link order
- Deck manifest builder
  - `formats.html`, `formats.pdf`, `formats.pptx`
  - `content_hash`
  - `updated_at`
  - `build_log`
- Resume source contract
  - alias-safe public identity
  - evidence links only where intended
- Interaction state helpers
  - logo cycles `seed -> plant -> tree -> seed`
  - route/click/focus events map to allowed states

Acceptance:
- New or updated `node:test` cases cover data contracts and fallback paths.
- Unit tests do not depend on network calls.
- Fixtures cover one Chinese book, one coverless book, one Canvas flow, and one deck.

### S16-T03 Black-Box Smoke Tests

Goal: Quickly prove the site is alive and the most important public routes render.

Smoke route set:
- `/`
- `/notes/`
- one note detail route
- one Canvas note route
- `/library/`
- `/projects/`
- one project detail route
- `/resume/`
- `/decks/`
- `/lab/graph`
- `/lab/canvas`
- `/admin`
- future `/lab/typst`

Checks:
- HTTP 200 or expected static route response.
- Page title exists and does not expose unwanted real-name strings.
- Main landmark or primary content exists.
- No visible raw frontmatter, JSON dumps, stack traces, or placeholder mock wall.
- Critical assets load without console errors.

Acceptance:
- Smoke suite can run against local dev and production preview.
- Failure output includes route, selector, console error summary, and screenshot.

### S16-T04 Top-Down Integration Tests

Goal: Verify user-facing journeys from the public shell downward into components and generated data.

Journeys:
- Home -> hotlink note -> related project -> back to home.
- Home -> book shelf -> original/source link -> annotator note.
- Note list -> Canvas note -> pan/zoom -> verify colored cards and arrows.
- Header nav -> route transition -> logo tree pulse -> reduced-motion fallback.
- Resume page -> PDF asset -> evidence-safe web sections.
- Deck list -> deck detail/static slide preview -> manifest formats.
- Typst lab -> source preview shell -> build log display.

Acceptance:
- Each journey is tested from the route level first, then verifies component-level selectors.
- Integration does not require external writes or Cloudflare deployment.
- Top-down failures are mapped back to component/data owner tasks.

### S16-T05 Bottom-Up Integration Tests

Goal: Verify generated assets and manifests before pages consume them.

Pipelines:
- `content/notes` -> search index -> notes pages.
- Canvas/Excalidraw source -> preview manifest -> viewer.
- `content/decks/*.md` -> deck manifest -> static slide output.
- `content/resume/resume.yaml` -> `public/assets/resume.json` -> PDF/web resume.
- book notes/PDF assets -> `public/assets/library.json` -> shelf UI.
- semantic graph data -> graph/lab routes.

Acceptance:
- Generated JSON assets have schema tests.
- Public output sanitizer runs after build.
- Tests catch dangling graph edges, duplicate deck slugs, missing book actions, and unsafe public strings.

### S16-T06 Visual Screenshot Review

Goal: Make visual quality auditable instead of memory-based.

Viewport matrix:
- Mobile: `390x844`
- Tablet: `768x1024`
- Desktop: `1440x900`
- Wide desktop: `1920x1080`

Screenshot targets:
- Homepage first viewport.
- Header/nav/logo hover state.
- Header/nav/logo clicked `tree` state.
- Homepage book-window shelf.
- Library shelf full page.
- Canvas viewer with arrows/colors/groups.
- Note article with generated theme background.
- Resume web page.
- Deck index and one deck preview.
- Typst lab shell.
- Admin dashboard.
- Reduced-motion homepage and Canvas route.

Visual assertions:
- No overflowing text in book cards, nav items, buttons, or Canvas cards.
- No giant mock-data explanation block above the first meaningful content.
- Logo has stable dimensions across states.
- Cursor does not obscure text or buttons.
- Generated backgrounds are low contrast enough for reading.
- Canvas no longer shows node type labels.
- Book shelf reads like a shelf/window, not isolated pastel cards.
- Header remains usable on mobile.
- Focus rings are visible and not clipped.

Evidence format:
- Store local screenshots under `sense/reports/visual-snapshots/<date>/`.
- Include `index.md` with viewport, route, pass/fail, defect IDs, and notes.

Acceptance:
- A visual review report exists for every release candidate.
- Any P0/P1 visual issue blocks release.
- P2 issues require explicit acceptance notes.

### S16-T07 Regression And Release Acceptance

Goal: Prevent S15 visual work from breaking old guarantees.

Regression checklist:
- `npm run validate:prd`
- `npm run validate:pipeline`
- `npm test`
- `npm run build`
- HTTP smoke against preview.
- Public output privacy scan.
- Feed/sitemap/search index still generated.
- Resume PDF still builds.
- Semantic graph still has no dangling edges.
- Canvas/Excalidraw viewers still load existing preview manifests.

Acceptance gates:
- P0: privacy leak, build fail, public route crash, data loss, unsafe external write.
- P1: unreadable first viewport, broken primary nav, broken book shelf actions, broken resume/deck/library route.
- P2: visual overflow, weak responsive layout, missing screenshot evidence, non-critical console error.
- P3: copy polish, minor spacing, optional animation refinement.

Release acceptance:
- P0/P1 count is zero.
- P2 items either fixed or explicitly deferred with owner and deadline.
- Screenshot report, command log, and known-risk note are attached to the release report.

### S16-T08 Accessibility And Motion Acceptance

Goal: Keep the site expressive without excluding keyboard, touch, or reduced-motion users.

Checks:
- Keyboard can reach nav, logo, hotlinks, book actions, Canvas controls, player controls, color tuner, deck controls, and Typst editor actions.
- Focus order follows visual order.
- `prefers-reduced-motion: reduce` disables custom cursor transforms and heavy logo/path animations.
- Touch devices use tap feedback instead of custom cursor.
- Color contrast stays readable over generated backgrounds.
- Canvas and graph routes provide text alternatives or summaries where possible.

Acceptance:
- Reduced-motion screenshots are included for homepage and one interactive route.
- Keyboard-only smoke passes across public primary routes.
- No interaction is mouse-only.

### S16-T09 Defect Workflow And Ownership

Goal: Make visual/testing defects actionable.

Defect fields:
- ID
- severity `P0-P3`
- route/component
- viewport
- reproduction steps
- expected result
- actual result
- screenshot path
- suspected layer: data, component, CSS, generated asset, pipeline, external dependency
- owner
- fix status
- regression test added

Acceptance:
- Every failed visual review item has a defect record.
- Every P0/P1 fix gets at least one regression test or checklist entry.

## Traceability From S15

| S15 task | Required S16 coverage |
| --- | --- |
| S15-T01 Canvas Viewer Fidelity Fix | Unit contract for label removal; visual screenshot for arrows/colors/groups; E2E pan/zoom smoke |
| S15-T02 Data-Driven Visual Taxonomy | Unit tests for tag mapping; screenshot for note theme backgrounds |
| S15-T03 Navigation, Logo, Cursor, Motion | State-machine unit tests; Playwright hover/click/focus; reduced-motion screenshot |
| S15-T03A Route/Click/Cursor Feedback | Top-down route integration; click feedback assertion; keyboard focus acceptance |
| S15-T04 Homepage Explorable Essay | Screenshot first viewport; black-box check for no mock wall; hotlink journey |
| S15-T05 Generated Background Assets | Asset existence/fallback tests; readability visual review |
| S15-T06 Open Library Cover Shelf | Library builder unit tests; shelf visual screenshots; dual-action E2E |
| S15-T07 Annotator PDF Deep Linking | Selector contract tests; source -> annotator journey; fallback behavior acceptance |
| S15-T08 Deck/Reveal/Admin/Cloudflare Pipeline | Manifest tests; local admin edit/rebuild integration; no external write without L4 gate |
| S15-T09 Resume Redesign | Resume schema tests; PDF/web visual review; public identity/privacy scan |
| S15-T10 Typst Document Lab | Route smoke; editor/preview/build-log integration; docs link checks |

## Execution Order

1. Add traceability and test fixture inventory.
2. Write white-box unit/contract tests for data and state helpers.
3. Extend smoke tests for S15/S16 routes.
4. Add top-down integration journeys.
5. Add bottom-up pipeline/schema tests.
6. Add screenshot capture script and visual report template.
7. Run full regression and release acceptance.

## Initial Commands

```bash
npm run validate:prd
npm run validate:pipeline
npm test
npm run build
```

Future automation commands:

```bash
npm run test:smoke
npm run test:visual
npm run test:a11y
npm run test:acceptance
```

## Non-Goals

- Do not introduce external deployment or Cloudflare write actions in testing.
- Do not make visual tests brittle by comparing every pixel before the design stabilizes.
- Do not require Figma, Rive, or image-generation services at runtime.
- Do not block local iteration on full visual regression; reserve full gate for release candidates.

## Known Risks

- Current Playwright scripts use hard-coded local ports and artifact paths; S16 should normalize these.
- Visual diffs can be noisy because fonts, antialiasing, and animation timing differ by environment.
- Browser PDF deep-link behavior varies, so annotator acceptance needs fallback assertions.
- Generated backgrounds can pass asset tests while still harming readability; screenshots remain mandatory.
