import type { IUserRepository, PaginatedResult } from '@caddisfly/core';
import { User, UserId, Email } from '@caddisfly/core';
import type { Client } from 'cassandra-driver';

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export class CassandraUserRepository implements IUserRepository {
  constructor(private client: Client) {}

  async findById(id: UserId): Promise<User | null> {
    const result = await this.client.execute(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [id.toString()],
      { prepare: true }
    );
    const row = result.rows[0];
    return row ? this.toDomain(row as unknown as UserRow) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    // Cassandra requires a secondary index or separate table for email lookups
    // Using ALLOW FILTERING for simplicity — in production, use a lookup table
    const result = await this.client.execute(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE email = ? ALLOW FILTERING',
      [email.toString()],
      { prepare: true }
    );
    const row = result.rows[0];
    return row ? this.toDomain(row as unknown as UserRow) : null;
  }

  async findAll(options?: { limit: number; offset: number }): Promise<PaginatedResult<User>> {
    const limit = options?.limit ?? 20;
    // Cassandra doesn't support OFFSET — use token paging in production
    const result = await this.client.execute(
      'SELECT id, email, name, created_at, updated_at FROM users LIMIT ?',
      [limit],
      { prepare: true }
    );

    return {
      data: result.rows.map(r => this.toDomain(r as unknown as UserRow)),
      total: result.rows.length, // Approximate — Cassandra doesn't do exact counts efficiently
      limit,
      offset: options?.offset ?? 0,
    };
  }

  async save(user: User): Promise<void> {
    await this.client.execute(
      `INSERT INTO users (id, email, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id.toString(),
        user.email.toString(),
        user.name.toString(),
        user.createdAt,
        user.updatedAt,
      ],
      { prepare: true }
    );
  }

  async delete(id: UserId): Promise<void> {
    await this.client.execute(
      'DELETE FROM users WHERE id = ?',
      [id.toString()],
      { prepare: true }
    );
  }

  private toDomain(row: UserRow): User {
    return User.reconstitute({
      id: UserId.create(row.id),
      email: Email.create(row.email),
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

export { CassandraUserRepository as UserRepository };
