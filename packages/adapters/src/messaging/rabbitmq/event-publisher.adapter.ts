import { type IEventPublisherPort, type UserDomainEvent } from '@caddisfly/core';
import type { ConfirmChannel } from 'amqplib';

export class RabbitEventPublisherAdapter implements IEventPublisherPort {
  constructor(private readonly channel: ConfirmChannel) {}

  async publish(event: UserDomainEvent): Promise<void> {
    await this.publishAll([event]);
  }

  async publishBatch(events: UserDomainEvent[]): Promise<void> {
    await this.publishAll(events);
  }

  private async publishAll(events: UserDomainEvent[]): Promise<void> {
    const byExchange = new Map<string, UserDomainEvent[]>();
    for (const event of events) {
      const exchange = this.toExchange(event.eventType);
      const group = byExchange.get(exchange) ?? [];
      group.push(event);
      byExchange.set(exchange, group);
    }

    for (const [exchange, group] of byExchange) {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await Promise.all(group.map((event) => this.publishOne(exchange, event)));
    }
  }

  private publishOne(exchange: string, event: UserDomainEvent): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.channel.publish(
        exchange,
        event.aggregateId,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          messageId: crypto.randomUUID(),
          headers: { 'event-type': event.eventType, 'occurred-at': event.occurredAt.toISOString() },
        },
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  private toExchange(eventType: string): string {
    return `events.${eventType.toLowerCase()}`;
  }
}