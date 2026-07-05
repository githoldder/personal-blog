# Deck Pipeline

## Purpose

The deck pipeline turns presentation source files into static assets that can be browsed locally, exported for offline delivery, and published through a gated Cloudflare flow.

The source-of-truth format is Markdown under `content/decks/*.md`. Slidev is the primary rendering engine. Reveal and raw HTML are treated as import or compatibility formats, not the preferred authoring surface for new decks.

Public-facing labels must use `caolei` or `githoldder`. Do not render the author's legal name in generated slide viewers, metadata, or download headers unless a private resume artifact explicitly requires it.

## Source Layout

```text
content/decks/
  <slug>.md                 # canonical deck source
  public/                   # optional deck-local static assets
public/slides/<slug>/       # generated HTML slide site
public/assets/decks/manifest.json
public/assets/<slug>.pdf    # planned export target
public/assets/<slug>.pptx   # planned export target
```

Each deck source must include YAML frontmatter:

```yaml
---
title: "Knowledge System Roadmap"
date: 2026-06-26
slug: knowledge-system-roadmap
format: slidev
status: draft
---
```

Required fields:

- `title`: Human-readable deck title.
- `date`: Deck date in `YYYY-MM-DD` form.

Recommended fields:

- `slug`: Stable URL and output slug. Defaults to the filename without `.md`.
- `format`: `slidev`, `reveal`, `html`, or `pptx-import`; defaults to `slidev`.
- `status`: `draft`, `review`, or `published`.
- `summary`: One sentence for the admin list and deck index.
- `tags`: Topic tags for homepage and search surfaces.

## Current Build Behavior

Run:

```bash
npm run build:decks
```

The script scans `content/decks/*.md`, validates frontmatter, and writes:

```text
public/assets/decks/manifest.json
```

Current manifest fields:

- `slug`
- `title`
- `date`
- `sourcePath`
- `outputs.html`
- `outputs.pdf`
- `build.status`
- `build.requires`
- `build.notes`

If a global `slidev` CLI is available, the script also runs:

```bash
slidev build "<source>" --out "public/slides/<slug>" --base "/slides/<slug>/"
```

If `slidev` is missing, the manifest is still generated and the deck remains buildable later. This keeps local editing usable on machines that do not have the full presentation toolchain installed.

## Target Build Matrix

| Source | HTML preview | PDF export | PPTX export | Status |
| --- | --- | --- | --- | --- |
| Slidev Markdown | `slidev build` | `slidev export` or Playwright print | Local Keynote adapter when fidelity is required; PDF-to-PPTX fallback for CI | Primary path |
| Reveal Markdown | Import to Slidev-compatible MD, or keep as legacy HTML | Playwright print | PDF-to-PPTX fallback | Compatibility path |
| Raw HTML | Static copy with sandboxed assets | Playwright print | PDF-to-PPTX fallback | Compatibility path |
| PPTX import | Convert to PDF first, then wrap in viewer | Local Keynote export | Original PPTX retained | Resume/demo path |

PDF-to-PPTX fallback should create one slide per rendered PDF page. This is visually stable and useful for venues that require PPTX, even though text remains image-based.

## Competitor-Informed Direction

Canva and Gamma should be used as product references, not as implementation dependencies.

- Canva's useful pattern is the separation between uploaded assets, export jobs, and publishable outputs. The site should copy that model: a media library, a deck export queue, and a publish manifest.
- Gamma's useful pattern is fast transformation from source material into shareable decks/pages. The site should eventually provide "note to deck" and "note to reading surface" workflows, but Markdown remains the source of truth.
- The deck editor must not become a generic design canvas. It should be a source-first presentation studio with preview, media picker, build log, PDF export, PPTX export, and publish status.

## Keynote Requirement

High-fidelity PPTX work on this Mac should use local Keynote.

Required adapter behavior:

1. Detect whether Keynote is installed.
2. Detect whether the command is running in a GUI session that can drive AppleScript/JXA.
3. Verify macOS automation permission before trying conversion.
4. Convert imported PPTX to PDF through Keynote when possible.
5. Export generated or imported deck artifacts through Keynote when PPTX fidelity is required.
6. Record every failure in the deck build log with a human-readable remediation note.

Browser-triggered saves must not run Keynote directly. The browser can request an export job, but the local approved adapter performs the GUI action.

## Media Upload And Deck Assets

Deck sources may reference images, audio, and video from the shared media manifest:

```text
content/media/
public/assets/media/
public/assets/media/manifest.json
```

The deck editor should provide a media picker that inserts Markdown references. Uploaded files must pass MIME, extension, size, and path checks before being copied into the source media root.

## Manifest v2 Target

Extend `public/assets/decks/manifest.json` to include deterministic output metadata:

```json
{
  "schema_version": 2,
  "generated_by": "scripts/build-decks.js",
  "decks": [
    {
      "slug": "knowledge-system-roadmap",
      "title": "Knowledge System Roadmap",
      "date": "2026-06-26",
      "status": "published",
      "sourcePath": "content/decks/knowledge-system-roadmap.md",
      "content_hash": "sha256:...",
      "updated_at": "2026-07-04T00:00:00.000Z",
      "formats": {
        "html": {
          "path": "public/slides/knowledge-system-roadmap/",
          "url": "/slides/knowledge-system-roadmap/"
        },
        "pdf": {
          "path": "public/assets/knowledge-system-roadmap.pdf",
          "url": "/assets/knowledge-system-roadmap.pdf"
        },
        "pptx": {
          "path": "public/assets/knowledge-system-roadmap.pptx",
          "url": "/assets/knowledge-system-roadmap.pptx"
        }
      },
      "build": {
        "status": "success",
        "engine": "slidev",
        "log": "public/assets/decks/knowledge-system-roadmap.build.log"
      },
      "publish": {
        "cloudflare_status": "local-only",
        "cloudflare_url": null,
        "r2_keys": []
      }
    }
  ]
}
```

## Admin Save Flow

The local API already exposes file reads and writes for the admin console:

- `GET /source/tree`
- `GET /source/file?path=content/decks/<slug>.md`
- `POST /source/save`

Save payload:

```json
{
  "path": "content/decks/knowledge-system-roadmap.md",
  "text": "---\ntitle: Knowledge System Roadmap\n..."
}
```

When `path` starts with `content/decks/`, `server/local-api.js` currently runs:

```bash
node scripts/build-decks.js
node scripts/build-search-index.js
```

MVP admin behavior:

1. File tree lists `content/decks/*.md`.
2. Editor saves Markdown via `/source/save`.
3. API returns `{ success, message, path }`.
4. UI reloads `public/assets/decks/manifest.json`.
5. UI shows latest local preview at `/slides/<slug>/` when `build.status === "success"`.
6. UI shows build logs and keeps the Markdown editable when the build fails.

## Cloudflare Gating

Cloudflare deployment is an external write action and must never run implicitly from a browser save.

Use a two-stage gate:

1. **Local gate**: `/source/save` may rebuild local files only.
2. **Publish gate**: deployment to Cloudflare Pages or upload to R2 requires an explicit human-approved command.

Recommended command surface:

```bash
npm run build
npm run publish:cloudflare -- --dry-run
npm run publish:cloudflare -- --approve
```

Policy:

- `--dry-run` lists changed HTML, PDF, PPTX, and asset keys.
- `--approve` requires a clean build and explicit operator confirmation.
- Large deck assets go to R2; Astro HTML and lightweight assets go to Pages.
- The manifest records the last published URL and content hash only after a successful publish.

## Implementation Tasks

1. Add manifest v2 fields without breaking existing readers.
2. Add PDF export for Slidev decks.
3. Add PPTX fallback from PDF pages.
4. Replace hard-coded resume presentation viewer labels with `caolei` or `githoldder`.
5. Surface deck build logs in the admin console.
6. Add Cloudflare dry-run and approved publish scripts.
7. Add media picker support for deck-local and shared assets.
8. Add the local Keynote adapter as the authoritative high-fidelity PPTX path.
