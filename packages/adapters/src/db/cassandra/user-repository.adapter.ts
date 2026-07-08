import {
  type IUserRepositoryPort,
  type PaginatedResult,
  type UserId,
  User
} from '@caddisfly/core';
import { Client } from 'cassandra-driver';

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export class CassandraUserRepositoryAdapter implements IUserRepositoryPort {
  constructor(private client: Client) { }

  async findById(id: UserId): Promise<User | null> {
    const result = await this.client.execute(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [id],
      { prepare: true }
    );
    const row = result.rows[0];
    return row ? this.toDomain(row as unknown as UserRow) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.client.execute(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE email = ? ALLOW FILTERING',
      [email],
      { prepare: true }
    );
    const row = result.rows[0];
    return row ? this.toDomain(row as unknown as UserRow) : null;
  }

  async findAll(options?: { limit: number; offset: number }): Promise<PaginatedResult<User>> {
    const limit = options?.limit ?? 20;
    const result = await this.client.execute(
      'SELECT id, email, name, created_at, updated_at FROM users LIMIT ?',
      [limit],
      { prepare: true }
    );

    return {
      data: result.rows.map(r => this.toDomain(r as unknown as UserRow)),
      total: result.rows.length,
      limit,
      offset: options?.offset ?? 0,
    };
  }

  async save(user: User): Promise<void> {
    await this.client.execute(
      `INSERT INTO users (id, email, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email,
        user.name,
        user.createdAt,
        user.updatedAt,
      ],
      { prepare: true }
    );
  }

  async delete(id: UserId): Promise<void> {
    await this.client.execute(
      'DELETE FROM users WHERE id = ?',
      [id],
      { prepare: true }
    );
  }

  private toDomain(row: UserRow): User {
    return User.reconstitute({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}