import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { createDatabase } from './client.js';
import { loadEnv } from '../config/env.js';

const config = loadEnv();
const { db, sql } = createDatabase(config);
const migrationsFolder = fileURLToPath(new URL('./migrations', import.meta.url));

try {
  await migrate(db, { migrationsFolder });
} finally {
  await sql.end({ timeout: 10 });
}
