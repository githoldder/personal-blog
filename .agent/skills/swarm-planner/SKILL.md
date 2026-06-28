# Skill: Swarm Planner

Use when decomposing work across multiple agents.

Steps:

1. Read active PRD JSON.
2. Assign one role per task.
3. Ensure owned files do not conflict.
4. Set permission levels.
5. Create or update `sense/runs/` records for multi-agent work.
6. Route external writes through Guard-Agent and human approval.

Do not let the swarm invent new scope outside PRD.
