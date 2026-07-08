import { type IEventPublisherPort, type UserDomainEvent } from '@caddisfly/core';
import { Kafka, type Producer, type ProducerConfig } from 'kafkajs';

export class KafkaEventPublisherAdapter implements IEventPublisherPort {
  private readonly producer: Producer;
  private isConnected = false;

  constructor(
    brokers: string[],
    clientId: string = 'caddisfly-publisher',
    config?: ProducerConfig
  ) {
    const kafka = new Kafka({ clientId, brokers });
    this.producer = kafka.producer(config);
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.producer.connect();
      this.isConnected = true;
    }
  }

  async publish(event: UserDomainEvent): Promise<void> {
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

  async publishBatch(events: UserDomainEvent[]): Promise<void> {
    await this.ensureConnected();

    // Group matching events by topic for transactional/batching efficiency
    const byTopic = new Map<string, UserDomainEvent[]>();
    for (const event of events) {
      const topic = this.toTopic(event.eventType);
      const group = byTopic.get(topic) ?? [];
      group.push(event);
      byTopic.set(topic, group);
    }

    // Fire all message batches concurrently across topics
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
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  private toTopic(eventType: string): string {
    // Translates 'UserCreated' into standard slugged event topics: 'events.usercreated'
    return `events.${eventType.toLowerCase()}`;
  }
}