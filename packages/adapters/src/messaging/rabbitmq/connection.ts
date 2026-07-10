import amqp, { type ChannelModel, type Channel, type ConfirmChannel } from 'amqplib';

export interface RabbitConnectionConfig {
  uri: string;
}

export class RabbitConnection {
  private connection: ChannelModel | null = null;

  constructor(private readonly config: RabbitConnectionConfig) {}

  async connect(): Promise<void> {
    if (this.connection) return;

    this.connection = await amqp.connect(this.config.uri);

    this.connection.on('close', () => {
      this.connection = null;
    });

    this.connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      this.connection = null;
    });
  }

  async createChannel(): Promise<Channel> {
    if (!this.connection) {
      throw new Error('Connection not established. Call connect() first.');
    }
    return this.connection.createChannel();
  }

  async createConfirmChannel(): Promise<ConfirmChannel> {
    if (!this.connection) {
      throw new Error('Connection not established. Call connect() first.');
    }
    return this.connection.createConfirmChannel();
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  get isOpen(): boolean {
    return this.connection !== null;
  }
}