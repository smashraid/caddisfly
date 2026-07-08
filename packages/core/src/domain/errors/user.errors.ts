import * as z from "zod";

export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export class DomainValidationError extends DomainError {
  readonly status = 400;
  readonly issues: z.ZodError['issues'];
  constructor(issues: z.ZodError['issues']) {
    super(`Validation failed: ${issues.map(i => i.message).join(', ')}`);
    this.issues = issues;
  }
}

export class InvalidEmailError extends Error {
  readonly status = 404;
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
    this.name = 'InvalidEmailError';
  }
}

export class InvalidUserNameError extends Error {
  readonly status = 404;
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserNameError';
  }
}

export class UserNotFoundError extends Error {
  readonly status = 404;
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class DuplicateEmailError extends Error {
  readonly status = 409;
  constructor(email: string) {
    super(`Email already in use: ${email}`);
    this.name = 'DuplicateEmailError';
  }
}