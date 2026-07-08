import { 
  type IUserRepositoryPort, 
  type PaginatedResult, 
  type UserId, 
  User 
} from '@caddisfly/core';
import { type Db, type Collection, MongoClient } from 'mongodb';

export interface MongoConfig {
  uri: string;
  dbName: string;
}

interface UserDocument {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoUserRepositoryAdapter implements IUserRepositoryPort {
  private client!: MongoClient;
  private db!: Db;
  private isConnected = false;
  private collection!: Collection<UserDocument>;

  constructor(private readonly config: MongoConfig) {}

  async connect(): Promise<void> {
    if (!this.isConnected) {
      this.client = new MongoClient(this.config.uri);
      await this.client.connect();
      this.db = this.client.db(this.config.dbName);
      this.collection = this.db.collection('users');
      this.isConnected = true;
    }
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.close();
      this.isConnected = false;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  async findById(id: UserId): Promise<User | null> {
    await this.ensureConnected();
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.ensureConnected();
    const doc = await this.collection.findOne({ email });
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(options?: { limit: number; offset: number }): Promise<PaginatedResult<User>> {
    await this.ensureConnected();
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const [docs, total] = await Promise.all([
      this.collection
        .find()
        .skip(offset)
        .limit(limit)
        .toArray(),
      this.collection.countDocuments(),
    ]);

    return {
      data: docs.map(d => this.toDomain(d)),
      total,
      limit,
      offset,
    };
  }

  async save(user: User): Promise<void> {
    await this.ensureConnected();
    await this.collection.updateOne(
      { _id: user.id },
      {
        $set: {
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { upsert: true }
    );
  }

  async delete(id: UserId): Promise<void> {
    await this.ensureConnected();
    await this.collection.deleteOne({ _id: id });
  }

  private toDomain(doc: UserDocument): User {
    return User.reconstitute({
      id: doc._id,
      email: doc.email,
      name: doc.name,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}