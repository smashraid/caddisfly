import { 
  type IUserRepositoryPort, 
  type PaginatedResult, 
  type UserId, 
  DuplicateEmailError, 
  User 
} from '@caddisfly/core';
import { type Db, type Collection } from 'mongodb';

interface UserDocument {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoUserRepositoryAdapter implements IUserRepositoryPort {
  private readonly collection: Collection<UserDocument>;

   constructor(db: Db) {
    this.collection = db.collection<UserDocument>('users');
  }

  async findById(id: UserId): Promise<User | null> {
    const doc = await this.collection.findOne({ _id: id });
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.collection.findOne({ email });
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(options?: { limit: number; offset: number }): Promise<PaginatedResult<User>> {
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
    try {
      await this.collection.updateOne(
        { _id: user.id },
        { $set: { email: user.email, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt } },
        { upsert: true }
      );
    } catch (err: unknown) {
      if (isMongoDuplicateKeyError(err)) {
        throw new DuplicateEmailError(user.email);
      }
      throw err;
    }
  }

  async delete(id: UserId): Promise<void> {
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

function isMongoDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000;
}