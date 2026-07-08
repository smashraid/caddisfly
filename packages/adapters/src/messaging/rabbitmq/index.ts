import type { IEventPublisher } from '@caddisfly/core';
import type { DomainEvent } from '@caddisfly/core';
import amqp, { type Connection, type Channel } from 'amqplib';

export class RabbitEventPublisher implements IEventPublisher {
  private connection: Connection;
  private channel: Channel;
  private connected = false;

  constructor(private uri: string) {}

  async connect(): Promise<void> {
    if (!this.connected) {
      this.connection = await amqp.connect(this.uri);
      this.channel = await this.connection.createConfirmChannel();
      this.connected = true;
    }
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    await this.ensureConnected();
    const exchange = this.toExchange(event.eventType);

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(
      exchange,
      event.aggregateId, // routing key
      Buffer.from(JSON.stringify(event)),
      {
        persistent: true,
        messageId: crypto.randomUUID(),
        headers: {
          'event-type': event.eventType,
          'occurred-at': event.occurredAt.toISOString(),
        },
      }
    );
  }

  async publishBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    await this.ensureConnected();

    // Group by exchange
    const byExchange = new Map<string, T[]>();
    for (const event of events) {
      const exchange = this.toExchange(event.eventType);
      const group = byExchange.get(exchange) ?? [];
      group.push(event);
      byExchange.set(exchange, group);
    }

    for (const [exchange, group] of byExchange) {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      for (const event of group) {
        this.channel.publish(
          exchange,
          event.aggregateId,
          Buffer.from(JSON.stringify(event)),
          { persistent: true }
        );
      }
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.channel.close();
      await this.connection.close();
      this.connected = false;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  private toExchange(eventType: string): string {
    return `events.${eventType.toLowerCase()}`;
  }
}

// ─── RabbitMQ Subscriber ──────────────────────────────────────────────────────
export class RabbitEventSubscriber {
  private connection: Connection;
  private channel: Channel;
  private consumers: Map<string, string> = new Map(); // queue -> consumerTag

  constructor(private uri: string) {}

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.uri);
    this.channel = await this.connection.createChannel();
  }

  async subscribe(
    topic: string,
    handler: (event: DomainEvent) => Promise<void>,
    options?: { groupId?: string; prefetch?: number }
  ): Promise<void> {
    const exchange = this.toExchange(topic);
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    const queueName = options?.groupId
      ? `${topic}-${options.groupId}`
      : `${topic}-${crypto.randomUUID()}`;

    const { queue } = await this.channel.assertQueue(queueName, {
      durable: true,
      autoDelete: !options?.groupId,
    });

    await this.channel.bindQueue(queue, exchange, '#');

    if (options?.prefetch) {
      await this.channel.prefetch(options.prefetch);
    }

    const { consumerTag } = await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString()) as DomainEvent;
        await handler(event);
        this.channel.ack(msg);
      } catch (err) {
        this.channel.nack(msg, false, false); // dead-letter, no requeue
      }
    });

    this.consumers.set(queue, consumerTag);
  }

  async close(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }

  private toExchange(topic: string): string {
    return `events.${topic.toLowerCase()}`;
  }
}
