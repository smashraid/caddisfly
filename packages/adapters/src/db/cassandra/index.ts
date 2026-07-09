export { CassandraUserRepositoryAdapter } from './user-repository.adapter.js';
export { CassandraEventStoreAdapter } from './event-store.adapter.js';

import { type CassandraConnection } from './connection.js';

export async function ensureCassandraTables(connection: CassandraConnection): Promise<void> {
  const client = connection.getClient();

  const statements = [
    `CREATE TABLE IF NOT EXISTS events (
      aggregate_id text,
      sequence bigint,
      type text,
      payload text,
      occurred_at timestamp,
      PRIMARY KEY (aggregate_id, sequence)
    ) WITH CLUSTERING ORDER BY (sequence ASC);`,

    `CREATE TABLE IF NOT EXISTS users (
      id uuid,
      email text,
      name text,
      created_at timestamp,
      updated_at timestamp,
      PRIMARY KEY (id)
    );`
  ];

  for (const query of statements) {
    await client.execute(query);
  }
}