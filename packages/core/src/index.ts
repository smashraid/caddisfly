// ─── 1. Domain Entities & Validation Schemas ─────────────────────────────────
export {
  User,
  UserPropsSchema,
  type UserId,
  type UserProps,
} from './domain/entities/user.js';

// ─── 2. Domain Events ────────────────────────────────────────────────────────
export { type IDomainEvent } from './domain/events/user.events.js';
export type {
  UserDomainEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
} from './domain/events/user.events.js';

// ─── 3. Domain Errors ────────────────────────────────────────────────────────
export {
  DomainError,
  DomainValidationError,
  InvalidEmailError,
  InvalidUserNameError,
  UserNotFoundError,
  DuplicateEmailError,
  type ValidationIssue
} from './domain/errors/user.errors.js';

// ─── 4. Application Ports (Interfaces for Drivers) ───────────────────────────
export type {
  IUserRepositoryPort,
  IEventPublisherPort,
  PaginationOptions,
  PaginatedResult,
} from './application/ports/user.ports.js';

export type { IExternalUserHttpPort, ExternalUserProfile } from './application/ports/external-user.port.js'

export type { IEventStorePort } from './application/ports/event-store.port.js'

// ─── 5. Application Use Cases (Executors) ────────────────────────────────────
export { CreateUserUseCase } from './application/use-cases/create-user.js';
export { GetUserUseCase } from './application/use-cases/get-user.js';
export { UpdateUserUseCase } from './application/use-cases/update-user.js';

// ─── 6. Application Contracts (DTO Request / Response Types) ─────────────────
export type {
  CreateUserRequest,
  UpdateUserRequest,
} from './application/contracts/user.request.js';

export type {
  UserResponse,
  UserCreatedResponse,
} from './application/contracts/user.response.js';