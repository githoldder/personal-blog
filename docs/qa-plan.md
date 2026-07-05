# QA Plan

The project uses a V-model testing structure under `tests/v-model`.

S16 extends this baseline for the S15 visual/product redesign. See `docs/S16-visual-quality-testing-sprint.md` for the full white-box, black-box, smoke, top-down integration, visual screenshot, regression, and acceptance-test design.

## Verification Levels

| Design artifact | Test level | Directory |
| --- | --- | --- |
| Project charter / PRDs | Requirements validation | `tests/v-model/01-requirements` |
| Public site and admin system | System tests | `tests/v-model/02-system` |
| Build scripts and generated assets | Integration tests | `tests/v-model/03-integration` |
| Astro pages, React components, API routes | Component tests | `tests/v-model/04-component` |
| Parser helpers and schema functions | Unit tests | `tests/v-model/05-unit` |

CLI verification runs through `npm run validate:prd`, `npm run validate:pipeline`, `npm test`, `npm run build:resume`, `npm run build:semantic-intelligence`, and `npm run build`.

## Visual Quality Gate

For S15/S16 release candidates, QA must also capture screenshot evidence for homepage, navigation/logo states, library shelf, Canvas viewer, note theme backgrounds, resume, deck preview, admin, and Typst lab routes across mobile, tablet, desktop, wide desktop, and reduced-motion modes.

Screenshot reports should be stored under `sense/reports/visual-snapshots/<date>/` with route, viewport, pass/fail status, defect IDs, and known risks.

## S16 Smoke And Visual Automation

First-batch S16 automation is available through Python Playwright:

```bash
SITE_URL=http://127.0.0.1:4322 npm run test:smoke
SITE_URL=http://127.0.0.1:4322 npm run test:visual
```

Configuration:

- `SITE_URL`: local dev, preview, or production-preview base URL. Defaults to `http://127.0.0.1:4322`.
- `SNAPSHOT_DATE`: optional release-candidate folder name under `sense/reports/visual-snapshots/`.
- `SNAPSHOT_ROOT`: optional alternate evidence root.
- `SMOKE_FORBIDDEN_TEXT`: comma-separated extra text tokens that must not appear in visible page text.
- `SMOKE_TIMEOUT_MS` and `VISUAL_TIMEOUT_MS`: route timeout overrides.

`npm run test:smoke` covers the S16 black-box route set: homepage, notes, one note detail, one Canvas note, library, projects, one project detail, resume, decks, graph lab, canvas lab, admin, and future Typst lab as an optional route. Failures include the route, selector/status reason, console error summary, and a screenshot in `sense/reports/visual-snapshots/<date>/smoke/`.

`npm run test:visual` captures mobile `390x844`, tablet `768x1024`, desktop `1440x900`, and wide `1920x1080` evidence for homepage, header logo hover/click states, library shelf, Canvas, note article, resume, decks, one deck preview, admin, and reduced-motion homepage/Canvas. It writes `sense/reports/visual-snapshots/<date>/index.md` for manual S16 sign-off.

The scripts do not start Astro automatically; start `npm run dev` or `npm run preview` first, then set `SITE_URL` to the running server.
