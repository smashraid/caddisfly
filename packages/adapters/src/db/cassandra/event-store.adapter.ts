import { type IEventStorePort, type UserDomainEvent } from '@caddisfly/core';
import type { Client as CassandraClient } from 'cassandra-driver';

export class CassandraEventStoreAdapter implements IEventStorePort {
  constructor(private readonly client: CassandraClient) {}

  async append(aggregateId: string, event: UserDomainEvent): Promise<void> {
    await this.client.execute(
      `INSERT INTO events (aggregate_id, sequence, type, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        aggregateId,
        Date.now(),
        event.eventType,
        JSON.stringify(event),
        event.occurredAt,
      ],
      { prepare: true }
    );
  }

  async getStream(aggregateId: string): Promise<UserDomainEvent[]> {
    const result = await this.client.execute(
      'SELECT payload FROM events WHERE aggregate_id = ? ORDER BY sequence',
      [aggregateId],
      { prepare: true }
    );
    
    return result.rows.map(row => {
      const raw = JSON.parse(row.payload as string);
      return {
        ...raw,
        occurredAt: new Date(raw.occurredAt)
      } as UserDomainEvent;
    });
  }
}