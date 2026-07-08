import type { PostgresConnection } from './connection.js';
export { PostgresUserRepositoryAdapter } from './user-repository.adapter.js';

export async function ensurePostgresTables(connection: PostgresConnection): Promise<void> {
    const sql = connection.getSql();
    await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `;
}