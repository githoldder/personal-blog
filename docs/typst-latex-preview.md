# Typst and LaTeX Preview

## Purpose

This document defines how local Typst and LaTeX sources are previewed inside the personal knowledge site without turning the browser into an unsafe compiler.

Typst is the default live-preview target for resume and document experiments. LaTeX files are preserved as references and may be compiled later through a controlled adapter.

Public-facing author labels should use `caolei` or `githoldder`.

## Typst Preview

Current source files:

```text
content/resume/resume.yaml
content/resume/template.typ
```

Current command:

```bash
npm run build:resume
```

Current outputs:

```text
public/assets/resume.json
public/assets/resume.pdf
```

Preview behavior:

1. Admin editor saves `resume.yaml` or `template.typ` through `/source/save`.
2. `server/local-api.js` triggers `node scripts/build-resume.js`.
3. The build script validates YAML and writes JSON.
4. If `typst` exists locally, it compiles the PDF.
5. The preview panel reloads `/assets/resume.pdf`.

If Typst is unavailable:

- Keep YAML/JSON validation working.
- Show a non-blocking warning.
- Keep the last successful PDF visible with a stale marker.

## Typst Error Contract

Target build logs should expose:

```json
{
  "engine": "typst",
  "status": "failed",
  "source": "content/resume/template.typ",
  "message": "unknown variable: ...",
  "line": 42,
  "column": 7,
  "output": null
}
```

The first implementation may store logs as plain text at:

```text
public/assets/resume.build.log
```

The later implementation can upgrade this to structured JSON for inline editor annotations.

## LaTeX Preview

Reference LaTeX files live under:

```text
content/resume/references/
docs/02-documents/
```

They are preserved as evidence, layout inspiration, and future import sources. Automatic LaTeX compilation is not enabled by default because it depends on local TeX distributions, fonts, and shell escape settings.

Future adapter:

```bash
npm run build:latex -- --source content/resume/references/resume-zh.tex
```

Adapter rules:

1. Compile only files inside approved content roots.
2. Write outputs to a controlled temporary directory first.
3. Copy only final PDF/PNG outputs into `public/assets`.
4. Disable shell escape unless a trusted profile explicitly enables it.
5. Record engine, command, source hash, and log path.

## PDF Preview Rules

The browser should preview generated PDFs, not compile source directly.

Allowed:

- `<iframe src="/assets/resume.pdf">`
- PDF.js viewer for annotation-aware navigation.
- Static PNG page renders for thumbnails.

Not allowed:

- Browser-triggered arbitrary shell commands.
- Cloud upload from a preview refresh.
- Writing outside approved source roots.

## Related Implementation Tasks

1. Add build log capture to `scripts/build-resume.js`.
2. Add stale PDF metadata when Typst fails.
3. Add a structured Typst error parser for editor annotations.
4. Add a guarded LaTeX adapter only after the Typst Lab MVP is stable.
5. Keep all public preview labels on `caolei` or `githoldder`.
