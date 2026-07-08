import { 
  type IUserRepositoryPort, 
  type PaginatedResult, 
  type UserId, 
  User 
} from '@caddisfly/core';
import postgres, {type Sql } from 'postgres';

interface UserRow {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export class PostgresUserRepositoryAdapter implements IUserRepositoryPort {
  private readonly sql: Sql
  constructor(connectionString: string) {
    this.sql = postgres(connectionString);
  }

  async close(): Promise<void> {
    await this.sql.end();
  }

  async findById(id: UserId): Promise<User | null> {
    const [row] = await this.sql<UserRow[]>`
      SELECT id, email, name, created_at, updated_at 
      FROM users 
      WHERE id = ${id}
    `;
    
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.sql<UserRow[]>`
      SELECT id, email, name, created_at, updated_at 
      FROM users 
      WHERE email = ${email}
    `;
    
    return row ? this.toDomain(row) : null;
  }

  async findAll(options?: { limit: number; offset: number }): Promise<PaginatedResult<User>> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const [rows, countRows] = await Promise.all([
      this.sql<UserRow[]>`
        SELECT id, email, name, created_at, updated_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `,
      this.sql<{ count: string }[]>`
        SELECT COUNT(*) FROM users
      `
    ]);

    const totalCount = countRows[0]?.count ? parseInt(countRows[0].count, 10) : 0;

    return {
      data: rows.map(r => this.toDomain(r)),
      total: totalCount,
      limit,
      offset,
    };
  }

  async save(user: User): Promise<void> {
    await this.sql`
      INSERT INTO users (id, email, name, created_at, updated_at)
      VALUES (${user.id}, ${user.email}, ${user.name}, ${user.createdAt}, ${user.updatedAt})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = EXCLUDED.updated_at
    `;
  }

  async delete(id: UserId): Promise<void> {
    await this.sql`
      DELETE FROM users 
      WHERE id = ${id}
    `;
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