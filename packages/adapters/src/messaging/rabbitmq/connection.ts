// packages/adapters/src/messaging/rabbitmq/connection.ts
import amqp, { type ChannelModel, type ConfirmChannel, type Channel } from 'amqplib';

export class RabbitConnection {
  private connection: ChannelModel | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor(private readonly uri: string) {}

  async connect(): Promise<void> {
    if (this.connection) return;
    if (!this.connectPromise) {
      this.connectPromise = amqp.connect(this.uri).then((conn) => {
        this.connection = conn;

        conn.on('error', (err) => {
          console.error('RabbitMQ connection error:', err);
          this.connection = null;
          this.connectPromise = null;
        });
        conn.on('close', () => {
          console.error('RabbitMQ connection closed');
          this.connection = null;
          this.connectPromise = null;
        });
      });
    }
    await this.connectPromise;
  }

  private getConnection(): ChannelModel {
    if (!this.connection) {
      throw new Error('RabbitConnection: not connected. Call connect() first.');
    }
    return this.connection;
  }

  async createConfirmChannel(): Promise<ConfirmChannel> {
    return this.getConnection().createConfirmChannel();
  }

  async createChannel(): Promise<Channel> {
    return this.getConnection().createChannel();
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.connectPromise = null;
    }
  }

  isHealthy(): boolean {
    return this.connection !== null;
  }
}