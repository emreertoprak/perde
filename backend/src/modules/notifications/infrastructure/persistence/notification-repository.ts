import { and, desc, eq } from 'drizzle-orm';

import type { DatabaseExecutor } from '../../../../database/client.js';
import type { NotificationRepository } from '../../application/notification-repository.js';
import type { NotificationListItem } from '../../domain/notification.js';
import { notifications } from './schema.js';

export class DrizzleNotificationRepository implements NotificationRepository {
  public constructor(private readonly database: DatabaseExecutor) {}

  public async listForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ readonly rows: readonly NotificationListItem[]; readonly total: number }> {
    const [rows, countRows] = await Promise.all([
      this.database
        .select({
          id: notifications.id,
          channel: notifications.channel,
          type: notifications.type,
          status: notifications.status,
          subject: notifications.subject,
          readAt: notifications.readAt,
          sentAt: notifications.sentAt,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.database.$count(notifications, eq(notifications.userId, userId)),
    ]);
    return { rows, total: countRows };
  }

  public async markRead(
    userId: string,
    notificationId: string,
    executor: DatabaseExecutor,
  ): Promise<boolean> {
    const result = await executor
      .update(notifications)
      .set({ readAt: new Date(), updatedAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return result.length === 1;
  }
}
