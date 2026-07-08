export { CassandraUserRepositoryAdapter } from './user-repository.adapter.js';
export { CassandraEventStoreAdapter } from './event-store.adapter.js';

import { type CassandraConnection } from './connection.js';

export async function ensureCassandraTables(connection: CassandraConnection): Promise<void> {
    const client = connection.getClient();
    await client.execute(`
    CREATE TABLE IF NOT EXISTS events (
      aggregate_id text,
      sequence bigint,
      type text,
      payload text,
      occurred_at timestamp,
      PRIMARY KEY (aggregate_id, sequence)
    ) WITH CLUSTERING ORDER BY (sequence ASC);
  `);
}