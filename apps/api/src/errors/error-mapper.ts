import {
  DomainError,
  DomainValidationError,
  InvalidEmailError,
  InvalidUserNameError,
  DuplicateEmailError,
  UserNotFoundError,
} from '@caddisfly/core';
import { HttpError } from './http-error.js';

/**
 * Maps domain errors to HTTP errors.
 * Centralizes error-to-status-code logic so controllers stay thin.
 */
export function mapDomainErrorToHttp(err: DomainError): HttpError {
  if (err instanceof DomainValidationError) {
    return new HttpError(400, 'Validation Failed', err.issues);
  }

  if (err instanceof InvalidEmailError || err instanceof InvalidUserNameError) {
    return new HttpError(400, err.message);
  }

  if (err instanceof DuplicateEmailError) {
    return new HttpError(409, err.message);
  }

  if (err instanceof UserNotFoundError) {
    return new HttpError(404, err.message);
  }

  // Fallback for any other DomainError
  return new HttpError(400, err.message);
}