import type { Database, DatabaseTransaction } from './client.js';

export class TransactionManager {
  public constructor(private readonly database: Database) {}

  public withinTransaction<T>(
    operation: (transaction: DatabaseTransaction) => Promise<T>,
  ): Promise<T> {
    return this.database.transaction(operation);
  }
}
