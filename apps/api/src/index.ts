import express from 'express';
import {
  CassandraUserRepositoryAdapter,
  RabbitConnection,
  RabbitEventPublisherAdapter,
  CassandraConnection,
} from '@caddisfly/adapters';
import { ensureCassandraTables } from '@caddisfly/adapters/db/cassandra';
import { setupGracefulShutdown } from './shutdown.js';
import { createUserRouter } from './routes/user.routes.js';
import type { UserControllerDependencies } from './controllers/user.controller.js';
import { requestContextMiddleware } from './middleware/request-context.js';
import { globalErrorMiddleware } from './middleware/error-handler.js';

async function bootstrap() {
  const app = express();
  app.use(express.json());

  // ─── Infrastructure Setup ─────────────────────────────────────────────────
  const cassandraConnection = new CassandraConnection({
    contactPoints: (process.env.CASSANDRA_CONTACT_POINTS ?? '127.0.0.1').split(','),
    localDataCenter: process.env.CASSANDRA_LOCAL_DC ?? 'datacenter1',
    keyspace: process.env.CASSANDRA_KEYSPACE ?? 'caddisfly',
  });
  await cassandraConnection.connect();
  await ensureCassandraTables(cassandraConnection);

  const userRepository = new CassandraUserRepositoryAdapter(cassandraConnection.getClient());

  const rabbitConnection = new RabbitConnection({uri: process.env.RABBIT_URI ?? 'amqp://localhost'});
  await rabbitConnection.connect();
  const publishChannel = await rabbitConnection.createConfirmChannel();
  const eventPublisher = new RabbitEventPublisherAdapter(publishChannel);

  // ─── Routes ───────────────────────────────────────────────────────────────
  const deps: UserControllerDependencies = { userRepository, eventPublisher };
  app.use('/users', createUserRouter(deps));

  app.use(requestContextMiddleware);
  app.use(globalErrorMiddleware);

  // ─── Start Server ───────────────────────────────────────────────────────────
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const server = app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────
  setupGracefulShutdown(server, [
    cassandraConnection,
    rabbitConnection,
    publishChannel,
  ]);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap failure:', err);
  process.exit(1);
});