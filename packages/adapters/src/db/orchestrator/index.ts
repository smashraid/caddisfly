import { type IUserRepositoryPort, type IEventStorePort } from '@caddisfly/core';
import postgres, { type Sql } from 'postgres';
import { Client as CassandraClient } from 'cassandra-driver';
import { PostgresUserRepositoryAdapter } from '../postgres/user-repository.adapter.js';
import { CassandraEventStoreAdapter } from '../cassandra/index.js';

export interface DbOrchestrator {
  readonly users: IUserRepositoryPort;
  readonly events: IEventStorePort;
  close(): Promise<void>;
}

export class PostgresCassandraOrchestrator implements DbOrchestrator {
  public readonly users: IUserRepositoryPort;
  public readonly events: IEventStorePort;

  private constructor(
    private readonly sql: Sql,
    private readonly cassandraClient: CassandraClient,
  ) {
    this.users = new PostgresUserRepositoryAdapter(sql);
    this.events = new CassandraEventStoreAdapter(cassandraClient);
  }

  static async create(config: {
    postgres: { host: string; port: number; database: string; user: string; password: string };
    cassandra: { contactPoints: string[]; keyspace: string; localDataCenter: string };
  }): Promise<PostgresCassandraOrchestrator> {
    const sql = postgres({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      username: config.postgres.user,
      password: config.postgres.password,
    });

    const cassandraClient = new CassandraClient({
      contactPoints: config.cassandra.contactPoints,
      localDataCenter: config.cassandra.localDataCenter,
      keyspace: config.cassandra.keyspace,
    });
    
    await cassandraClient.connect();

    return new PostgresCassandraOrchestrator(sql, cassandraClient);
  }

  async close(): Promise<void> {
    await Promise.all([
      this.sql.end(),
      this.cassandraClient.shutdown()
    ]);
  }
}