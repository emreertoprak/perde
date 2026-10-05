import type { Request, RequestHandler } from 'express';

import { AuthenticationError, AuthorizationError } from '../domain/app-error.js';
import type { TokenService } from '../infrastructure/token-service.js';
import { requestContext } from '../application/request-context.js';
import type { RoleRepository } from '../../modules/roles/index.js';

export interface AuthPrincipal {
  readonly userId: string;
  readonly sessionId: string;
  readonly sessionFamilyId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthPrincipal;
  }
}

export function currentUserId(request: Request): string {
  const userId = request.auth?.userId;
  if (!userId) throw new AuthenticationError();
  return userId;
}

export function requireAuth(tokens: TokenService): RequestHandler {
  return async (request, _response, next) => {
    const header = request.header('authorization');
    if (!header?.startsWith('Bearer ')) throw new AuthenticationError();
    const claims = await tokens.verifyAccess(header.slice('Bearer '.length));
    request.auth = claims;
    requestContext.setUserId(claims.userId);
    next();
  };
}

function requireGrant(
  fetchSlugs: (userId: string) => Promise<readonly string[]>,
  required: string,
): RequestHandler {
  return async (request, _response, next) => {
    const granted = await fetchSlugs(currentUserId(request));
    if (!granted.includes(required)) throw new AuthorizationError();
    next();
  };
}

export function requireRole(roles: RoleRepository, requiredRole: string): RequestHandler {
  return requireGrant((userId) => roles.getRoleSlugsForUser(userId), requiredRole);
}

export function requirePermission(
  roles: RoleRepository,
  requiredPermission: string,
): RequestHandler {
  return requireGrant((userId) => roles.getPermissionSlugsForUser(userId), requiredPermission);
}
