# Workflow: OpenCLI Publish

OpenCLI publishing is an L4 workflow.

Required gates:

1. PRD task exists and declares `external_side_effects: true`.
2. Human approves platform and target account.
3. Content preview is generated.
4. Privacy review is complete.
5. OpenCLI fills draft or performs approved action.
6. Human confirms final publish unless specifically approved otherwise.
7. Audit record is written to `sense/reports/`.
