# Agent Ops Governance

This project follows Taste v4.0 Sense.

## Entry Order

Every agent must read these files before changing project files:

1. `Agent.md`
2. `context/project-brief.md`
3. `context/directory-map.md`
4. Current PRD JSON in `prds/json/`
5. Relevant rules, workflows, and skills under `.agent/`

## Source Of Truth

- Product and task state: `prds/json/`
- Human review summary: `prds/md/`
- Short-term working memory: `context/context.txt`
- Long-term decisions: `context/memory.md`
- Content source: `content/`
- Generated assets: `public/assets/`, `output/`, `dist/`

## Execution Rules

- Work only inside the current task's owned files.
- Do not expand scope because a related improvement looks easy.
- Record material decisions in `context/context.txt`.
- Update PRD status after completing a task.
- Create or update walkthrough notes for sprint completion.

## Sense Layering

- Governance layer defines boundaries.
- Swarm layer coordinates agents.
- Tool bridge layer executes commands and external actions.

The tool bridge must never bypass governance.
