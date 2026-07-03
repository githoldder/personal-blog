# Publish Manifest Schema

`content/publish-manifest.json` is the privacy boundary between source truth and public projection.

```json
{
  "schema_version": 1,
  "updated_at": "2026-07-03",
  "records": [
    {
      "source_path": "content/notes/example.md",
      "public_slug": "example",
      "status": "publishable",
      "type": "note",
      "review_notes": "Human review summary"
    }
  ]
}
```

Only `publishable` records are eligible for public rendering. `draft`, `review`, and `private` records may appear in local admin tooling but must not be reachable through public routes, feeds, sitemap, or search assets.
