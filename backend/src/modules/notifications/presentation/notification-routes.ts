import { Router } from 'express';
import { z } from 'zod';

import type { TokenService } from '../../../shared/infrastructure/token-service.js';
import { requireAuth } from '../../../shared/presentation/auth-middleware.js';
import { validate } from '../../../shared/presentation/middleware.js';
import { sendSuccess } from '../../../shared/presentation/response.js';
import type { NotificationService } from '../application/notification-service.js';

const pageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const notificationParams = z.object({ notificationId: z.uuid() });

export function createNotificationRouter(
  notifications: NotificationService,
  tokens: TokenService,
): Router {
  const router = Router();
  router.use(requireAuth(tokens));
  router.get('/', validate(pageSchema, 'query'), async (request, response, next) => {
    try {
      const query = request.query as unknown as z.infer<typeof pageSchema>;
      sendSuccess(
        response,
        200,
        await notifications.listForUser(request.auth?.userId ?? '', query.page, query.limit),
      );
    } catch (error) {
      next(error);
    }
  });
  router.post(
    '/:notificationId/read',
    validate(notificationParams, 'params'),
    async (request, response, next) => {
      try {
        await notifications.markRead(
          request.auth?.userId ?? '',
          String(request.params.notificationId),
        );
        sendSuccess(response, 200, { read: true });
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
