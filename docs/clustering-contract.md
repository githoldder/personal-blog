# Clustering Contract

Semantic clusters combine deterministic taxonomy, graph topology and vector similarity over time. The current prototype groups public chunks by content type so the visual layer has a stable contract before remote embeddings are introduced.

```json
{
  "id": "cluster:note",
  "label": "note",
  "strategy": "deterministic-type-taxonomy",
  "chunk_ids": ["chunk:example"]
}
```
