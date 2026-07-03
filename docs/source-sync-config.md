# Source Sync Configuration

Source truth can come from two places:

- Local vault mirror via `OBSIDIAN_ROOT`
- Cloud source references via the GitHub repository `githoldder/Obsidian_vault`

The build scripts must prefer explicit configuration over hardcoded absolute paths. If `OBSIDIAN_ROOT` is absent, the pipeline should degrade to checked-in public content and manifests.

## Environment

| Variable | Purpose | Public client exposure |
| --- | --- | --- |
| `OBSIDIAN_ROOT` | Optional local vault path for private source reads | Never |
| `OBSIDIAN_GITHUB_REPO` | Optional `owner/repo` identifier for cloud source links | Safe if public |
| `OBSIDIAN_GITHUB_TOKEN` | Optional private repo token | Never |

## URL Mapping

For public source references, store metadata as:

- `sourceUrl`: GitHub blob URL for human review
- `rawUrl`: GitHub raw URL for read-only source fetches
- `sourcePath`: vault-relative source path

Tokens must never be serialized into `public/assets`, Astro pages, or client JavaScript.
