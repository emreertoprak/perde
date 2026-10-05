# Architecture

The application is a modular monolith. `presentation` receives HTTP, validates DTOs, and calls application services. `application` owns use cases and ports. `domain` contains framework-free rules. `infrastructure` implements persistence and providers. Modules communicate only through their public index exports, application ports, or post-commit events.

Request lifecycle: request context and Pino logging → security middleware → route validation/authorization → application service → mapped response → central error handler. The worker reads committed outbox rows, queues idempotent jobs, and handles external side effects separately.

Do not import another module's infrastructure directory. The database schema index is tooling-only; FK declaration uses controlled public schema exports. Dependency-cruiser enforces no cycles and layer rules.
