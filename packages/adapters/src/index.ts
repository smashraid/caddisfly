// ─── Database Adapters ────────────────────────────────────────────────────────
export { 
  ensureUserIndexes, 
  MongoConnection, 
  MongoUserRepositoryAdapter 
} from './db/mongo/index.js'

export { 
  CassandraUserRepositoryAdapter, 
  CassandraEventStoreAdapter 
} from './db/cassandra/index.js';

export { 
  PostgresUserRepositoryAdapter 
} from './db/postgres/index.js';

// ─── DB Orchestrator ──────────────────────────────────────────────────────────
export {
  PostgresCassandraOrchestrator,
  type DbOrchestrator,
} from './db/orchestrator/index.js';

// ─── Messaging Adapters ───────────────────────────────────────────────────────
export {
  KafkaEventPublisherAdapter,
  KafkaEventSubscriberAdapter
} from './messaging/kafka/index.js';

export {
  RabbitConnection,
  RabbitEventPublisherAdapter,
  RabbitEventSubscriberAdapter
} from './messaging/rabbitmq/index.js'

// ─── External API Adapters ────────────────────────────────────────────────────
export { ExternalUserHttpAdapter } from './api/clients/index.js';

// ─── Gateway/Framework Adapters ───────────────────
// export { createExpressGateway } from './api/gateway/express.js';