# Backend Starter Kit Implementation Plan

This document is the execution checklist for the requirements in
`BACKEND_STARTER_PROMPT.md`. The starter is a single-deployment modular
monolith with independently runnable API and worker processes.

## Architecture decisions

- Node.js 24 LTS, TypeScript ESM, Express 5, PostgreSQL, Drizzle ORM with the
  `postgres` driver, Redis, BullMQ, Zod, Pino, Vitest, and Supertest.
- Business modules live under `src/modules` and expose only controlled public
  APIs. Domain code has no framework or infrastructure imports.
- Infrastructure implementations satisfy application ports and are wired in a
  manual composition root. Cross-module work uses public ports or domain events.
- Table declarations remain in their owning modules. The central database
  schema export exists only for Drizzle tooling.
- Database migrations are generated, versioned SQL and run by an explicit
  deployment command. Application startup never pushes or migrates schemas.
- API and worker use the same build artifact but remain separate processes.
- Prisma packages, files, conventions, errors, and migrations are forbidden.

## Delivery phases

1. Create strict TypeScript/npm tooling, environment validation, Express
   bootstrap, request context, standard responses, security middleware,
   central errors, logging, and graceful shutdown.
2. Add modular Drizzle schemas, the PostgreSQL client, transaction manager,
   migration runner, generated migration, repositories, mappers, and
   idempotent seeds.
3. Implement users, auth, and sessions: Argon2id passwords, short-lived access
   JWTs, hashed rotating refresh JWTs, reuse detection, device/session
   management, verification/reset flows, and Google/Apple OIDC adapters.
4. Implement RBAC, audit logs, notifications/mail, Redis/cache, BullMQ and
   transactional outbox, local/S3 storage, idempotency, generic signed
   webhooks, and feature flags.
5. Add Sentry, PostHog, Prometheus metrics, stdout logging for Loki/Alloy,
   health/readiness, Docker/Compose, Nginx, PM2, and GitHub Actions.
6. Generate OpenAPI documentation, project and architecture documentation, and
   a final implementation report containing only observed verification results.

## Locked security behavior

- Web refresh tokens use an HttpOnly, Secure, SameSite cookie and signed
  double-submit CSRF protection. Mobile clients explicitly request body token
  delivery and must use platform secure storage.
- Access tokens default to 15 minutes and refresh tokens to 30 days. Signing
  supports a current key plus previous verification keys.
- Refresh tokens are stored only as SHA-256 hashes. Rotation and reuse-family
  revocation execute while the session row is locked in one transaction.
- Passwords are 15-128 characters and use Argon2id with 64 MiB memory, three
  iterations, and parallelism one.
- OAuth uses authorization code, PKCE, state, and nonce. Provider e-mail alone
  never links accounts. Linking/unlinking requires password or provider step-up.
- Account deletion anonymizes personal data, revokes credentials and sessions,
  preserves audit integrity, and schedules idempotent resource cleanup.
- Security-critical Redis operations fail closed; cache and optional analytics
  degrade without failing the business transaction.

## Verification gates

At the end of every phase run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

After database work also run schema checking, migration generation drift
checking, migration deployment, and the seed twice. After container work run
Compose validation, start the stack, and probe liveness and readiness. Failures
must be fixed at their cause; tests and strictness are not weakened.
