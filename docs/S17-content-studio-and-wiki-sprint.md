# S17 Content Studio, Deck Publish, Typst Lab, and Wiki Knowledge Sprint

## Decision Summary

The requested capabilities are feasible, but they should be implemented as a local-first content studio rather than as a cloned SaaS editor.

- Media upload: yes. Add a local API endpoint that accepts images, audio, and video into an approved media root, writes an asset manifest, and makes assets selectable from note, deck, and Typst editors.
- Online text editing: yes. Expand the existing `/source/tree`, `/source/file`, and `/source/save` local API into a real editor UI with approved roots only.
- PPTX export: yes, but the high-fidelity macOS path must use local Keynote where PPTX fidelity matters. Generated decks can keep a lower-fidelity fallback for CI and machines without Keynote.
- PDF export: yes. Deck PDFs should use Slidev/Playwright print for Markdown decks; Typst PDFs should use `typst compile`; imported PPTX-to-PDF should use Keynote on the local Mac.
- Public publishing: yes. It must remain an explicit L4 operation, with a dry-run manifest before `wrangler pages deploy` or R2 upload.
- Typst Lab: yes. It should follow an Overleaf-like project tree, editor, compile log, preview, and help model, but keep Typst as the primary compiler.
- Knowledge wiki: yes. The note library should be promoted from a blog list to a Wiki.js-like knowledge graph with backlinks, tags, fuzzy search, hotlinks, and topic-specific reading surfaces.

## What Is Still Unfinished

1. The smoke and visual screenshot scripts exist, but the local Python Playwright driver is missing, so real screenshot evidence is not produced yet.
2. The Keynote conversion path exists only as a build-time attempt and currently warns in restricted GUI contexts; it needs an explicit local adapter and permission checklist.
3. Deck PDF/PPTX outputs are represented in manifests, but the export jobs are not fully implemented.
4. There is no media upload endpoint, MIME validation, asset manifest, or media picker.
5. `/lab/typst` is defined in docs, but the route and editor UI are not implemented.
6. `/source/save` is API-level editing, not yet a polished admin text editor.
7. Cloudflare publish remains a documented gate, not an implemented dry-run/approve command.
8. Search is still mostly static full-text filtering; it lacks fuzzy ranking, backlinks, hotlink graph traversal, and topic-aware entry points.
9. Topic backgrounds and article-specific visual systems are not yet generated, selected, rotated, or tested.

## Competitor Research

### Canva / Canva 可画

Observed product pattern:

- Canva treats uploaded media as managed assets. Its Connect asset API supports asynchronous asset upload jobs, image/video metadata, tagging, update, and delete operations.
- Canva treats export as an asynchronous job. Its export API supports common share/delivery formats such as PDF, image exports, PPTX, and video where the design type allows it.

Implication for this site:

- Do not build a generic Canva clone in the browser.
- Copy the architecture: asset jobs, export jobs, and publish jobs.
- The local editor should be source-first, with a media library and deterministic outputs.

### Gamma

Observed product pattern:

- Gamma focuses on turning prompts and existing material into structured presentations, documents, and web pages.
- Its strength is rapid outline-to-visual transformation and web-native sharing, not fine-grained local source ownership.

Implication for this site:

- Use AI assistance later for outline restructuring and background/image ideation.
- Keep Markdown/Typst source as the durable truth.
- Add a "transform note to deck/article surface" workflow after the export and media systems are reliable.

### Overleaf

Observed product pattern:

- Overleaf is a project-based editor: source files, images, bibliographies, compile button, PDF viewer, syntax checks, logs, project upload, and Git/GitHub synchronization.
- It allows whole-project uploads and shows compile errors instead of hiding the source-build boundary.

Implication for this site:

- Typst Lab should not be a single textarea.
- It needs project roots, file tree, editor, preview, compile log, main document selection, and source-preserving save behavior.

### Typst

Observed product pattern:

- Typst is a markup-based typesetting system with reference docs covering syntax, text, layout, math, data loading, PDF/HTML/PNG/SVG export, and a web app with projects, folders, preview/export, search, and Git sync.

Implication for this site:

- Keep Typst for resume and document PDFs.
- Link to official Typst syntax/reference docs instead of mirroring them.
- Treat Typst documents as first-class content studio projects alongside decks.

### Wiki.js

Observed product pattern:

- Wiki.js exposes the expected knowledge-base primitives: pages, folder structure, tags, editors, assets, rendering, search engines, storage sync, themes, comments, and extensibility.

Implication for this site:

- The note library should become a knowledge surface, not only a chronological blog.
- Build static indexes that provide backlinks, forward links, tag co-occurrence, aliases, topic clusters, hotlinks, and asset references.

## Technical Selection Review

| Capability | Selected path | Why | Deferred alternatives |
| --- | --- | --- | --- |
| Text editor | CodeMirror 6 in local admin routes | Good Markdown/Typst ergonomics, lighter than Monaco, enough for source files | Monaco if LSP-heavy editing becomes important |
| Media upload | Local API `POST /media/upload` + manifest | Fits existing local API and static build model | Direct Cloudflare upload later after auth is hardened |
| Image/audio/video storage | `content/media/**` source + generated `public/assets/media/**` | Keeps source assets versionable and public assets deterministic | R2 direct storage for large published media |
| Deck authoring | Slidev Markdown primary | Existing source format, good HTML/PDF path | Reveal compatibility import, raw HTML compatibility |
| PPTX export | Local Keynote adapter as authoritative high-fidelity path | User requires Keynote and it handles Office fidelity better on macOS | PptxGenJS generated decks; PDF-page-to-PPTX fallback |
| PDF export | Slidev/Playwright for decks; Typst CLI for documents; Keynote for PPTX import | Best fit per source type | LibreOffice only as low-priority fallback |
| Publish | `npm run publish:cloudflare -- --dry-run` then `--approve` | Matches L4 approval policy and Cloudflare Pages direct upload | Automatic publish from browser is out of scope |
| Large media | Cloudflare R2 after approval | R2 is designed for unstructured data and public buckets | Bundle everything into Pages, only for small assets |
| Knowledge search | Static wiki/search index + MiniSearch or Fuse.js | Works with Astro static output and offline browsing | Server-side search engine later |
| Backlinks/hotlinks | Build-time graph from wikilinks, Markdown links, tags, headings, citations | Deterministic and testable | LLM-only semantic links are advisory, not source of truth |
| Topic backgrounds | Per-topic manifest with generated assets and contrast metadata | Avoids one-theme fatigue and supports visual QA | Runtime random image generation is out of scope |

## Architecture

```text
content/
  notes/                 # Markdown notes and blogs
  decks/                 # Slidev Markdown decks
  typst/                 # Future Typst docs
  resume/                # Resume YAML and Typst template
  media/                 # Source uploads: image/audio/video

public/assets/
  media/manifest.json    # Generated asset index
  decks/manifest.json    # Deck build/export/publish index
  wiki/graph.json        # Backlinks, outgoing links, tags, hotlinks
  wiki/search.json       # Fuzzy search index
  themes/backgrounds.json

server/local-api.js
  GET  /source/tree
  GET  /source/file
  POST /source/save
  POST /media/upload
  POST /jobs/deck-export
  POST /jobs/typst-compile
  POST /jobs/publish-dry-run
```

All write endpoints are local-only until auth and approval gates are implemented.

## Sprint Tasks

### S17-T01 Source Studio Boundary

Define approved editable roots and file types for notes, decks, Typst, resume, and media.

Acceptance:

- `/source/tree` returns grouped roots, not arbitrary repository files.
- Tests reject path traversal, hidden files, binary files in text endpoints, and public identity leaks.

### S17-T02 Media Upload And Asset Manifest

Implement local media upload for images, audio, and video.

Acceptance:

- Uploads validate MIME type, extension, size, and target directory.
- Asset manifest records id, title, type, source path, public path, dimensions/duration when available, tags, created time, and content hash.
- Media picker can insert Markdown image/audio/video references.

### S17-T03 Deck Editor And Export Jobs

Build a deck studio for editing `content/decks/*.md` with preview, build log, PDF export, PPTX export request, and manifest refresh.

Acceptance:

- Save triggers deck build and search rebuild.
- Failed builds keep source text and show logs.
- Export status is visible in `public/assets/decks/manifest.json`.

### S17-T04 Keynote Adapter

Create a macOS-only Keynote adapter for PPTX import/export and PPTX-to-PDF conversion.

Acceptance:

- Adapter performs an environment check for Keynote, GUI session, and automation permission.
- Keynote operations are never triggered by public pages.
- Errors are captured into build logs with remediation text.

### S17-T05 Cloudflare Publish Gate

Implement dry-run and approve commands for public deployment.

Acceptance:

- Dry run lists changed HTML, PDF, PPTX, image, audio, video, and manifest keys.
- Approval requires passing build, PRD validation, and no private identifiers.
- Pages deployment uses Wrangler; large assets can be routed to R2 after approval.

### S17-T06 Typst Lab MVP

Build `/lab/typst` as an Overleaf-inspired Typst editor.

Acceptance:

- File tree, editor, PDF preview, build log, help links, and export controls render.
- Typst syntax docs are linked.
- Save and compile use local API jobs.
- Compilation errors are shown without losing edits.

### S17-T07 Wiki Graph, Backlinks, And Fuzzy Search

Promote the note library into a Wiki.js-like knowledge surface.

Acceptance:

- Build script extracts title, aliases, tags, headings, wikilinks, Markdown links, outgoing links, backlinks, and tag co-occurrence.
- Search supports title, tag, summary, body, alias, and fuzzy matching.
- Note pages show backlinks, related notes, and topic hotlinks.

### S17-T08 Topic Background And Reading Surface System

Create topic-level visual manifests and article reading variants.

Acceptance:

- Each major tag can define 3-5 background candidates, palette tokens, and interaction rules.
- Homepage rotates topic visuals without repeating the same visual family too often.
- Article pages can select different reading modes for technical blog, wiki note, book note, project log, and deck summary.

### S17-T09 Homepage Knowledge Hotlinks

Replace broad mock copy with permanent, useful entry points.

Acceptance:

- Homepage features handpicked technical blogs, knowledge systems, wiki clusters, deck links, book notes, and recent edits.
- Hotlinks are backed by generated indexes, not manual placeholder cards.

### S17-T10 QA And Security Gates

Extend S16 tests for upload, export, publish, and wiki graph behavior.

Acceptance:

- Unit tests cover parsers and manifests.
- Integration tests cover save -> build -> manifest -> page render.
- Smoke tests cover home, search, note, deck, Typst Lab, and media routes.
- Visual tests compare homepage, book shelf, deck studio, Typst Lab, and topic reading pages.
- Regression tests assert no legal-name leakage and no `TEXT` canvas labels.

## Test Contract Matrix

| Area | Minimum contract | Test entry |
| --- | --- | --- |
| Sprint scope | S17 document exists and enumerates S17-T01 through S17-T10 | `tests/s17-content-studio-contracts.test.js` |
| Source studio | Local API tree stays inside approved roots and path traversal cannot read outside the project | `tests/s17-content-studio-contracts.test.js` |
| Media | Upload endpoint, MIME/extension/size checks, and `public/assets/media/manifest.json` schema are documented before implementation and validated when present | `tests/s17-content-studio-contracts.test.js` |
| Deck/publish | Deck manifest exposes deterministic HTML/PDF/PPTX paths, content hashes, build logs, and publish records remain whitelisted | `tests/s17-content-studio-contracts.test.js` |
| Typst Lab | `/lab/typst` and compile job contracts are documented now; route source is schema-checked when implemented | `tests/s17-content-studio-contracts.test.js` |
| Wiki | `public/assets/wiki/graph.json` and `search.json` contracts are documented now; node/search schemas are checked when implemented | `tests/s17-content-studio-contracts.test.js` |
| Identity | Public-facing generated assets and route source do not expose the Chinese legal name | `tests/s17-content-studio-contracts.test.js` |

## RICE Priority

| Task | Reach | Impact | Confidence | Effort | Priority |
| --- | ---: | ---: | ---: | ---: | --- |
| S17-T07 Wiki graph/search | 3 | 3 | 0.8 | 2 | Highest |
| S17-T06 Typst Lab MVP | 2 | 3 | 0.8 | 2 | High |
| S17-T02 Media upload | 2 | 2 | 0.8 | 1 | High |
| S17-T03 Deck editor/export | 2 | 3 | 0.7 | 3 | High |
| S17-T04 Keynote adapter | 1 | 3 | 0.6 | 2 | Medium |
| S17-T08 Topic backgrounds | 3 | 2 | 0.7 | 3 | Medium |
| S17-T05 Cloudflare publish | 1 | 3 | 0.7 | 3 | Medium |

## Next Implementation Order

1. Fix Playwright driver or switch the visual scripts to the repo Node Playwright runtime so S16 screenshots become real evidence.
2. Implement S17-T07 first, because the homepage, search, topic backgrounds, and hotlinks all need a stronger note graph.
3. Implement S17-T02 media upload before visual background generation.
4. Implement S17-T06 Typst Lab and S17-T03 Deck Studio in parallel.
5. Implement S17-T04 Keynote adapter and S17-T05 Cloudflare publish only behind explicit local approval.

## Sources

- Canva Connect Assets: https://www.canva.dev/docs/connect/api-reference/assets/
- Canva Connect Exports: https://www.canva.dev/docs/connect/api-reference/exports/
- Gamma official site: https://gamma.app/
- Overleaf recompiling docs: https://docs.overleaf.com/getting-started/recompiling-your-project
- Overleaf upload docs: https://docs.overleaf.com/managing-projects-and-files/uploading-a-project
- Typst docs: https://typst.app/docs/
- Typst syntax reference: https://typst.app/docs/reference/syntax/
- Wiki.js docs: https://docs.requarks.io/
- Cloudflare Pages direct upload: https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- Cloudflare R2: https://developers.cloudflare.com/r2/
