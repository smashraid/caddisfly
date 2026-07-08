// Re-export from entities for centralized error access
export {
  InvalidEmailError,
  InvalidUserNameError,
  UserNotFoundError,
  DuplicateEmailError,
} from '../entities/user.js';

// ─── Base Domain Error ──────────────────────────────────────────────────────
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}
