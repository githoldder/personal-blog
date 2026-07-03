# Embedding Pipeline

`npm run build:semantic-intelligence` creates deterministic local semantic artifacts:

- `public/assets/semantic_chunks.json`
- `public/assets/vector_index.json`
- `public/assets/semantic_clusters.json`

The default prototype uses deterministic hash vectors. It does not call remote embedding providers and does not upload personal knowledge assets.
