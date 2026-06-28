# Deck Pipeline

## Purpose

The deck pipeline treats `content/decks/*.md` as the source of truth for presentation material. S03-T03 defines a deterministic metadata manifest that later Slidev build/export steps can consume.

## Input

Each deck is a Markdown file in `content/decks/` with a YAML frontmatter block:

```yaml
---
title: "PK Asset OS 路线图"
date: 2026-06-26
slug: pk-asset-os-roadmap # optional; falls back to filename
---
```

Required fields:

- `title`: Human-readable deck title.
- `date`: Deck date in `YYYY-MM-DD` form.

Optional fields:

- `slug`: Stable URL/output slug. If omitted, the filename without `.md` is used.

## Output

Run:

```bash
npm run build:decks
```

The script writes:

```text
public/assets/decks/manifest.json
```

Manifest entries include:

- `slug`
- `title`
- `date`
- `sourcePath`
- `outputs.html`
- `outputs.pdf`
- `build.status`

## Current Boundary

S03-T03 only produces metadata and output targets. It does not invoke Slidev, write to a hosted slide service, or export PDFs. HTML/PDF generation remains a later local build step and must stay inside Sense permission rules.
