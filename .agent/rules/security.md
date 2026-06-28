# Security Rules

## Red Lines

Agents must not:

- Print, copy, or commit secrets, tokens, cookies, browser profiles, or `.env` contents.
- Expose private local paths in public content.
- Publish personal data without explicit review.
- Bypass platform restrictions, CAPTCHA, rate limits, or account safety flows.
- Store login state under `sense/state/`.
- Treat generated or inferred claims as verified facts.

## Secret Handling

If a workflow requires credentials, ask the human to perform the sensitive step or provide the minimum non-secret result needed to continue.

## Public Content Review

Before publishing content externally, check for:

- Private notes
- Phone numbers and personal email
- API keys and URLs with tokens
- Internal paths
- Draft-only content
