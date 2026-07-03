# V-Model Test Strategy

The project maps product intent to verification from top to bottom:

1. Requirements validation checks PRDs, project charter, release gates and privacy rules.
2. System tests check public surfaces, admin surfaces and local-only assumptions.
3. Integration tests check build pipelines and generated assets.
4. Component tests check pages, preview adapters and graph/resume components.
5. Unit tests check parser helpers, manifests, schemas and deterministic semantic functions.

CLI command bundle:

```bash
npm run validate:prd
npm run validate:pipeline
npm test
npm run build:resume
npm run build:semantic-intelligence
npm run build
```
