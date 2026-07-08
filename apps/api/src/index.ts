import express, { type Request, type Response } from 'express';
import {
  ensureUserIndexes,
  MongoConnection,
  MongoUserRepositoryAdapter,
  RabbitEventPublisherAdapter
} from '@caddisfly/adapters';
import {
  type CreateUserRequest,
  type UserCreatedResponse,
} from '@caddisfly/core';
import { requestContextMiddleware } from './middleware/request-context.js';
import { setupGracefulShutdown } from './shutdown.js';
import { AppContainer } from './container.js';

async function bootstrap() {
  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);

  const mongoConnection = new MongoConnection({
    uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017',
    dbName: process.env.DB_NAME ?? 'caddisfly',
  });

  await mongoConnection.connect();
  await ensureUserIndexes(mongoConnection);

  const userRepository = new MongoUserRepositoryAdapter(mongoConnection.getDb());
  const eventPublisher = new RabbitEventPublisherAdapter(process.env.RABBIT_URI ?? 'amqp://localhost');
  await eventPublisher.connect();

  const container = new AppContainer({
    userRepository,
    eventPublisher,
  });

  app.post(
    '/users',
    async (
      req: Request<Record<string, never>, UserCreatedResponse | { error: string }, CreateUserRequest, Record<string, never>>,
      res: Response<UserCreatedResponse | { error: string }>
    ) => {
      try {
        const response = await container.createUserUseCase.execute(req.body);
        res.status(201).json(response);
      } catch (err: unknown) {
        const error = err as Error & { status?: number };

        if (typeof error.status === 'number') {
          res.status(error.status).json({ error: error.message });
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
    mongoConnection,
  ]);
}

bootstrap().catch((err) => {
  console.error('Fatal API Application Bootstrap failure:', err);
  process.exit(1);
});