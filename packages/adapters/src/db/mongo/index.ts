import { MongoConnection } from './connection.js';
export { MongoConnection } from './connection.js';
export { MongoUserRepositoryAdapter } from './user-repository.adapter.js';

export async function ensureUserIndexes(connection: MongoConnection): Promise<void> {
  await connection.getDb().collection('users').createIndex({ email: 1 }, { unique: true });
}
