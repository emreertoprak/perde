export interface AuditLogEntry {
  readonly id: string;
  readonly actorUserId: string | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly metadata: Record<string, unknown> | null;
  readonly requestId: string | null;
  readonly createdAt: Date;
}

export interface AuditLogPage {
  readonly items: readonly AuditLogEntry[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}
