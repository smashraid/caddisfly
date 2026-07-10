import { type UserDomainEvent } from '@caddisfly/core';
import type { Channel, ConsumeMessage } from 'amqplib';

export interface SubscribeOptions {
  groupId?: string;
  prefetch?: number;
  maxRetries?: number;
}

export class RabbitEventSubscriberAdapter {
  private readonly consumers: Map<string, string> = new Map();
  constructor(private readonly channel: Channel) { }

  async subscribe(
    topic: string,
    handler: (event: UserDomainEvent) => Promise<void>,
    options: SubscribeOptions = {}
  ): Promise<void> {
    const exchange = this.toExchange(topic);
    const maxRetries = options.maxRetries ?? 3;

    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    // ─── DLX Setup ──────────────────────────────────────────────────────────
    const dlxExchange = `${exchange}.dlx`;
    const dlxQueue = `${exchange}.dlq`;

    await this.channel.assertExchange(dlxExchange, 'direct', { durable: true });
    await this.channel.assertQueue(dlxQueue, { durable: true });
    await this.channel.bindQueue(dlxQueue, dlxExchange, topic);

    // ─── Main Queue with DLX policy ─────────────────────────────────────────
    const queueName = options.groupId
      ? `${topic}-${options.groupId}`
      : `${topic}-${crypto.randomUUID()}`;

    const { queue } = await this.channel.assertQueue(queueName, {
      durable: true,
      autoDelete: !options.groupId,
      arguments: {
        'x-dead-letter-exchange': dlxExchange,
        'x-dead-letter-routing-key': topic,
        'x-message-ttl': 30000, // 30s delay before retry via DLX
      },
    });

    await this.channel.bindQueue(queue, exchange, '#');

    if (options.prefetch) {
      await this.channel.prefetch(options.prefetch);
    }

    // ─── Consumer with Retry Logic ──────────────────────────────────────────
    const { consumerTag } = await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const event = this.parseMessage(msg);
        await handler(event);
        this.channel.ack(msg);
      } catch (err) {
        console.error('Message handling failed:', err);
        this.handleFailure(msg, maxRetries);
      }
    });

    this.consumers.set(queue, consumerTag);
  }

  /** Cancels all active consumers. The channel is managed externally. */
  async close(): Promise<void> {
    for (const [, consumerTag] of this.consumers.entries()) {
      await this.channel.cancel(consumerTag);
    }
    this.consumers.clear();
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private parseMessage(msg: ConsumeMessage): UserDomainEvent {
    const rawEvent = JSON.parse(msg.content.toString());
    return {
      ...rawEvent,
      occurredAt: new Date(rawEvent.occurredAt),
    };
  }

  private handleFailure(msg: ConsumeMessage, maxRetries: number): void {
    const currentRetry = this.getRetryCount(msg);

    if (currentRetry >= maxRetries) {
      console.warn(`Message exceeded ${maxRetries} retries, sending to DLQ`);
      this.channel.reject(msg, false);
      return;
    }

    this.channel.nack(msg, false, false);
  }

  private getRetryCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers ?? {};
    return (headers['x-retry-count'] as number) ?? 0;
  }

  private toExchange(topic: string): string {
    return `events.${topic.toLowerCase()}`;
  }
}