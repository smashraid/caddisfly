// ─── Domain: Entities & Value Objects ───────────────────────────────────────
export {
  User,
  UserId,
  Email,
  UserName,
  type UserProps,
} from './domain/entities/user.js';

// ─── Domain: Events ───────────────────────────────────────────────────────────
export {
  UserCreatedEvent,
  UserUpdatedEvent,
  type DomainEvent,
} from './domain/events/user.events.js';

// ─── Domain: Errors ───────────────────────────────────────────────────────────
export {
  DomainError,
  InvalidEmailError,
  InvalidUserNameError,
  UserNotFoundError,
  DuplicateEmailError,
} from './domain/errors/user.errors.js';

// ─── Application: Ports (Driving & Driven Interfaces) ─────────────────────────
export type {
  IUserRepository,
  IEventPublisher,
  IUserOperations,
  PaginationOptions,
  PaginatedResult,
} from './application/ports/user.ports.js';

// ─── Application: Contracts (Request / Response DTOs) ─────────────────────────
export type {
  CreateUserRequest,
  UpdateUserRequest,
  ListUsersRequest,
} from './application/contracts/user.request.js';

export type {
  UserResponse,
  UserCreatedResponse,
  PaginatedUsersResponse,
} from './application/contracts/user.response.js';

// ─── Application: Use Cases ───────────────────────────────────────────────────
export { CreateUserUseCase } from './application/use-cases/create-user.js';
export { GetUserUseCase } from './application/use-cases/get-user.js';
export { UpdateUserUseCase } from './application/use-cases/update-user.js';
