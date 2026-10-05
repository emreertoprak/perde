import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import type { AppConfig } from '../config/env.js';

export function createDatabase(config: AppConfig) {
  const sql = postgres(config.DATABASE_URL, {
    max: config.DATABASE_MAX_CONNECTIONS,
    ssl: config.DATABASE_SSL ? 'require' : false,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  const db = drizzle({ client: sql });
  return { sql, db };
}

export type Database = ReturnType<typeof createDatabase>['db'];
export type DatabaseTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DatabaseExecutor = Database | DatabaseTransaction;
