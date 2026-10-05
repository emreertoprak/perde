# Adding a module

Create `domain`, `application`, `infrastructure`, `presentation`, and `index.ts` beneath `src/modules/<module>`. Keep framework and database imports out of domain code. Define ports in application, adapters in infrastructure, and routes/DTOs in presentation. Export only the public service, port, route factory, and schema contract needed by other modules.

Add table exports to the central database schema only for tooling, generate a migration, register the module in the composition root, add OpenAPI paths, and cover behavior with tests.
