# Sense Agent Roles

## Planner-Agent

Reads PRD, breaks work into scoped tasks, assigns roles, and prevents scope drift.

## Executor-Agent

Implements changes inside owned files and runs local verification.

## Reviewer-Agent

Reviews code, docs, tests, and acceptance criteria.

## Guard-Agent

Checks permissions, secrets, external side effects, and owned file boundaries.

## Publisher-Agent

Runs publishing or deployment workflows only after human approval.

## Archivist-Agent

Updates `context/`, `prds/`, `sense/runs/`, and walkthrough notes.
