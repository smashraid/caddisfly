import { type UserDomainEvent } from '@caddisfly/core';
import { Kafka, type Consumer } from 'kafkajs';

export class KafkaEventSubscriberAdapter {
  private readonly kafka: Kafka;
  private readonly consumers: Map<string, Consumer> = new Map();

  constructor(brokers: string[], clientId: string = 'caddisfly-consumer') {
    this.kafka = new Kafka({ clientId, brokers });
  }

  async subscribe(
    topic: string,
    handler: (event: UserDomainEvent) => Promise<void>,
    options?: { groupId: string; fromBeginning?: boolean }
  ): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: options?.groupId ?? 'default-group',
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: options?.fromBeginning });

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        
        // Parse raw messaging payload into our strictly validated Domain Event type definitions
        const rawEvent = JSON.parse(message.value.toString());
        
        // Convert the date string back into a real JS Date object before handling
        const event: UserDomainEvent = {
          ...rawEvent,
          occurredAt: new Date(rawEvent.occurredAt),
        };

        await handler(event);
      },
    });

    this.consumers.set(topic, consumer);
  }

  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.consumers.values()).map(consumer => consumer.disconnect())
    );
    this.consumers.clear();
  }
}