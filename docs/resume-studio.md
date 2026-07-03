# Resume Studio

Resume Studio binds structured resume facts to local evidence while keeping private certificates out of the public site by default.

## Source Files

- Data: `content/resume/resume.yaml`
- Template: `content/resume/template.typ`
- Evidence manifest: `content/resume/evidence-manifest.json`
- Public outputs: `public/assets/resume.json`, `public/assets/resume.pdf`
- Optional package: `public/assets/resume-package.zip`

## Commands

- `npm run build:resume`
- `npm run build:resume-package`

The package excludes raw private evidence files and includes only data, template, manifest, and generated public resume outputs.
