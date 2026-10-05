import { and, asc, eq, isNull, lte, or, sql } from 'drizzle-orm';

import type { DatabaseExecutor } from '../../../database/client.js';
import type { OutboxEvent, OutboxRepository } from '../../application/outbox-repository.js';
import { outboxEvents } from './schema.js';

export class DrizzleOutboxRepository implements OutboxRepository {
  public constructor(private readonly database: DatabaseExecutor) {}

  public async add(
    event: Omit<OutboxEvent, 'id' | 'attempts'>,
    executor: DatabaseExecutor,
  ): Promise<void> {
    await executor.insert(outboxEvents).values(event);
  }

  public async findPending(limit: number): Promise<readonly OutboxEvent[]> {
    const now = new Date();
    return this.database
      .select({
        id: outboxEvents.id,
        aggregateType: outboxEvents.aggregateType,
        aggregateId: outboxEvents.aggregateId,
        eventType: outboxEvents.eventType,
        payload: outboxEvents.payload,
        occurredAt: outboxEvents.occurredAt,
        attempts: outboxEvents.attempts,
      })
      .from(outboxEvents)
      .where(
        and(
          isNull(outboxEvents.publishedAt),
          or(isNull(outboxEvents.nextAttemptAt), lte(outboxEvents.nextAttemptAt, now)),
        ),
      )
      .orderBy(asc(outboxEvents.createdAt))
      .limit(limit);
  }

  public async markPublished(id: string): Promise<void> {
    await this.database
      .update(outboxEvents)
      .set({ publishedAt: new Date() })
      .where(eq(outboxEvents.id, id));
  }

  public async markFailure(id: string, message: string): Promise<void> {
    await this.database
      .update(outboxEvents)
      .set({
        attempts: sql<number>`${outboxEvents.attempts} + 1`,
        lastError: message.slice(0, 500),
        nextAttemptAt: new Date(Date.now() + 60_000),
      })
      .where(eq(outboxEvents.id, id));
  }
}
