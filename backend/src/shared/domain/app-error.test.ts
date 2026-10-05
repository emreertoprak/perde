import { describe, expect, it } from 'vitest';

import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from './app-error.js';

describe('application errors', () => {
  it('retains operational metadata and custom details', () => {
    const cause = new Error('root cause');
    const error = new AppError(418, 'TEAPOT', 'short and stout', { field: 'value' }, { cause });
    expect(error).toMatchObject({
      name: 'AppError',
      statusCode: 418,
      code: 'TEAPOT',
      details: { field: 'value' },
      isOperational: true,
      cause,
    });
  });

  it('provides stable defaults for all public subclasses', () => {
    expect(new ValidationError()).toMatchObject({ statusCode: 400, code: 'VALIDATION_FAILED' });
    expect(new AuthenticationError()).toMatchObject({
      statusCode: 401,
      code: 'AUTH_UNAUTHENTICATED',
    });
    expect(new AuthorizationError()).toMatchObject({ statusCode: 403, code: 'AUTH_FORBIDDEN' });
    expect(new NotFoundError()).toMatchObject({ statusCode: 404, code: 'RESOURCE_NOT_FOUND' });
    expect(new ConflictError()).toMatchObject({ statusCode: 409, code: 'RESOURCE_CONFLICT' });
    expect(new RateLimitError()).toMatchObject({ statusCode: 429, code: 'RATE_LIMITED' });
    expect(new ExternalServiceError()).toMatchObject({
      statusCode: 503,
      code: 'EXTERNAL_SERVICE_UNAVAILABLE',
    });
  });

  it('accepts explicit subclass codes and messages', () => {
    expect(new AuthenticationError('AUTH_LOCKED', 'Account temporarily locked')).toMatchObject({
      code: 'AUTH_LOCKED',
      message: 'Account temporarily locked',
    });
    expect(new ValidationError('Invalid input', [{ path: 'email' }]).details).toEqual([
      { path: 'email' },
    ]);
  });
});
