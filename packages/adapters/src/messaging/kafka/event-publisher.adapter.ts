import { type IEventPublisherPort, type UserDomainEvent } from '@caddisfly/core';
import type { Producer } from 'kafkajs';

export class KafkaEventPublisherAdapter implements IEventPublisherPort {
  constructor(private readonly producer: Producer) {}

  async publish(event: UserDomainEvent): Promise<void> {
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
    const byTopic = new Map<string, UserDomainEvent[]>();
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

  async close(): Promise<void> {}

  private toTopic(eventType: string): string {
    return `events.${eventType.toLowerCase()}`;
  }
}