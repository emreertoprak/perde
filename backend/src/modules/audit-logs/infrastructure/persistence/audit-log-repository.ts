import { desc } from 'drizzle-orm';

import type { DatabaseExecutor } from '../../../../database/client.js';
import type { AuditLogInput, AuditLogRepository } from '../../application/audit-log-repository.js';
import type { AuditLogEntry } from '../../domain/audit-log.js';
import { auditLogs } from './schema.js';

export class DrizzleAuditLogRepository implements AuditLogRepository {
  public constructor(private readonly database: DatabaseExecutor) {}

  public async append(input: AuditLogInput, executor: DatabaseExecutor): Promise<void> {
    await executor.insert(auditLogs).values({
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValues: input.oldValues,
      newValues: input.newValues,
      metadata: input.metadata,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
    });
  }

  public async list(
    page: number,
    limit: number,
  ): Promise<{ readonly rows: readonly AuditLogEntry[]; readonly total: number }> {
    const [rows, total] = await Promise.all([
      this.database
        .select({
          id: auditLogs.id,
          actorUserId: auditLogs.actorUserId,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          metadata: auditLogs.metadata,
          requestId: auditLogs.requestId,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.$count(auditLogs),
    ]);
    return { rows, total };
  }
}
