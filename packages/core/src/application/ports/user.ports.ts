import { User, UserId, UserDomainEvent } from "../../index.js";

// ─── Shared Shared Pagination Structs ─────────────────────────────────────────
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

// ─── Driven Port: User Persistence ──────────────────────────────────────────
export interface IUserRepositoryPort {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<User>>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}

// ─── Driven Port: Event Publishing ──────────────────────────────────────────
export interface IEventPublisherPort {
  publish(event: UserDomainEvent): Promise<void>;
  publishBatch(events: UserDomainEvent[]): Promise<void>;
}