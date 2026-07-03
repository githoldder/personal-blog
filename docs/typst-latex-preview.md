# Typst and LaTeX Preview Plan

## Typst

- Source: `content/resume/resume.yaml`
- Template: `content/resume/template.typ`
- Command: `npm run build:resume`
- Output: `public/assets/resume.pdf` and `public/assets/resume.json`

The template uses a moderncv classic inspired two-column rhythm, blue accent rules, and the local portrait at `content/resume/references/image.jpg`.

## LaTeX

Reference LaTeX files live under `content/resume/references`. They are preserved as evidence and layout inspiration. Automatic LaTeX compilation is not enabled in the default pipeline because it depends on local TeX distributions and fonts. A future adapter may compile into a controlled temporary output directory after environment detection.
