import type { User, UserId, Email } from '../../domain/entities/user.js';
import type { DomainEvent } from '../../domain/events/user.events.js';

// ─── Driven Port: User Persistence ──────────────────────────────────────────
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<User>>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Driven Port: Event Publishing ──────────────────────────────────────────
export interface IEventPublisher {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  publishBatch<T extends DomainEvent>(events: T[]): Promise<void>;
}

// ─── Driving Port: User Operations (optional, for hexagonal clarity) ──────
export interface IUserOperations {
  create(input: CreateUserRequest): Promise<UserResponse>;
  get(id: string): Promise<UserResponse>;
  update(id: string, input: UpdateUserRequest): Promise<UserResponse>;
}

// Inline contracts for port interface
interface CreateUserRequest {
  email: string;
  name: string;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
