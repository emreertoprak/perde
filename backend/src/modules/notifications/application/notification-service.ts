import { NotFoundError } from '../../../shared/domain/app-error.js';
import type { TransactionManager } from '../../../database/transaction-manager.js';
import type { NotificationPage } from '../domain/notification.js';
import type { NotificationRepository } from './notification-repository.js';

export class NotificationService {
  public constructor(
    private readonly repository: NotificationRepository,
    private readonly transactions: TransactionManager,
  ) {}

  public async listForUser(userId: string, page: number, limit: number): Promise<NotificationPage> {
    const result = await this.repository.listForUser(userId, page, limit);
    return { items: result.rows, page, limit, total: result.total };
  }

  public async markRead(userId: string, notificationId: string): Promise<void> {
    const updated = await this.transactions.withinTransaction((transaction) =>
      this.repository.markRead(userId, notificationId, transaction),
    );
    if (!updated) throw new NotFoundError('NOTIFICATION_NOT_FOUND', 'Notification was not found');
  }
}
