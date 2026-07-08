import type { IEventPublisher } from '@caddisfly/core';
import type { DomainEvent } from '@caddisfly/core';
import { Kafka, Producer, type ProducerConfig } from 'kafkajs';

export class KafkaEventPublisher implements IEventPublisher {
  private producer: Producer;
  private connected = false;

  constructor(
    brokers: string[],
    clientId: string = 'caddisfly-publisher',
    config?: ProducerConfig
  ) {
    const kafka = new Kafka({ clientId, brokers });
    this.producer = kafka.producer(config);
  }

  async connect(): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    await this.ensureConnected();
    await this.producer.send({
      topic: this.toTopic(event.eventType),
      messages: [{
        key: event.aggregateId,
        value: JSON.stringify(event),
        headers: {
          'event-type': event.eventType,
          'occurred-at': event.occurredAt.toISOString(),
        },
      }],
    });
  }

  async publishBatch<T extends DomainEvent>(events: T[]): Promise<void> {
    await this.ensureConnected();

    // Group by topic for efficient batching
    const byTopic = new Map<string, T[]>();
    for (const event of events) {
      const topic = this.toTopic(event.eventType);
      const group = byTopic.get(topic) ?? [];
      group.push(event);
      byTopic.set(topic, group);
    }

    await Promise.all(
      Array.from(byTopic.entries()).map(([topic, group]) =>
        this.producer.send({
          topic,
          messages: group.map(e => ({
            key: e.aggregateId,
            value: JSON.stringify(e),
            headers: {
              'event-type': e.eventType,
              'occurred-at': e.occurredAt.toISOString(),
            },
          })),
        })
      )
    );
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.connect();
    }
  }

  private toTopic(eventType: string): string {
    return `events.${eventType.toLowerCase()}`;
  }
}

// ─── Kafka Subscriber ─────────────────────────────────────────────────────────
export class KafkaEventSubscriber {
  private kafka: Kafka;
  private consumers: Map<string, any> = new Map();

  constructor(brokers: string[], clientId: string = 'caddisfly-consumer') {
    this.kafka = new Kafka({ clientId, brokers });
  }

  async subscribe(
    topic: string,
    handler: (event: DomainEvent) => Promise<void>,
    options?: { groupId: string; fromBeginning?: boolean }
  ): Promise<void> {
    const consumer = this.kafka.consumer({
      groupId: options?.groupId ?? 'default-group',
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: options?.fromBeginning });

    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value?.toString() ?? '{}') as DomainEvent;
        await handler(event);
      },
    });

    this.consumers.set(topic, consumer);
  }

  async close(): Promise<void> {
    await Promise.all(
      Array.from(this.consumers.values()).map(c => c.disconnect())
    );
  }
}
