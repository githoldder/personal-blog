# Skill: Typst Builder

Use when working on resume PDF generation.

Inputs:

- `content/resume/resume.yaml`
- `content/resume/template.typ`

Outputs:

- `public/assets/resume.pdf`

Rules:

- Keep resume data structured in YAML.
- Keep visual layout in Typst.
- Do not hard-code private data into scripts.
- Run `npm run build:resume` after changes.

Future implementation should parse YAML, render Typst input, and call Typst CLI.
