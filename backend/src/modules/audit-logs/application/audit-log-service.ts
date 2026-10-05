import type { AuditLogPage } from '../domain/audit-log.js';
import type { AuditLogRepository } from './audit-log-repository.js';

export class AuditLogService {
  public constructor(private readonly repository: AuditLogRepository) {}

  public async list(page: number, limit: number): Promise<AuditLogPage> {
    const { rows, total } = await this.repository.list(page, limit);
    return { items: rows, page, limit, total };
  }
}
