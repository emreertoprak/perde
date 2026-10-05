import type { CookieOptions } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import type { AppConfig } from '../../../config/env.js';
import { AuthenticationError } from '../../../shared/domain/app-error.js';
import type { CsrfService } from '../../../shared/infrastructure/csrf.js';
import type { TokenService } from '../../../shared/infrastructure/token-service.js';
import { requireAuth } from '../../../shared/presentation/auth-middleware.js';
import { validate } from '../../../shared/presentation/middleware.js';
import { sendSuccess } from '../../../shared/presentation/response.js';
import type { AuthService } from '../application/auth-service.js';
import { toPublicUser } from '../../users/domain/user.js';

const clientTypeSchema = z.enum(['web', 'mobile']).default('web');
const registerSchema = z.object({
  email: z.email(),
  password: z.string(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  displayName: z.string().trim().min(1).max(200).optional(),
});
const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
  clientType: clientTypeSchema,
  deviceId: z.string().trim().max(255).optional(),
  deviceName: z.string().trim().max(255).optional(),
  platform: z.string().trim().max(100).optional(),
});
const refreshSchema = z.object({
  refreshToken: z.string().min(20).optional(),
  clientType: clientTypeSchema,
});
const tokenSchema = z.object({ token: z.string().min(20) });
const resetSchema = z.object({ token: z.string().min(20), password: z.string() });
const passwordChangeSchema = z.object({ currentPassword: z.string(), newPassword: z.string() });
const emailSchema = z.object({ email: z.email() });

function cookieName(config: AppConfig): string {
  return !config.isProduction || config.COOKIE_DOMAIN
    ? config.REFRESH_COOKIE_NAME
    : `__Host-${config.REFRESH_COOKIE_NAME}`;
}

function csrfCookieName(config: AppConfig): string {
  return !config.isProduction || config.COOKIE_DOMAIN
    ? `${config.REFRESH_COOKIE_NAME}_csrf`
    : `__Host-${config.REFRESH_COOKIE_NAME}_csrf`;
}

function refreshCookieOptions(config: AppConfig): CookieOptions {
  const options: CookieOptions = {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: config.JWT_REFRESH_EXPIRES_IN_SECONDS * 1_000,
    path: '/',
  };
  if (config.COOKIE_DOMAIN) options.domain = config.COOKIE_DOMAIN;
  return options;
}

function csrfCookieOptions(config: AppConfig): CookieOptions {
  const options: CookieOptions = {
    httpOnly: false,
    secure: config.isProduction,
    sameSite: 'strict',
    maxAge: config.JWT_REFRESH_EXPIRES_IN_SECONDS * 1_000,
    path: '/',
  };
  if (config.COOKIE_DOMAIN) options.domain = config.COOKIE_DOMAIN;
  return options;
}

function deviceFrom(request: {
  ip?: string | undefined;
  header(name: string): string | undefined;
  body: unknown;
}) {
  const body = loginSchema.partial().safeParse(request.body).data;
  return {
    deviceId: body?.deviceId,
    deviceName: body?.deviceName,
    platform: body?.platform,
    userAgent: request.header('user-agent'),
    ipAddress: request.ip,
  };
}

function readRefreshToken(
  request: { cookies: Record<string, unknown>; body: unknown },
  config: AppConfig,
): string {
  const fromCookie = request.cookies[cookieName(config)];
  const parsedBody = refreshSchema.safeParse(request.body);
  const fromBody = parsedBody.success ? parsedBody.data.refreshToken : undefined;
  if (typeof fromCookie === 'string') return fromCookie;
  if (fromBody) return fromBody;
  throw new AuthenticationError('AUTH_REFRESH_TOKEN_REQUIRED', 'Refresh token is required');
}

function hasRefreshCookie(request: { cookies: unknown }, config: AppConfig): boolean {
  const cookies = request.cookies as Record<string, unknown>;
  return typeof cookies[cookieName(config)] === 'string';
}

function assertCookieRequestIntegrity(
  request: { header(name: string): string | undefined },
  config: AppConfig,
  csrf: CsrfService,
  refreshToken: string,
): void {
  const origin = request.header('origin');
  const fetchSite = request.header('sec-fetch-site');
  if (
    !origin ||
    !config.corsOrigins.includes(origin) ||
    fetchSite === 'cross-site' ||
    !csrf.verify(refreshToken, request.header('x-csrf-token') ?? '')
  ) {
    throw new AuthenticationError('AUTH_CSRF_INVALID', 'CSRF token is invalid');
  }
}

export function createAuthRouter(
  config: AppConfig,
  auth: AuthService,
  tokens: TokenService,
  csrf: CsrfService,
): Router {
  const router = Router();
  router.post('/register', validate(registerSchema, 'body'), async (request, response, next) => {
    try {
      const result = await auth.register(request.body as z.infer<typeof registerSchema>);
      sendSuccess(response, 201, { user: toPublicUser(result.user) });
    } catch (error) {
      next(error);
    }
  });
  router.post('/login', validate(loginSchema, 'body'), async (request, response, next) => {
    try {
      const body = request.body as z.infer<typeof loginSchema>;
      const result = await auth.login({
        email: body.email,
        password: body.password,
        device: deviceFrom(request),
      });
      if (body.clientType === 'web') {
        response.cookie(cookieName(config), result.refreshToken, refreshCookieOptions(config));
        response.cookie(
          csrfCookieName(config),
          csrf.issue(result.refreshToken),
          csrfCookieOptions(config),
        );
      }
      sendSuccess(response, 200, {
        accessToken: result.accessToken,
        accessTokenExpiresIn: result.accessTokenExpiresIn,
        ...(body.clientType === 'mobile'
          ? {
              refreshToken: result.refreshToken,
              refreshTokenExpiresIn: result.refreshTokenExpiresIn,
            }
          : {}),
      });
    } catch (error) {
      next(error);
    }
  });
  router.post('/refresh', validate(refreshSchema, 'body'), async (request, response, next) => {
    try {
      const body = request.body as z.infer<typeof refreshSchema>;
      const refreshToken = readRefreshToken(request, config);
      if (hasRefreshCookie(request, config))
        assertCookieRequestIntegrity(request, config, csrf, refreshToken);
      const result = await auth.refresh(refreshToken, deviceFrom(request));
      if (body.clientType === 'web') {
        response.cookie(cookieName(config), result.refreshToken, refreshCookieOptions(config));
        response.cookie(
          csrfCookieName(config),
          csrf.issue(result.refreshToken),
          csrfCookieOptions(config),
        );
      }
      sendSuccess(response, 200, {
        accessToken: result.accessToken,
        accessTokenExpiresIn: result.accessTokenExpiresIn,
        ...(body.clientType === 'mobile'
          ? {
              refreshToken: result.refreshToken,
              refreshTokenExpiresIn: result.refreshTokenExpiresIn,
            }
          : {}),
      });
    } catch (error) {
      next(error);
    }
  });
  router.post('/logout', async (request, response, next) => {
    try {
      const refreshToken = readRefreshToken(request, config);
      if (hasRefreshCookie(request, config))
        assertCookieRequestIntegrity(request, config, csrf, refreshToken);
      await auth.logout(refreshToken);
      response.clearCookie(cookieName(config), refreshCookieOptions(config));
      response.clearCookie(csrfCookieName(config), csrfCookieOptions(config));
      sendSuccess(response, 200, { loggedOut: true });
    } catch (error) {
      next(error);
    }
  });
  router.post('/logout-all', requireAuth(tokens), async (request, response, next) => {
    try {
      if (hasRefreshCookie(request, config)) {
        const cookies = request.cookies as Record<string, unknown>;
        assertCookieRequestIntegrity(request, config, csrf, cookies[cookieName(config)] as string);
      }
      await auth.logoutAll(request.auth?.userId ?? '');
      response.clearCookie(cookieName(config), refreshCookieOptions(config));
      response.clearCookie(csrfCookieName(config), csrfCookieOptions(config));
      sendSuccess(response, 200, { loggedOut: true });
    } catch (error) {
      next(error);
    }
  });
  router.post(
    '/email-verification/confirm',
    validate(tokenSchema, 'body'),
    async (request, response, next) => {
      try {
        await auth.verifyEmail((request.body as z.infer<typeof tokenSchema>).token);
        sendSuccess(response, 200, { verified: true });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    '/email-verification/request',
    requireAuth(tokens),
    async (request, response, next) => {
      try {
        await auth.requestEmailVerification(request.auth?.userId ?? '');
        sendSuccess(response, 202, { requested: true });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post(
    '/password/forgot',
    validate(emailSchema, 'body'),
    async (request, response, next) => {
      try {
        await auth.requestPasswordReset((request.body as z.infer<typeof emailSchema>).email);
        sendSuccess(response, 202, { requested: true });
      } catch (error) {
        next(error);
      }
    },
  );
  router.post('/password/reset', validate(resetSchema, 'body'), async (request, response, next) => {
    try {
      const body = request.body as z.infer<typeof resetSchema>;
      await auth.resetPassword(body.token, body.password);
      sendSuccess(response, 200, { reset: true });
    } catch (error) {
      next(error);
    }
  });
  router.post(
    '/password/change',
    requireAuth(tokens),
    validate(passwordChangeSchema, 'body'),
    async (request, response, next) => {
      try {
        const body = request.body as z.infer<typeof passwordChangeSchema>;
        await auth.changePassword(
          request.auth?.userId ?? '',
          body.currentPassword,
          body.newPassword,
        );
        sendSuccess(response, 200, { changed: true });
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
