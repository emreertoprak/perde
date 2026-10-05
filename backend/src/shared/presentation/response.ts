import type { Response } from 'express';

import type { ErrorDetails } from '../domain/app-error.js';
import { requestContext } from '../application/request-context.js';

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export function sendSuccess(
  response: Response,
  statusCode: number,
  data: unknown,
  meta?: PaginationMeta,
): void {
  const context = requestContext.get();
  response.status(statusCode).json({
    success: true,
    data,
    meta: { ...meta, requestId: context?.requestId ?? null },
  });
}

export function errorBody(code: string, message: string, details: ErrorDetails = null) {
  const context = requestContext.get();
  return {
    success: false as const,
    error: { code, message, details, requestId: context?.requestId ?? null },
  };
}

export function sendError(
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  details: ErrorDetails = null,
): void {
  response.status(statusCode).json(errorBody(code, message, details));
}
