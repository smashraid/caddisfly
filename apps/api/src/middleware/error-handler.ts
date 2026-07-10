import type { Request, Response } from 'express';
import { DomainError } from '@caddisfly/core';
import { HttpError } from '../errors/http-error.js';
import { mapDomainErrorToHttp } from '../errors/error-mapper.js';

/**
 * Global Express error handler.
 * Catches errors thrown from controllers/routes and sends consistent JSON responses.
 */
export function globalErrorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
): void {
  console.error('❌ Unhandled error:', err);

  if (err instanceof HttpError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  if (err instanceof DomainError) {
    const httpError = mapDomainErrorToHttp(err);
    res.status(httpError.statusCode).json(httpError.toResponse());
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
}