# OpenCLI Adapter

OpenCLI is treated as an external environment bridge.

Use for:

- Logged-in web workflows
- Draft filling
- Platform checks
- Manual-confirm publishing flows

Do not use for:

- Silent posting
- Account mutation without approval
- Payment, OAuth, password, or sensitive actions
- CAPTCHA or risk-control bypass

All external writes are L4 or L5 and require human approval.
