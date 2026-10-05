# Database

Drizzle table definitions live in their owning module. `src/database/schema/index.ts` exports them only for drizzle-kit. PostgreSQL constraints, indexes, unique keys, and cascading relationships are generated into versioned SQL migrations.

Use `npm run db:generate` after schema changes, inspect and commit the generated SQL, run `npm run db:check`, then apply with `npm run db:migrate`. Startup never applies migrations. Repositories select explicit columns and map persistence rows before they leave infrastructure.
