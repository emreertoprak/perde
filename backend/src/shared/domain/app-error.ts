export type ErrorDetails = Record<string, unknown> | readonly unknown[] | null;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ErrorDetails;
  public readonly isOperational: boolean;

  public constructor(
    statusCode: number,
    code: string,
    message: string,
    details: ErrorDetails = null,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

export class ValidationError extends AppError {
  public constructor(message = 'Request validation failed', details: ErrorDetails = null) {
    super(400, 'VALIDATION_FAILED', message, details);
  }
}

export class AuthenticationError extends AppError {
  public constructor(code = 'AUTH_UNAUTHENTICATED', message = 'Authentication is required') {
    super(401, code, message);
  }
}

export class AuthorizationError extends AppError {
  public constructor(
    code = 'AUTH_FORBIDDEN',
    message = 'You do not have permission for this action',
  ) {
    super(403, code, message);
  }
}

export class NotFoundError extends AppError {
  public constructor(
    code = 'RESOURCE_NOT_FOUND',
    message = 'The requested resource was not found',
  ) {
    super(404, code, message);
  }
}

export class ConflictError extends AppError {
  public constructor(
    code = 'RESOURCE_CONFLICT',
    message = 'The requested operation conflicts with current state',
  ) {
    super(409, code, message);
  }
}

export class RateLimitError extends AppError {
  public constructor(message = 'Too many requests') {
    super(429, 'RATE_LIMITED', message);
  }
}

export class ExternalServiceError extends AppError {
  public constructor(
    code = 'EXTERNAL_SERVICE_UNAVAILABLE',
    message = 'A required external service is unavailable',
  ) {
    super(503, code, message);
  }
}
