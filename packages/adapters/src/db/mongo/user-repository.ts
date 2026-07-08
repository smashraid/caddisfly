import type { IUserRepository, PaginatedResult } from '@caddisfly/core';
import { User, UserId, Email, type UserProps } from '@caddisfly/core';
import type { Db, Collection, FindOptions } from 'mongodb';

interface UserDocument {
  _id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoUserRepository implements IUserRepository {
  private collection: Collection<UserDocument>;

  constructor(db: Db) {
    this.collection = db.collection<UserDocument>('users');
  }

  async findById(id: UserId): Promise<User | null> {
    const doc = await this.collection.findOne({ _id: id.toString() });
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const doc = await this.collection.findOne({ email: email.toString() });
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
    await this.collection.updateOne(
      { _id: user.id.toString() },
      {
        $set: {
          email: user.email.toString(),
          name: user.name.toString(),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { upsert: true }
    );
  }

  async delete(id: UserId): Promise<void> {
    await this.collection.deleteOne({ _id: id.toString() });
  }

  private toDomain(doc: UserDocument): User {
    return User.reconstitute({
      id: UserId.create(doc._id),
      email: Email.create(doc.email),
      name: doc.name, // stored as plain string, validated on reconstitution if needed
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}

export { MongoUserRepository as UserRepository };
