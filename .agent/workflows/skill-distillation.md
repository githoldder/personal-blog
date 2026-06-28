# Workflow: Skill Distillation

Use when a task is repeated three or more times or has a stable procedure.

Process:

1. Capture the successful manual or agent-assisted run.
2. Extract the reusable SOP.
3. Create `.agent/skills/<skill-name>/SKILL.md`.
4. Move deterministic steps into scripts where possible.
5. Add verification commands.
6. Register related tools in `sense/registry/tools.json`.

Goal: reduce future work from reasoning-heavy execution to deterministic tool execution.
