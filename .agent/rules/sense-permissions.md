# Sense Permission Model

All tasks that use tools or agents must declare a permission level.

| Level | Name | Allowed Actions | Human Approval |
|---|---|---|---|
| L0 | Read Only | Read files, inspect code, summarize | Not required |
| L1 | Local Edit | Edit owned project files, run local validation | Usually not required |
| L2 | Local State | Git commit, local cache, local dev server | Follow project rules |
| L3 | External Read | Browse web, read logged-in pages, fetch remote data | Record source |
| L4 | External Write | Publish, upload, deploy, comment, update remote state | Required |
| L5 | Sensitive Action | Delete remote resources, payment, password, OAuth, secrets | Default deny |

## Default Policy

- Most implementation tasks are L1.
- Git commit is L2 and must be explicitly requested or allowed by the active workflow.
- OpenCLI platform publishing is L4.
- Account, token, cookie, payment, password, and OAuth actions are L5.

If permission is unclear, downgrade to planning or ask the human.
