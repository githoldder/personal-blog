# Integration Test Cases

| ID | Integration | Expected Result |
| --- | --- | --- |
| INT-001 | Resume YAML to Typst PDF | `npm run build:resume` validates YAML and produces public JSON/PDF when Typst exists |
| INT-002 | Resume package | `npm run build:resume-package` creates a package manifest and zip when CLI support exists |
| INT-003 | Search index to semantic intelligence | `npm run build:semantic-intelligence` writes chunks, vectors and clusters |
| INT-004 | Source API to manifest | Local API serves `content/publish-manifest.json` without external writes |
