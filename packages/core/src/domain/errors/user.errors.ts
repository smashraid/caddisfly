import type { z } from 'zod';

export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export interface ValidationIssue {
  path: string[];
  message: string;
  code?: string;
}

export class DomainValidationError extends DomainError {
  readonly issues: ValidationIssue[];

  constructor(zodIssues: z.ZodError['issues']) {
    const issues = zodIssues.map(i => ({
      path: i.path.map(String),
      message: i.message,
      code: i.code,
    }));
    super(`Validation failed: ${issues.map(i => i.message).join(', ')}`);
    this.issues = issues;
  }
}

export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
  }
}

export class InvalidUserNameError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
  }
}

export class DuplicateEmailError extends DomainError {
  constructor(email: string) {
    super(`Email already in use: ${email}`);
  }
}