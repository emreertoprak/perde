import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://backend:backend@localhost:5432/backend_starter',
  },
  strict: true,
  verbose: true,
});
