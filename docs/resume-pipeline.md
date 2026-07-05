# Resume Build Pipeline

## Purpose

The resume pipeline turns a structured resume source into three public artifacts:

- A web resume JSON payload.
- A Typst-generated print PDF.
- A presentation-friendly PDF exported from a PPTX source when the local machine supports it.

Public-facing site labels should use `caolei` or `githoldder`. The resume source may contain private identity fields for actual job applications, but portfolio pages, deck viewers, manifests, and generic documentation should not expose the author's legal name.

## Inputs

```text
content/resume/resume.yaml
content/resume/template.typ
content/resume/references/
content/resume/evidence-manifest.json
```

Current optional presentation source:

```text
content/resume/<private-resume-presentation>.pptx
```

This private source artifact may exist locally with an application-specific filename. Generated public labels around it should use `caolei` or `githoldder`.

## Outputs

```text
public/assets/resume.json
public/assets/resume.pdf
public/assets/resume-presentation.pdf
```

Run:

```bash
npm run build:resume
```

Current behavior:

1. Parse `content/resume/resume.yaml`.
2. Validate required schema sections.
3. Write `public/assets/resume.json`.
4. If `typst` is installed, compile `content/resume/template.typ` to `public/assets/resume.pdf`.
5. On macOS, if Keynote can open the PPTX source, export `public/assets/resume-presentation.pdf`.

If Typst is unavailable, JSON export still succeeds and PDF compilation is skipped with a warning.

## Current Required Schema

`basics`:

- `name`
- `label`
- `email`
- `phone`
- `url`
- `summary`
- `location`

`education[]`:

- `institution`
- `area`
- `studyType`
- `startDate`
- `endDate`

`experience[]`:

- `company`
- `position`
- `startDate`
- `endDate`
- `summary`
- `highlights[]`

`projects[]`:

- `name`
- `description`
- `highlights[]`
- `keywords[]`
- `startDate`
- `endDate`
- `type`
- `url`

`skills[]`:

- `name`
- `level`
- `keywords[]`

## Target Schema Extensions

Add optional fields that let Web, PDF, and presentation outputs share the same achievement language:

```yaml
basics:
  displayName: caolei
  handle: githoldder
  targetRole: AI 工程化 / 全栈开发 / 知识系统产品

projects:
  - name: Personal Blog
    role: 独立开发
    impact: 将 Obsidian 笔记、图谱、简历、演示稿统一为可发布知识资产系统
    metrics:
      - "1000+ notes indexed"
      - "multi-format preview pipeline"
    evidence:
      - type: repo
        url: "https://github.com/githoldder/..."
      - type: artifact
        path: "content/resume/references/evidence/..."

experience:
  - company: Example
    position: Developer
    scope: "Backend, content pipeline, AI workflow"
    impact: "Reduced manual publishing steps"
    metrics:
      - "Build time < 2 min"
```

Compatibility rule:

- Existing templates must ignore missing optional fields.
- New templates should prefer `displayName` over `name` for public portfolio output.
- Application-only exports may still use `name` when explicitly selected.

## Recruiter-Optimized Layout Rules

The PDF should optimize for a 6-10 second first scan:

1. Top block: display name, target role, contact, portfolio/repo links.
2. One-line positioning statement, no long personal paragraph.
3. First screen/page emphasis: strongest 2-3 projects before generic skill lists.
4. Each project uses `Problem -> Action -> Result`, not only technology keywords.
5. Bullets are short and measurable: one line preferred, two lines maximum.
6. Skills are grouped by capability: Backend, Frontend, AI tooling, Data/Automation, DevOps.
7. Awards and certificates are compressed into a compact evidence section unless they directly match the target role.
8. Avoid decorative density. White space is used to make impact statements scannable.

Recommended PDF order:

```text
Header
Target Role / Positioning
Selected Projects
Experience
Skills
Education
Awards / Certifications / Evidence
```

Recommended web resume order:

```text
Hero identity panel
Impact highlights
Selected projects with evidence links
Experience timeline
Skill matrix
Education and awards
Download links
```

## Template Requirements

`content/resume/template.typ` should:

- Keep one primary accent color and neutral text.
- Fit the primary version into one page when targeting internships or junior roles.
- Use two pages only for evidence-heavy academic or project portfolio variants.
- Provide visible links for portfolio, repo, and downloadable artifacts.
- Avoid public legal-name display unless the chosen export profile is `application`.

Future profile switch:

```yaml
exportProfiles:
  public:
    displayName: caolei
    includePhone: false
    includeLegalName: false
  application:
    includePhone: true
    includeLegalName: true
```

## Admin Save Flow

The local API supports:

- `GET /source/tree`
- `GET /source/file?path=content/resume/resume.yaml`
- `GET /source/file?path=content/resume/template.typ`
- `POST /source/save`

When `path` starts with `content/resume/`, `server/local-api.js` currently runs:

```bash
node scripts/build-resume.js
node scripts/build-search-index.js
```

MVP admin behavior:

1. Edit `resume.yaml` and `template.typ` from the admin console.
2. Save through `/source/save`.
3. Show JSON validation errors inline.
4. If Typst compilation succeeds, refresh `public/assets/resume.pdf`.
5. If Typst is missing, keep JSON preview available and show install guidance.
6. Keep a separate "Publish" action gated outside the save flow.

## Validation Tasks

1. Extend `scripts/build-resume.js` to accept optional `displayName`, `handle`, `targetRole`, `impact`, `metrics`, `role`, and `evidence`.
2. Add a public/private export profile check before rendering public pages.
3. Add a compact lint rule for overly long bullets.
4. Add a build warning when generated public labels contain the legal name.
5. Store resume build logs under `public/assets/resume.build.log`.
6. Keep Keynote/PPTX export best-effort and non-blocking.
