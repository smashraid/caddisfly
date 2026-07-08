import type { IUserRepository, PaginatedResult, User } from '@caddisfly/core';
import { UserId, Email } from '@caddisfly/core';
import type { Pool } from 'pg';
import type { Client as CassandraClient } from 'cassandra-driver';
import { MongoClient, type Db } from 'mongodb';
import { PostgresUserRepository } from '../postgres/user-repository.js';
import { CassandraUserRepository } from '../cassandra/user-repository.js';

// ─── Orchestrator Interface ─────────────────────────────────────────────────
export interface DbOrchestrator {
  users: IUserRepository;
  events: IEventStore; // Event sourcing via Cassandra
  close(): Promise<void>;
}

export interface IEventStore {
  append(aggregateId: string, event: unknown): Promise<void>;
  getStream(aggregateId: string): Promise<unknown[]>;
}

// ─── Postgres + Cassandra Orchestrator ────────────────────────────────────────
export class PostgresCassandraOrchestrator implements DbOrchestrator {
  users: IUserRepository;
  events: IEventStore;

  private constructor(
    private pgPool: Pool,
    private cassandraClient: CassandraClient,
  ) {
    this.users = new PostgresUserRepository(pgPool);
    this.events = new CassandraEventStore(cassandraClient);
  }

  static async create(config: {
    postgres: { host: string; port: number; database: string; user: string; password: string };
    cassandra: { contactPoints: string[]; keyspace: string; localDataCenter: string };
  }): Promise<PostgresCassandraOrchestrator> {
    const { Pool } = await import('pg');
    const pgPool = new Pool(config.postgres);

    const { Client } = await import('cassandra-driver');
    const cassandraClient = new Client({
      contactPoints: config.cassandra.contactPoints,
      localDataCenter: config.cassandra.localDataCenter,
      keyspace: config.cassandra.keyspace,
    });
    await cassandraClient.connect();

    return new PostgresCassandraOrchestrator(pgPool, cassandraClient);
  }

  async close(): Promise<void> {
    await this.pgPool.end();
    await this.cassandraClient.shutdown();
  }
}

// ─── Mongo + Cassandra Orchestrator ───────────────────────────────────────────
export class MongoCassandraOrchestrator implements DbOrchestrator {
  users: IUserRepository;
  events: IEventStore;

  private constructor(
    private mongoClient: MongoClient,
    private cassandraClient: CassandraClient,
  ) {
    this.users = new (await import('../mongo/user-repository.js')).MongoUserRepository(
      mongoClient.db('myapp')
    );
    this.events = new CassandraEventStore(cassandraClient);
  }

  static async create(config: {
    mongoUri: string;
    cassandra: { contactPoints: string[]; keyspace: string; localDataCenter: string };
  }): Promise<MongoCassandraOrchestrator> {
    const { MongoClient } = await import('mongodb');
    const mongoClient = new MongoClient(config.mongoUri);
    await mongoClient.connect();

    const { Client } = await import('cassandra-driver');
    const cassandraClient = new Client({
      contactPoints: config.cassandra.contactPoints,
      localDataCenter: config.cassandra.localDataCenter,
      keyspace: config.cassandra.keyspace,
    });
    await cassandraClient.connect();

    const instance = new MongoCassandraOrchestrator(mongoClient, cassandraClient);
    // Lazy init the users repo since constructor can't be async
    const { MongoUserRepository } = await import('../mongo/user-repository.js');
    (instance as any).users = new MongoUserRepository(mongoClient.db('myapp'));
    return instance;
  }

  async close(): Promise<void> {
    await this.mongoClient.close();
    await this.cassandraClient.shutdown();
  }
}

// ─── Cassandra Event Store Implementation ─────────────────────────────────────
class CassandraEventStore implements IEventStore {
  constructor(private client: CassandraClient) {}

  async append(aggregateId: string, event: unknown): Promise<void> {
    await this.client.execute(
      `INSERT INTO events (aggregate_id, sequence, type, payload, occurred_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        aggregateId,
        Date.now(),
        (event as any).eventType || 'Unknown',
        JSON.stringify(event),
        new Date(),
      ],
      { prepare: true }
    );
  }

  async getStream(aggregateId: string): Promise<unknown[]> {
    const result = await this.client.execute(
      'SELECT payload FROM events WHERE aggregate_id = ? ORDER BY sequence',
      [aggregateId],
      { prepare: true }
    );
    return result.rows.map(r => JSON.parse(r.payload as string));
  }
}

// ─── Unified Factory ──────────────────────────────────────────────────────────
export async function createOrchestrator(
  type: 'postgres-cassandra' | 'mongo-cassandra',
  config: any
): Promise<DbOrchestrator> {
  switch (type) {
    case 'postgres-cassandra':
      return PostgresCassandraOrchestrator.create(config);
    case 'mongo-cassandra':
      return MongoCassandraOrchestrator.create(config);
    default:
      throw new Error(`Unknown orchestrator type: ${type}`);
  }
}
