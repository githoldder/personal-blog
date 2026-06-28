# Skill: Semantic Indexer

Use when generating semantic graph data.

Current phase:

- Placeholder graph only.
- No live embedding or WebGPU work yet.

Inputs:

- `content/notes/*.md`
- `content/projects/*.md`
- `content/resume/resume.yaml`

Output:

- `public/assets/semantic_graph.json`

Rules:

- Build-time indexing before browser runtime embedding.
- Keep JSON schema stable.
- Record model/provider decisions in PRD before real embedding.
