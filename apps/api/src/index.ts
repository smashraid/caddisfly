import express, { type Request, type Response } from 'express';
import {
  CassandraUserRepositoryAdapter,
  RabbitConnection,
  RabbitEventPublisherAdapter
} from '@caddisfly/adapters';
import {
  DomainError,
  DomainValidationError,
  DuplicateEmailError,
  UserNotFoundError,
  type CreateUserRequest,
  type UserCreatedResponse,
} from '@caddisfly/core';
import { requestContextMiddleware } from './middleware/request-context.js';
import { setupGracefulShutdown } from './shutdown.js';
import { AppContainer } from './container.js';
import { CassandraConnection } from '../../../packages/adapters/src/db/cassandra/connection.js';
import { ensureCassandraTables } from '@caddisfly/adapters/db/cassandra';

async function bootstrap() {
  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);

  const cassandraConnection = new CassandraConnection({
    contactPoints: (process.env.CASSANDRA_CONTACT_POINTS ?? '127.0.0.1').split(','),
    localDataCenter: process.env.CASSANDRA_LOCAL_DC ?? 'datacenter1',
    keyspace: process.env.CASSANDRA_KEYSPACE ?? 'caddisfly',
  });
  await cassandraConnection.connect();
  ensureCassandraTables(cassandraConnection);
  const userRepository = new CassandraUserRepositoryAdapter(cassandraConnection.getClient());

  const rabbitConnection = new RabbitConnection(process.env.RABBIT_URI ?? 'amqp://localhost');
  await rabbitConnection.connect();
  const publishChannel = await rabbitConnection.createConfirmChannel();
  const eventPublisher = new RabbitEventPublisherAdapter(publishChannel);

  const container = new AppContainer({
    userRepository,
    eventPublisher,
  });

  app.post(
    '/users',
    async (
      req: Request<Record<string, never>, UserCreatedResponse | { error: string, issues?: unknown[] }, CreateUserRequest, Record<string, never>>,
      res: Response<UserCreatedResponse | { error: string, issues?: unknown[] }>
    ) => {
      try {
        const response = await container.createUserUseCase.execute(req.body);
        res.status(201).json(response);
      } catch (err: unknown) {
        console.error('❌ Error caught in /users route:', err);
        if (err instanceof DomainError) {
          if (err instanceof DomainValidationError) {
            res.status(400).json({
              error: 'Validation Failed',
              issues: err.issues
            });
            return;
          }

          if (err.name === 'InvalidEmailError' || err.name === 'InvalidUserNameError') {
            res.status(400).json({ error: err.message });
            return;
          }

          if (err instanceof DuplicateEmailError) {
            res.status(409).json({ error: err.message });
            return;
          }

          if (err instanceof UserNotFoundError) {
            res.status(404).json({ error: err.message });
            return;
          }

          res.status(400).json({ error: err.message });
          return;
        }

        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  );

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const server = app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
  });

  setupGracefulShutdown(server, [

  ]);
}

bootstrap().catch((err) => {
  console.error('Fatal API Application Bootstrap failure:', err);
  process.exit(1);
});