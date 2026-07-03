# Preview API Contract

Preview surfaces are local-first and metadata-safe. They must never expose local absolute paths on public pages.

| Type | Preview mode | Fallback |
| --- | --- | --- |
| Markdown | Render frontmatter, headings, code, callouts, wiki-links | Escaped plain text |
| Image | Browser image preview | Metadata and open/download action |
| PDF | Embedded PDF viewer | Metadata and open/download action |
| Code | Syntax-aware text preview | Escaped plain text |
| Typst | Compile to PDF via `npm run build:resume` | Build log and source metadata |
| LaTeX | Local compile plan, no upload | Environment checklist |
| Excalidraw | Static extracted vector preview | Markdown body and warning |
| Canvas | Static node/link preview | JSON metadata |

Preview adapters must be explicit about source privacy and publication eligibility.
