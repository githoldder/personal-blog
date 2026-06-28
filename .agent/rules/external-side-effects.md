# External Side Effects

External side effects include any action that changes state outside this repository.

Examples:

- Publish posts, comments, likes, messages, or profile updates.
- Upload files to cloud storage or object storage.
- Deploy production sites.
- Modify DNS, cloud config, GitHub repo settings, issues, PRs, or releases.
- Operate a logged-in account with OpenCLI or a browser.

## Requirements

Before executing an external write:

1. The task must exist in `prds/json/`.
2. The task must declare `external_side_effects: true`.
3. The task must be L4 or L5.
4. The platform, account, URL, action, and rollback path must be clear.
5. The human must explicitly approve the action.
6. The result must be recorded in `sense/reports/` or walkthrough notes.

No silent publish, deploy, upload, delete, or account mutation is allowed.
