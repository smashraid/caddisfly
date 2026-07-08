import * as z from "zod";

export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export class DomainValidationError extends DomainError {
  readonly issues: z.ZodError['issues'];
  constructor(issues: z.ZodError['issues']) {
    super(`Validation failed: ${issues.map(i => i.message).join(', ')}`);
    this.issues = issues;
  }
}

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
    this.name = 'InvalidEmailError';
  }
}

export class InvalidUserNameError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserNameError';
  }
}

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class DuplicateEmailError extends DomainError {
  constructor(email: string) {
    super(`Email already in use: ${email}`);
    this.name = 'DuplicateEmailError';
  }
}