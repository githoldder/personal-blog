# Swarm Harness

This directory describes multi-agent orchestration.

Current policy:

- ruflo is not installed into the project yet.
- Swarm roles are simulated through PRD tasks and Codex threads.
- Any future ruflo initialization must happen in a branch or temporary copy first.
- ruflo memory must not replace `context/`.
- ruflo goals must not replace `prds/json/`.

Default topology:

```text
Human -> Planner -> Executor -> Reviewer -> Guard -> Archivist
```
