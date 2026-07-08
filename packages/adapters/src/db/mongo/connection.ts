import { MongoClient, type Db } from 'mongodb';

export interface MongoConnectionConfig {
  uri: string;
  dbName: string;
}

export class MongoConnection {
  private client: MongoClient;
  private db: Db | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly config: MongoConnectionConfig) {
    this.client = new MongoClient(this.config.uri);
  }

  // Idempotent + concurrency-safe: concurrent callers await the same in-flight connect
  async connect(): Promise<void> {
    if (this.db) return;
    if (!this.connectPromise) {
      this.connectPromise = this.client.connect().then(() => {
        this.db = this.client.db(this.config.dbName);
      });
    }
    await this.connectPromise;
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('MongoConnection: getDb() called before connect() resolved');
    }
    return this.db;
  }

  async close(): Promise<void> {
    await this.client.close();
    this.db = null;
    this.connectPromise = null;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.db) return false;
    try {
      await this.db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }
}