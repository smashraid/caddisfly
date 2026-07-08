import { type UserDomainEvent } from '../../domain/events/user.events.js';

export interface IEventStorePort {
  append(aggregateId: string, event: UserDomainEvent): Promise<void>;
  getStream(aggregateId: string): Promise<UserDomainEvent[]>;
}