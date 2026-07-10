// ─── Database Adapters ────────────────────────────────────────────────────────
export { 
  ensureUserIndexes, 
  MongoConnection, 
  MongoUserRepositoryAdapter 
} from './db/mongo/index.js'

export {
  CassandraConnection,
  CassandraUserRepositoryAdapter, 
  CassandraEventStoreAdapter 
} from './db/cassandra/index.js';

export {
  PostgresConnection,
  PostgresUserRepositoryAdapter 
} from './db/postgres/index.js';

// ─── DB Orchestrator ──────────────────────────────────────────────────────────
export {
  PostgresCassandraOrchestrator,
  type DbOrchestrator,
} from './db/orchestrator/index.js';

// ─── Messaging Adapters ───────────────────────────────────────────────────────
export {
  KafkaConnection,
  type KafkaConnectionConfig,
  KafkaEventPublisherAdapter,
  KafkaEventSubscriberAdapter
} from './messaging/kafka/index.js';

export {
  RabbitConnection,
  type RabbitConnectionConfig,
  RabbitEventPublisherAdapter,
  RabbitEventSubscriberAdapter
} from './messaging/rabbitmq/index.js'

// ─── External API Adapters ────────────────────────────────────────────────────
export { ExternalUserHttpAdapter } from './api/clients/index.js';

// ─── Gateway/Framework Adapters ───────────────────
// export { createExpressGateway } from './api/gateway/express.js';