// ─── Database Adapters ────────────────────────────────────────────────────────
export { MongoUserRepository } from './db/mongo/index.js';
export { PostgresUserRepository } from './db/postgres/index.js';
export { CassandraUserRepository } from './db/cassandra/index.js';

// ─── DB Orchestrator ──────────────────────────────────────────────────────────
export {
  PostgresCassandraOrchestrator,
  MongoCassandraOrchestrator,
  createOrchestrator,
  type DbOrchestrator,
  type IEventStore,
} from './db/orchestrator/index.js';

// ─── API Adapters ─────────────────────────────────────────────────────────────
export { createUserRoutes } from './api/rest/index.js';
export { createUserGrpcService } from './api/grpc/index.js';

// ─── API Gateway ──────────────────────────────────────────────────────────────
export {
  createExpressGateway,
  createFastifyGateway,
  createGateway,
  type GatewayConfig,
} from './api/gateway/index.js';

// ─── Messaging Adapters ───────────────────────────────────────────────────────
export {
  KafkaEventPublisher,
  KafkaEventSubscriber,
} from './messaging/kafka/index.js';

export {
  RabbitEventPublisher,
  RabbitEventSubscriber,
} from './messaging/rabbitmq/index.js';
