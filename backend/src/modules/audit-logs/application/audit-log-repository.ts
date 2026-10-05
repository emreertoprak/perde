import type { DatabaseExecutor } from '../../../database/client.js';
import type { AuditLogEntry } from '../domain/audit-log.js';

export interface AuditLogInput {
  readonly actorUserId?: string | undefined;
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string | undefined;
  readonly oldValues?: Record<string, unknown> | undefined;
  readonly newValues?: Record<string, unknown> | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
  readonly ipAddress?: string | undefined;
  readonly userAgent?: string | undefined;
  readonly requestId?: string | undefined;
}

export interface AuditLogRepository {
  append(input: AuditLogInput, executor: DatabaseExecutor): Promise<void>;
  list(
    page: number,
    limit: number,
  ): Promise<{ readonly rows: readonly AuditLogEntry[]; readonly total: number }>;
}
