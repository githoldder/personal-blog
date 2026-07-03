# Source Record Schema

Normalized source records are the contract between vault files, local admin tooling, search, graph, preview, and semantic intelligence.

```json
{
  "id": "note:stable-id",
  "title": "Human title",
  "sourcePath": "vault/or/content/path.md",
  "sourceUrl": "https://github.com/owner/repo/blob/main/path.md",
  "rawUrl": "https://raw.githubusercontent.com/owner/repo/main/path.md",
  "updatedAt": "2026-07-03T00:00:00.000Z",
  "tags": ["knowledge-os"],
  "status": "draft | review | publishable | private",
  "media": [],
  "graph": {
    "type": "note",
    "scope": "Resources Notes",
    "folder": "01-Areas/001_个人规划"
  },
  "chunks": [
    {
      "id": "chunk:stable-id:0001",
      "text": "Embedding ready text",
      "public": true
    }
  ]
}
```

Frontmatter parse failures must be recorded per file and must not crash unrelated records.
