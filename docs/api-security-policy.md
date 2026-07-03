# API Security Policy

The admin API is a local loopback tool. It is not a production backend.

## Defaults

- Bind to `127.0.0.1`
- Read-only methods by default
- No browser-exposed secrets
- No remote deployment, upload, or publish operation

## Permission Levels

- L1: read public generated assets
- L2: read local project source files
- L3: read remote source repositories
- L4: write external state, including GitHub push, deployment, CDN upload, or social publishing

L4 actions require explicit human approval and a release record.
