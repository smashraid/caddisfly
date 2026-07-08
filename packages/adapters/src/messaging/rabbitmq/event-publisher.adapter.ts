import { type IEventPublisherPort, type UserDomainEvent } from '@caddisfly/core';
import amqp, { type ChannelModel, type ConfirmChannel } from 'amqplib';

export class RabbitEventPublisherAdapter implements IEventPublisherPort {
  private connection!: ChannelModel;
  private channel!: ConfirmChannel;
  private isConnected = false;

  constructor(private readonly uri: string) {}

  async connect(): Promise<void> {
    if (!this.isConnected) {
      this.connection = await amqp.connect(this.uri);
      // Using a confirm channel guarantees publisher acknowledgments from the broker
      this.channel = await this.connection.createConfirmChannel();
      this.isConnected = true;
    }
  }

  async publish(event: UserDomainEvent): Promise<void> {
    await this.ensureConnected();
    const exchange = this.toExchange(event.eventType);

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    await new Promise<void>((resolve, reject) => {
      this.channel.publish(
        exchange,
        event.aggregateId,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          messageId: crypto.randomUUID(),
          headers: {
            'event-type': event.eventType,
            'occurred-at': event.occurredAt.toISOString(),
          },
        },
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  async publishBatch(events: UserDomainEvent[]): Promise<void> {
    await this.ensureConnected();

    // Group by exchange to declare exchanges only once per unique topic group
    const byExchange = new Map<string, UserDomainEvent[]>();
    for (const event of events) {
      const exchange = this.toExchange(event.eventType);
      const group = byExchange.get(exchange) ?? [];
      group.push(event);
      byExchange.set(exchange, group);
    }

    for (const [exchange, group] of byExchange) {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      
      // Concurrently publish and await explicit broker confirmations for all events in the batch
      await Promise.all(
        group.map((event) => {
          return new Promise<void>((resolve, reject) => {
            this.channel.publish(
              exchange,
              event.aggregateId,
              Buffer.from(JSON.stringify(event)),
              {
                persistent: true,
                messageId: crypto.randomUUID(),
                headers: {
                  'event-type': event.eventType,
                  'occurred-at': event.occurredAt.toISOString(),
                },
              },
              (err) => (err ? reject(err) : resolve())
            );
          });
        })
      );
    }
  }

  async close(): Promise<void> {
    if (this.isConnected) {
      await this.channel.close();
      await this.connection.close();
      this.isConnected = false;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  private toExchange(eventType: string): string {
    return `events.${eventType.toLowerCase()}`;
  }
}