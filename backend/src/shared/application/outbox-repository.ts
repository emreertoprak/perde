import type { DatabaseExecutor } from '../../database/client.js';

export interface OutboxEvent {
  readonly id: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: Date;
  readonly attempts: number;
}

export interface OutboxRepository {
  add(event: Omit<OutboxEvent, 'id' | 'attempts'>, executor: DatabaseExecutor): Promise<void>;
  findPending(limit: number): Promise<readonly OutboxEvent[]>;
  markPublished(id: string): Promise<void>;
  markFailure(id: string, message: string): Promise<void>;
}
