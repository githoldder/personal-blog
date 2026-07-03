# Requirements Test Cases

| ID | Requirement | Verification |
| --- | --- | --- |
| REQ-001 | PRD files use valid sprint/task schema | `npm run validate:prd` |
| REQ-002 | Public projection is whitelist driven | Inspect `content/publish-manifest.json` |
| REQ-003 | External deployment requires human L4 approval | Inspect `docs/publication-channel-policy.md` and `sense/reports/public-release-report.md` |
| REQ-004 | Resume upgrade reflects evidence and project depth | Inspect `content/resume/resume.yaml` and `content/resume/evidence-manifest.json` |
