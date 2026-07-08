// packages/adapters/src/messaging/rabbitmq/event-subscriber.adapter.ts
import { type UserDomainEvent } from '@caddisfly/core';
import amqp, { type Channel } from 'amqplib';

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
    options?: SubscribeOptions
  ): Promise<void> {
    const exchange = this.toExchange(topic);
    const dlxExchange = `${exchange}.dlx`;
    const dlqName = `${topic}.dlq`;
    const maxRetries = options?.maxRetries ?? 3;

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertExchange(dlxExchange, 'fanout', { durable: true });
    await this.channel.assertQueue(dlqName, { durable: true });
    await this.channel.bindQueue(dlqName, dlxExchange, '');

    const queueName = options?.groupId
      ? `${topic}-${options.groupId}`
      : `${topic}-${crypto.randomUUID()}`;

    const { queue } = await this.channel.assertQueue(queueName, {
      durable: true,
      autoDelete: !options?.groupId,
      arguments: {
        'x-dead-letter-exchange': dlxExchange,
      },
    });

    await this.channel.bindQueue(queue, exchange, '#');

    if (options?.prefetch) {
      await this.channel.prefetch(options.prefetch);
    }

    const { consumerTag } = await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const rawEvent = JSON.parse(msg.content.toString());
        const event: UserDomainEvent = { ...rawEvent, occurredAt: new Date(rawEvent.occurredAt) };

        await handler(event);
        this.channel.ack(msg);
      } catch (err) {
        this.handleFailure(msg, maxRetries, err);
      }
    });

    this.consumers.set(queue, consumerTag);
  }

  private handleFailure(msg: amqp.ConsumeMessage, maxRetries: number, err: unknown): void {
    const deathHeader = msg.properties.headers?.['x-death'] as Array<{ count: number }> | undefined;
    const attempts = deathHeader?.[0]?.count ?? 0;

    console.error(`Message processing failed (attempt ${attempts + 1}):`, err);

    if (attempts >= maxRetries) {
      // Exhausted retries: nack without requeue -> routed to DLX -> lands in the real DLQ
      this.channel.nack(msg, false, false);
    } else {
      // Still has retries left: requeue. Note this requeues to the head of the
      // *same* queue immediately — see the backoff caveat below.
      this.channel.nack(msg, false, true);
    }
  }

  async close(): Promise<void> {
    for (const [, consumerTag] of this.consumers.entries()) {
      await this.channel.cancel(consumerTag);
    }
    this.consumers.clear();
  }

  private toExchange(topic: string): string {
    return `events.${topic.toLowerCase()}`;
  }
}