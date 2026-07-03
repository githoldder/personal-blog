# Troubleshooting

## Build Fails

Run `npm run validate:prd`, `npm run validate:pipeline`, and `npm test` first. Then run the narrower builder that failed, such as `npm run build:resume`.

## Resume PDF Missing

Confirm `typst --version` works. If Typst is absent, `resume.json` still builds but PDF generation is skipped.

## Graph or Search Looks Wrong

Run `npm run build:semantic` and `npm run build:semantic-intelligence`. Check `public/assets/semantic_graph.json`, `semantic_chunks.json`, `vector_index.json`, and `semantic_clusters.json`.

## Privacy Concern

Treat it as S0. Stop release, inspect `content/publish-manifest.json`, feeds, sitemap, and generated assets.
