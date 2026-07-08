import type { IUserRepository, PaginatedResult } from '@caddisfly/core';
import { User, UserId, Email } from '@caddisfly/core';
import type { Pool, PoolClient } from 'pg';

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export class PostgresUserRepository implements IUserRepository {
  constructor(private pool: Pool) {}

  async findById(id: UserId): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [id.toString()]
    );
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE email = $1',
      [email.toString()]
    );
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findAll(options?: { limit: number; offset: number }): Promise<PaginatedResult<User>> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const [dataResult, countResult] = await Promise.all([
      this.pool.query<UserRow>(
        'SELECT id, email, name, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      ),
      this.pool.query<{ count: string }>('SELECT COUNT(*) FROM users'),
    ]);

    return {
      data: dataResult.rows.map(r => this.toDomain(r)),
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset,
    };
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      `INSERT INTO users (id, email, name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         name = EXCLUDED.name,
         updated_at = EXCLUDED.updated_at`,
      [
        user.id.toString(),
        user.email.toString(),
        user.name.toString(),
        user.createdAt,
        user.updatedAt,
      ]
    );
  }

  async delete(id: UserId): Promise<void> {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id.toString()]);
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

export { PostgresUserRepository as UserRepository };
