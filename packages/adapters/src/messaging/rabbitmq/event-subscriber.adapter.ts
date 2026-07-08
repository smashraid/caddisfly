import { type UserDomainEvent } from '@caddisfly/core';
import amqp, { type ChannelModel, type Channel } from 'amqplib';

export class RabbitEventSubscriberAdapter {
  private connection!: ChannelModel;
  private channel!: Channel;
  private isConnected = false;
  private readonly consumers: Map<string, string> = new Map(); // tracks: queue -> consumerTag

  constructor(private readonly uri: string) {}

  async connect(): Promise<void> {
    if (!this.isConnected) {
      this.connection = await amqp.connect(this.uri);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
    }
  }

  async subscribe(
    topic: string,
    handler: (event: UserDomainEvent) => Promise<void>,
    options?: { groupId?: string; prefetch?: number }
  ): Promise<void> {
    await this.connect();
    
    const exchange = this.toExchange(topic);
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    // Use a shared named queue for balancing across group workers, or generate an ephemeral unique queue
    const queueName = options?.groupId
      ? `${topic}-${options.groupId}`
      : `${topic}-${crypto.randomUUID()}`;

    const { queue } = await this.channel.assertQueue(queueName, {
      durable: true,
      autoDelete: !options?.groupId, // Ephemeral queues drop out when listeners close down
    });

    // Bind queue using standard wildcard matching
    await this.channel.bindQueue(queue, exchange, '#');

    if (options?.prefetch) {
      await this.channel.prefetch(options.prefetch);
    }

    const { consumerTag } = await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const rawEvent = JSON.parse(msg.content.toString());
        
        // Re-hydrate plain JSON strings back into robust Javascript Date entities
        const event: UserDomainEvent = {
          ...rawEvent,
          occurredAt: new Date(rawEvent.occurredAt),
        };

        await handler(event);
        this.channel.ack(msg);
      } catch {
        // Safe rejection strategy: send directly to a dead-letter destination without immediate re-queue looping
        //TODO Log error
        this.channel.nack(msg, false, false);
      }
    });

    this.consumers.set(queue, consumerTag);
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      // Unsubscribe all running consumers before tearing down network channels
      for (const [, consumerTag] of this.consumers.entries()) {
        await this.channel.cancel(consumerTag);
      }
      this.consumers.clear();
      
      await this.channel.close();
      await this.connection.close();
      this.isConnected = false;
    }
  }

  private toExchange(topic: string): string {
    return `events.${topic.toLowerCase()}`;
  }
}