import mongoose from "mongoose";
export * from "./models/transaction.model.js"

export class MongoDatabase {
  async connect(uri: string): Promise<void> {
    await mongoose.connect(uri);
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}

//export { MongoTransactionRepository } from './repositories/transaction.repository.js';