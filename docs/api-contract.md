# Local REST API Contract

The Personal Knowledge Asset OS local API is a loopback-only admin surface. It reads project files and generated manifests, but it does not deploy, publish, upload, or mutate remote services.

## Runtime

- Command: `npm run api:local`
- Default host: `127.0.0.1`
- Default port: `8787`
- Entry: `server/local-api.js`

## Endpoints

| Method | Path | Purpose | Mutates data |
| --- | --- | --- | --- |
| `GET` | `/health` | Local readiness check | No |
| `GET` | `/source/tree` | Lists source files under `content/notes`, `content/projects`, `content/decks`, `content/resume` | No |
| `GET` | `/source/file?path=...` | Reads a file inside the project root | No |
| `GET` | `/publish-manifest` | Reads the public projection whitelist | No |
| `GET` | `/resume/evidence` | Reads local evidence bindings for Resume Studio | No |

All non-GET methods return `405` by default.

## Permission Boundary

The API separates local admin review from public publication. Browser-facing public pages must consume generated public assets, not private source trees. External writes such as GitHub push, production deployment, CDN upload, or social publishing remain explicit human approval gates.
