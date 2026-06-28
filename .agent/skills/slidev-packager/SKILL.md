# Skill: Slidev Packager

Use when building or exporting decks.

Inputs:

- `content/decks/*.md`

Outputs:

- `public/slides/<slug>/`
- `public/assets/<slug>.pdf`

Rules:

- Source stays in Markdown.
- HTML and PDF are generated assets.
- Prefer build-time PDF export to client-side printing.
- Verify generated route and PDF before release.
