# Backend Starter Kit

A production-oriented Node.js 24, TypeScript, Express, PostgreSQL, Drizzle, Redis, and BullMQ modular-monolith starter.

## Quick start

1. Install Node.js 24.18.0 and Docker Compose.
2. Copy `.env.example` to `.env`, replace every development-only secret, then install dependencies with `npm ci`.
3. Start dependencies with `npm run docker:up`; the Compose `migrate` service applies versioned SQL migrations.
4. Run `npm run db:seed`, `npm run dev`, and in another terminal `npm run worker:dev`.

The API listens on `http://localhost:3000`, Swagger is available at `/docs` in development, Mailpit is at `http://localhost:8025`, Grafana is at `http://localhost:3001`, and MinIO is at `http://localhost:9001`.

## Commands

- `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, `npm run build`
- `npm run db:generate`, `npm run db:check`, `npm run db:migrate`, `npm run db:migrate:prod`, `npm run db:seed`, `npm run db:studio`
- `npm run worker:start`, `npm run docker:up`, `npm run docker:down`, `npm run arch:check`, `npm run forbidden:check`

Migrations are generated with `drizzle-kit generate`, committed as SQL, and executed separately. Never use schema push in production. Run `db:seed` repeatedly; it upserts roles and permissions.

## Architecture and security

Business modules own their domain/application/infrastructure/presentation layers and expose controlled public APIs through `index.ts`. Domain code is infrastructure-free. API responses use a stable success/error envelope; controllers validate and delegate only.

Refresh JWTs are stored only as hashes, rotate on use, and revoke their family on reuse. Web clients receive HttpOnly refresh cookies; mobile clients explicitly opt into body delivery and must use OS secure storage. OAuth uses PKCE/state/nonce and never joins accounts by e-mail alone. See [authentication documentation](docs/AUTHENTICATION.md).

All configuration is validated at startup. External provider credentials are optional only while their corresponding feature is disabled. Production must provide strong, distinct secrets, a real SMTP/S3 provider, CORS allowlist, metrics protection, and Sentry/PostHog credentials as applicable.

## Deployment checklist

- Use the multi-stage, non-root production image and run `npm run db:migrate:prod` as a release step.
- Set `NODE_ENV=production`, managed PostgreSQL/Redis, HTTPS, `TRUST_PROXY=true`, secure CORS origins, and external secret management.
- Keep stdout JSON logs for Grafana Alloy/Promtail; do not make application availability depend on Loki, Sentry, or PostHog.
- Restrict `/metrics`, disable or protect `/docs`, rotate JWT/encryption keys, and test backup/restore and session-revocation flows.

See `docs/` for module, database, queue, observability, security, and deployment guidance.
