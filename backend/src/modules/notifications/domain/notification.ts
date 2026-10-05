export interface NotificationListItem {
  readonly id: string;
  readonly channel: string;
  readonly type: string;
  readonly status: string;
  readonly subject: string | null;
  readonly readAt: Date | null;
  readonly sentAt: Date | null;
  readonly createdAt: Date;
}

export interface NotificationPage {
  readonly items: readonly NotificationListItem[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}
