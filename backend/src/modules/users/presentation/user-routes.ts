import { Router } from 'express';
import { z } from 'zod';

import type { TransactionManager } from '../../../database/transaction-manager.js';
import type { AuthService } from '../../auth/index.js';
import type { TokenService } from '../../../shared/infrastructure/token-service.js';
import { requireAuth } from '../../../shared/presentation/auth-middleware.js';
import { validate } from '../../../shared/presentation/middleware.js';
import { sendSuccess } from '../../../shared/presentation/response.js';
import type { UserService } from '../application/user-service.js';

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  displayName: z.string().trim().min(1).max(200).optional(),
});

export function createUserRouter(
  users: UserService,
  auth: AuthService,
  tokens: TokenService,
  transactions: TransactionManager,
): Router {
  const router = Router();
  router.use(requireAuth(tokens));
  router.get('/me', async (request, response, next) => {
    try {
      sendSuccess(response, 200, await users.getProfile(request.auth?.userId ?? ''));
    } catch (error) {
      next(error);
    }
  });
  router.patch('/me', validate(updateProfileSchema, 'body'), async (request, response, next) => {
    try {
      const body = request.body as z.infer<typeof updateProfileSchema>;
      const user = await transactions.withinTransaction((transaction) =>
        users.updateProfile(request.auth?.userId ?? '', body, transaction),
      );
      sendSuccess(response, 200, user);
    } catch (error) {
      next(error);
    }
  });
  router.post('/me/deactivate', async (request, response, next) => {
    try {
      await auth.deactivateAccount(request.auth?.userId ?? '');
      sendSuccess(response, 200, { deactivated: true });
    } catch (error) {
      next(error);
    }
  });
  router.delete('/me', async (request, response, next) => {
    try {
      await auth.deleteAccount(request.auth?.userId ?? '');
      sendSuccess(response, 202, { deleted: true });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
