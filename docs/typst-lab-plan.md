# Typst Lab Plan

## Product Goal

`/lab/typst` is a lightweight online document editing lab for `caolei/githoldder`. It provides a focused authoring surface for Typst documents, starting with the resume pipeline and later expanding to reports, certificates, slide handouts, and article PDFs.

The MVP is local-first:

- Edit approved source files.
- Save through the local API.
- Trigger a deterministic local build.
- Preview the generated PDF.
- Link to Typst syntax help.
- Keep Cloudflare publishing behind a separate approval gate.

## Competitor-Informed Direction

Typst Lab should borrow the working model of Overleaf without copying LaTeX-specific complexity:

- Project/file tree on the left.
- Source editor in the middle.
- PDF preview and compile log on the right.
- Explicit compile action, visible errors, and no loss of unsaved edits.
- Project upload/import later, but only into approved roots.
- Git/remote sync later, after local write gates are safe.

Typst's own docs and web app establish the right mental model for syntax help, package/template discovery, preview/export, folders, and project search. The local site should link to official Typst documentation instead of mirroring it.

## Route

```text
/lab/typst
```

The page should be separate from the resume page. Resume is a public artifact; Typst Lab is a working environment.

## MVP Layout

Desktop:

```text
┌──────────────┬─────────────────────────┬─────────────────────────┐
│ File list    │ Typst / YAML editor     │ PDF preview             │
│ Build status │ Error gutter            │ Help / export controls  │
└──────────────┴─────────────────────────┴─────────────────────────┘
```

Mobile:

```text
Tabs: Files | Editor | Preview | Help
```

Required panels:

- **Files**: approved Typst/YAML sources.
- **Editor**: CodeMirror 6 editor for Markdown/Typst/YAML ergonomics; plain textarea is acceptable only for the first read-only prototype.
- **Preview**: iframe or PDF.js for `public/assets/resume.pdf`.
- **Build Log**: latest command status and error text.
- **Help**: links to Typst docs.

## Approved Source Roots

MVP editable files:

```text
content/resume/resume.yaml
content/resume/template.typ
```

Future editable files:

```text
content/typst/*.typ
content/typst/*.yaml
content/decks/*.md
```

The page must not expose arbitrary file writes.

## API Flow

Read file tree:

```http
GET /source/tree
```

Read source:

```http
GET /source/file?path=content/resume/template.typ
```

Save source:

```http
POST /source/save
content-type: application/json

{
  "path": "content/resume/template.typ",
  "text": "#set page(...)\n..."
}
```

Expected response:

```json
{
  "success": true,
  "message": "File saved and resume successfully compiled.",
  "path": "content/resume/template.typ"
}
```

After save:

1. Reload `public/assets/resume.json` if the YAML changed.
2. Reload `public/assets/resume.pdf` with a cache-busting query.
3. Display build message.
4. Keep editor contents intact if compilation fails.

## Help Links

The help panel should include direct links:

- Typst syntax: `https://typst.app/docs/reference/syntax/`
- Typst functions: `https://typst.app/docs/reference/`
- Typst text: `https://typst.app/docs/reference/text/`
- Typst layout: `https://typst.app/docs/reference/layout/`

Use normal external links. Do not mirror the documentation content into the repo.

## Export Controls

MVP controls:

- Rebuild
- Download PDF
- Download JSON
- Open public resume page

Future controls:

- Export PNG pages.
- Export SVG.
- Create a named document template.
- Import a small project archive into `content/typst/`.
- Insert approved media assets from `public/assets/media/manifest.json`.
- Publish to Cloudflare after an explicit approval gate.

## Cloudflare Gate

`/lab/typst` may prepare local outputs, but must not publish directly.

Required publishing sequence:

1. Save source locally.
2. Build locally.
3. Run validation.
4. Show dry-run diff.
5. Require explicit publish approval.
6. Update Cloudflare Pages or R2.
7. Record published URLs in a manifest.

Suggested command shape:

```bash
npm run publish:cloudflare -- --dry-run
npm run publish:cloudflare -- --approve
```

## Visual Direction

The lab should feel like a document instrument, not a marketing page:

- Dense, calm, work-focused layout.
- Stable panes with no jumpy resizing.
- Small status indicators.
- Monospace editor.
- High-contrast error lines.
- Public labels use `caolei` or `githoldder`.

## Acceptance Criteria

1. `/lab/typst` opens with a file list, editor, preview, and help panel.
2. Editing `template.typ` and saving calls `/source/save`.
3. Successful builds refresh the PDF preview.
4. Failed builds keep the edited text and show build errors.
5. Help links open official Typst docs.
6. The page has no Cloudflare publish button until the publish gate exists.
7. No public UI copy displays the author's legal name.

## Implementation Order

1. Add a read-only `/lab/typst` page wired to existing PDF/JSON assets.
2. Connect source reads through `GET /source/file`.
3. Connect saves through `POST /source/save`.
4. Add build log capture and display.
5. Add editor error annotations.
6. Add template selection.
7. Add gated publish dry-run.

## S17 Alignment

This plan is implemented under `docs/S17-content-studio-and-wiki-sprint.md` as S17-T06.

Dependencies:

- S17-T01 source studio boundary.
- S17-T02 media upload and asset manifest for image insertion.
- S17-T10 QA gates for compile, preview, and identity leakage.
