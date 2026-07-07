import mongoose from 'mongoose';
// import { Closable } from '@caddisfly/types'; // Assuming you have this shared

export class MongoDatabase {
  async connect(uri: string): Promise<void> {
    await mongoose.connect(uri);
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}