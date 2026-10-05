import { Router } from 'express';
import { z } from 'zod';

import type { AuthService } from '../../auth/index.js';
import type { TokenService } from '../../../shared/infrastructure/token-service.js';
import { requireAuth } from '../../../shared/presentation/auth-middleware.js';
import { validate } from '../../../shared/presentation/middleware.js';
import { sendSuccess } from '../../../shared/presentation/response.js';

const sessionParamSchema = z.object({ sessionId: z.uuid() });

export function createSessionRouter(auth: AuthService, tokens: TokenService): Router {
  const router = Router();
  router.use(requireAuth(tokens));
  router.get('/', async (request, response, next) => {
    try {
      const sessions = await auth.listSessions(request.auth?.userId ?? '');
      sendSuccess(
        response,
        200,
        sessions.map((session) => ({
          id: session.id,
          tokenFamilyId: session.tokenFamilyId,
          deviceId: session.deviceId,
          deviceName: session.deviceName,
          platform: session.platform,
          ipAddress: session.ipAddress,
          lastUsedAt: session.lastUsedAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          createdAt: session.createdAt.toISOString(),
        })),
      );
    } catch (error) {
      next(error);
    }
  });
  router.delete(
    '/:sessionId',
    validate(sessionParamSchema, 'params'),
    async (request, response, next) => {
      try {
        await auth.revokeSession(request.auth?.userId ?? '', String(request.params.sessionId));
        sendSuccess(response, 200, { revoked: true });
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
