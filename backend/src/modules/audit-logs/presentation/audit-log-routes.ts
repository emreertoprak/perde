import { Router } from 'express';
import { z } from 'zod';

import type { RoleRepository } from '../../roles/index.js';
import type { TokenService } from '../../../shared/infrastructure/token-service.js';
import { requireAuth, requirePermission } from '../../../shared/presentation/auth-middleware.js';
import { validate } from '../../../shared/presentation/middleware.js';
import { sendSuccess } from '../../../shared/presentation/response.js';
import type { AuditLogService } from '../application/audit-log-service.js';

const pageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function createAuditLogRouter(
  auditLogs: AuditLogService,
  tokens: TokenService,
  roles: RoleRepository,
): Router {
  const router = Router();
  router.get(
    '/',
    requireAuth(tokens),
    requirePermission(roles, 'audit-logs.read'),
    validate(pageSchema, 'query'),
    async (request, response, next) => {
      try {
        const query = request.query as unknown as z.infer<typeof pageSchema>;
        sendSuccess(response, 200, await auditLogs.list(query.page, query.limit));
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
