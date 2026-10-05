import type { DatabaseExecutor } from '../../../database/client.js';
import type { NotificationListItem } from '../domain/notification.js';

export interface NotificationRepository {
  listForUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ readonly rows: readonly NotificationListItem[]; readonly total: number }>;
  markRead(userId: string, notificationId: string, executor: DatabaseExecutor): Promise<boolean>;
}
