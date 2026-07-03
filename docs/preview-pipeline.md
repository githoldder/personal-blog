# Universal Preview Pipeline

The preview pipeline converts source records into local admin previews and public-safe projections.

1. Load source metadata from checked-in content, local vault mirrors, or cloud source references.
2. Normalize records into the source record schema.
3. Use `content/publish-manifest.json` to decide public eligibility.
4. Choose a preview adapter by file type.
5. Render local admin preview with source provenance.
6. Export only approved public assets to Astro pages and `public/assets`.

Markdown, Excalidraw and Canvas previews are static-site friendly. Typst resume output is produced by `npm run build:resume`. LaTeX and Office documents stay metadata-only unless a controlled local converter is explicitly configured.
