import type { QueueSet } from './queue-service.js';
import type { OutboxRepository } from '../shared/application/outbox-repository.js';
import type { MailMessage } from '../shared/infrastructure/mail-service.js';
import type { EncryptionService } from '../shared/infrastructure/crypto.js';

export class OutboxDispatcher {
  public constructor(
    private readonly outbox: OutboxRepository,
    private readonly queues: QueueSet,
    private readonly encryption: EncryptionService,
  ) {}

  public async dispatch(limit = 100): Promise<number> {
    const events = await this.outbox.findPending(limit);
    for (const event of events) {
      try {
        if (event.eventType === 'mail.send') {
          const payload = event.payload as {
            to: string;
            template: MailMessage['template'];
            encryptedActionUrl: string;
          };
          await this.queues.mail.add(
            'send',
            {
              to: payload.to,
              template: payload.template,
              variables: { actionUrl: this.encryption.decrypt(payload.encryptedActionUrl) },
            },
            { jobId: event.id },
          );
        } else if (event.eventType === 'analytics.track') {
          await this.queues.analytics.add('track', event.payload, { jobId: event.id });
        } else if (event.eventType === 'audit.append') {
          await this.queues.audit.add('append', event.payload, { jobId: event.id });
        } else {
          await this.queues.maintenance.add(event.eventType, event.payload, { jobId: event.id });
        }
        await this.outbox.markPublished(event.id);
      } catch (error) {
        await this.outbox.markFailure(
          event.id,
          error instanceof Error ? error.message : 'Unknown outbox dispatch error',
        );
      }
    }
    return events.length;
  }
}
