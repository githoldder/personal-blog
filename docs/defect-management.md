# Defect Management

## Severity

- S0: privacy leak, secret exposure, destructive external write
- S1: build broken, public route broken, generated assets missing
- S2: incorrect rendering, graph/search mismatch, admin workflow issue
- S3: copy, documentation, polish, non-blocking visual issue

## Flow

1. Record reproduction, environment, command, route, and artifact.
2. Assign severity.
3. Check whether the defect affects public projection or private source safety.
4. Add a regression test or checklist item.
5. Close only after CLI verification passes.

Privacy leaks are release blockers.
