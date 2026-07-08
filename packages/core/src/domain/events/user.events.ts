import { UserId } from '../entities/user.js';

// ─── Domain Event Base Interface ────────────────────────────────────────────
export interface IDomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: UserId;
}

// ─── Specific User Event Payloads ───────────────────────────────────────────
export interface UserCreatedEvent extends IDomainEvent {
  readonly eventType: 'UserCreated';
  readonly email: string;
  readonly name: string;
}

export interface UserUpdatedEvent extends IDomainEvent {
  readonly eventType: 'UserUpdated';
  readonly changes: Partial<{ email: string; name: string }>;
}

// ─── Centralized Type Export ────────────────────────────────────────────────
export type UserDomainEvent = UserCreatedEvent | UserUpdatedEvent;