# Two-Stage Sprint Plan

**Date:** 2026-06-30  
**Scope:** S05 remainder and S06 planning

## Stage 1: Finish S05 Public Surface Polish

Goal: make the public-facing surface coherent, discoverable, and release-ready without performing an external deployment.

Execution order:

1. **S05-T02: Unify visual system and navigation**
   - Normalize `BaseLayout`, global navigation, spacing, borders, typography and repeated UI elements.
   - Keep the product feeling like a workbench, not a marketing landing page.
   - Avoid decorative gradients, orbs and one-note palettes.

2. **S05-T03: Add local search index**
   - Generate `public/assets/search-index.json` from local content and graph assets.
   - Add a static-first `/search` page.
   - Do not add hosted search.

3. **S05-T04: Add RSS and Atom feeds**
   - Generate RSS and Atom from publishable local content.
   - Document feed contract and source inclusion rules.

4. **S05-T05: Performance and SEO pass**
   - Add or verify title, description, canonical metadata, sitemap and robots.
   - Produce `sense/reports/performance-seo.md`.

5. **S05-T06: Release walkthrough and deployment decision**
   - Produce release readiness report.
   - Update deployment recommendation.
   - Do not deploy or publish without explicit human approval.

Exit gates:

- `npm run verify` passes.
- S05 PRD JSON and MD are both `done`.
- Release readiness report records commands, blockers and deploy decision.
- No external publishing or deployment has happened.

## Stage 2: Prepare S06 Launch & Operations

Goal: after S05 is release-ready, establish the operating loop for launch control, content maintenance and feedback intake.

Execution order:

1. **S06-T01: Create release checklist and rollback plan**
   - Write checklist and rollback docs.
   - Keep deployment gated.

2. **S06-T02: Define publication channel policy**
   - Document allowed/prohibited channels and approval requirements.

3. **S06-T03: Create content cadence and editorial queue**
   - Build a local editorial queue.
   - Separate draft, review and publishable content.

4. **S06-T04: Add content quality checklist**
   - Cover metadata, graph visibility, links and public readiness.

5. **S06-T05: Design feedback intake model**
   - Prefer local or repository-based feedback.
   - Avoid analytics, hosted comments or forms unless approved.

6. **S06-T06: Create maintenance runbook**
   - Document recurring verification, asset generation and known blockers.

Exit gates:

- S06 docs define a repeatable operating loop.
- External write paths have explicit Sense approval requirements.
- Maintenance can continue without hidden services or manual guesswork.

## Operating Principle

S05 is about making the site ready. S06 is about making the system sustainable. New features should wait until the public surface, release policy and maintenance loop are boringly reliable.
