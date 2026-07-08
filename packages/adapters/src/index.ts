// ─── Database Adapters ────────────────────────────────────────────────────────
export { CassandraUserRepositoryAdapter } from './db/cassandra/user-repository.adapter.js';
export { CassandraEventStoreAdapter } from './db/cassandra/event-store.adapter.js';
export { MongoUserRepositoryAdapter } from './db/mongo/user-repository.adapter.js';
export { PostgresUserRepositoryAdapter } from './db/postgres/user-repository.adapter.js';

// ─── DB Orchestrator ──────────────────────────────────────────────────────────
export {
  PostgresCassandraOrchestrator,
  type DbOrchestrator,
} from './db/orchestrator/index.js';

// ─── Messaging Adapters ───────────────────────────────────────────────────────
export { KafkaEventPublisherAdapter } from './messaging/kafka/event-publisher.adapter.js';
export { KafkaEventSubscriberAdapter } from './messaging/kafka/event-subscriber.adapter.js';
export { RabbitEventPublisherAdapter } from './messaging/rabbitmq/event-publisher.adapter.js';
export { RabbitEventSubscriberAdapter } from './messaging/rabbitmq/event-subscriber.adapter.js';

// ─── External API Adapters ────────────────────────────────────────────────────
export { ExternalUserHttpAdapter } from './api/clients/external-user-http.adapter.js';

// ─── Gateway/Framework Adapters ───────────────────
// export { createExpressGateway } from './api/gateway/express.js';