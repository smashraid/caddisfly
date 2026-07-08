import { Client as CassandraClient } from 'cassandra-driver';

export interface CassandraConnectionConfig {
  contactPoints: string[];
  localDataCenter: string;
  keyspace: string;
}

export class CassandraConnection {
  private client: CassandraClient;
  private isConnected = false;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly config: CassandraConnectionConfig) {
    this.client = new CassandraClient({
      contactPoints: this.config.contactPoints,
      localDataCenter: this.config.localDataCenter,
      keyspace: this.config.keyspace,
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    if (!this.connectPromise) {
      this.connectPromise = (async () => {
        await this.client.connect();
        this.isConnected = true;
      })();
    }
    await this.connectPromise;
  }

  getClient(): CassandraClient {
    if (!this.isConnected) {
      throw new Error('CassandraConnection: getClient() called before connect() resolved');
    }
    return this.client;
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.shutdown();
      this.isConnected = false;
    }
    this.connectPromise = null;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      // Execute metadata payload synchronization query to verify health
      await this.client.execute('SELECT now() FROM system.local');
      return true;
    } catch {
      return false;
    }
  }
}