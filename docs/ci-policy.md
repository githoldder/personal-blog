# CI Policy

CI is a validation gate, not a deployment mechanism.

Required checks:

- Install dependencies
- `npm run validate:prd`
- `npm run validate:pipeline`
- `npm test`
- `npm run build`

CI must not push generated content, deploy, upload evidence, call remote model providers, or mutate external services.
