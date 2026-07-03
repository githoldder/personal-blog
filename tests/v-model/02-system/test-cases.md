# System Test Cases

| ID | Scenario | Expected Result |
| --- | --- | --- |
| SYS-001 | Build static site | `npm run build` completes |
| SYS-002 | Open public resume PDF | `public/assets/resume.pdf` exists after resume build |
| SYS-003 | Open admin Resume Studio | Page renders from generated `resume.json` and local evidence manifest |
| SYS-004 | Local API health | `GET /health` returns local-only status |
