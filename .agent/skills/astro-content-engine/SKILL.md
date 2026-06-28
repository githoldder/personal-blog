# Skill: Astro Content Engine

Use when implementing content collections, routes, and static pages.

Rules:

- `content/` is the source of truth.
- `src/pages/` should remain route-focused.
- Put reusable UI in `src/components/`.
- Put content parsing utilities in `src/lib/content/`.
- Keep the UI workbench-like, not marketing-first.

Verify with:

```bash
npm run build
```
