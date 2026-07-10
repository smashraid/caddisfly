import { Kafka, type Producer, type Consumer, type ProducerConfig, type KafkaConfig } from 'kafkajs';

export interface KafkaConnectionConfig {
    brokers: string[];
    clientId?: string;
    producerConfig?: ProducerConfig;
    kafkaConfig?: Omit<KafkaConfig, 'clientId' | 'brokers'>;
}

export class KafkaConnection {
    private readonly kafka: Kafka;
    private producer: Producer | null = null;

    constructor(private readonly config: KafkaConnectionConfig) {
        this.kafka = new Kafka({
            clientId: config.clientId ?? 'caddisfly',
            brokers: config.brokers,
            ...config.kafkaConfig,
        });
    }

    getKafka(): Kafka {
        return this.kafka;
    }

    async createProducer(config?: ProducerConfig): Promise<Producer> {
        if (this.producer) return this.producer;

        this.producer = this.kafka.producer({
            ...this.config.producerConfig,
            ...config,
        });

        await this.producer.connect();
        return this.producer;
    }

    createConsumer(groupId: string): Consumer {
        return this.kafka.consumer({ groupId });
    }

    async close(): Promise<void> {
        if (this.producer) {
            await this.producer.disconnect();
            this.producer = null;
        }
    }

    get isProducerConnected(): boolean {
        return this.producer !== null;
    }
}