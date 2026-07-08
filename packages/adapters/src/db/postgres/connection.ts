import postgres, { type Sql } from 'postgres';

export interface PostgresConnectionConfig {
  url: string;
}

export class PostgresConnection {
  private sql: Sql | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly config: PostgresConnectionConfig) {}

  async connect(): Promise<void> {
    if (this.sql) return;
    
    if (!this.connectPromise) {
      this.connectPromise = (async () => {
        this.sql = postgres(this.config.url);
        await this.sql`SELECT 1`;
      })();
    }
    await this.connectPromise;
  }

  getSql(): Sql {
    if (!this.sql) {
      throw new Error('PostgresConnection: getSql() called before connect() resolved');
    }
    return this.sql;
  }

  async close(): Promise<void> {
    if (this.sql) {
      await this.sql.end();
      this.sql = null;
    }
    this.connectPromise = null;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.sql) return false;
    try {
      await this.sql`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}