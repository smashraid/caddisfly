// Re-export from entities for centralized event access
// All user domain events live in the aggregate, but are accessible here too
export {
  UserCreatedEvent,
  UserUpdatedEvent,
} from '../entities/user.js';

// ─── Domain Event Base Interface ────────────────────────────────────────────
export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}
