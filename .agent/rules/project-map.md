# Project Map

Personal Knowledge Asset OS is a content-first Astro workspace governed by Sense v4.0.

## Core Product Loop

```text
content/ -> scripts/ -> public/assets/ -> Astro pages -> deploy/publish
```

## Core Paths

- `content/`: source of truth for resume, notes, projects, and decks.
- `src/`: Astro application.
- `scripts/`: deterministic asset and validation scripts.
- `prds/json/`: machine task truth.
- `.agent/`: governance, workflows, skills, roles, tools, and adapters.
- `sense/`: run records, queues, tool registry, and reports.

## Protected Legacy Paths

- `doc/`
- `reveal/`
- existing `node_modules/`

Do not delete or reorganize legacy paths without a dedicated archival PRD.
