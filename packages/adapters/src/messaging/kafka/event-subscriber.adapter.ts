import { type UserDomainEvent } from '@caddisfly/core';
import { type Kafka, type Consumer, type EachMessagePayload, IHeaders } from 'kafkajs';

export interface SubscribeOptions {
  groupId: string;
  fromBeginning?: boolean;
  maxRetries?: number;
}

export class KafkaEventSubscriberAdapter {
  private readonly consumers: Map<string, Consumer> = new Map();

  constructor(private readonly kafka: Kafka) { }

  async subscribe(
    topic: string,
    handler: (event: UserDomainEvent) => Promise<void>,
    options: SubscribeOptions
  ): Promise<void> {
    const maxRetries = options.maxRetries ?? 3;

    const consumer = this.kafka.consumer({ groupId: options.groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: options.fromBeginning });

    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (!message.value) return;

        const rawEvent = JSON.parse(message.value.toString());
        const event: UserDomainEvent = {
          ...rawEvent,
          occurredAt: new Date(rawEvent.occurredAt),
        };

        const retryCount = this.getRetryCount(message.headers);

        try {
          await handler(event);
        } catch (err) {
          console.error(`Handler failed (retry ${retryCount}/${maxRetries}):`, err);

          if (retryCount >= maxRetries) {
            console.warn(`Max retries exceeded for ${event.aggregateId}. Event dropped.`);
            return;
          }

          await this.publishRetry(topic, event, retryCount + 1);
        }
      },
    });

    this.consumers.set(topic, consumer);
  }

  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.consumers.values()).map(c => c.disconnect())
    );
    this.consumers.clear();
  }

  private getRetryCount(headers: IHeaders | undefined): number {
    if (!headers) return 0;

    const raw = headers['x-retry-count'];
    if (raw === undefined) return 0;

    // IHeaders values can be: string | Buffer | (string | Buffer)[] | undefined
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined) return 0;

    const str = typeof value === 'string' ? value : value.toString();
    const parsed = parseInt(str, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private async publishRetry(topic: string, event: UserDomainEvent, retryCount: number): Promise<void> {
    const producer = this.kafka.producer();
    await producer.connect();
    await producer.send({
      topic: `${topic}.retry`,
      messages: [{
        key: event.aggregateId,
        value: JSON.stringify(event),
        headers: {
          'event-type': event.eventType,
          'occurred-at': event.occurredAt.toISOString(),
          'x-retry-count': retryCount.toString(),
          'x-original-topic': topic,
        },
      }],
    });
    await producer.disconnect();
  }
}