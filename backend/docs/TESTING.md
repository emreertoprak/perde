# Testing

Use Vitest projects: unit tests for services and crypto, integration tests for PostgreSQL/Redis/queues, and e2e tests for HTTP flows. Testcontainers is the intended isolated backing-service mechanism. External OAuth, Sentry, PostHog, SMTP, and S3 calls must use deterministic adapters or local services.

Run typecheck, lint, test, build, architecture checks, and forbidden-ORM checks before merging. Coverage thresholds are configured in `vitest.config.ts`.
