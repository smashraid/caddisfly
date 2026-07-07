import express from 'express';
import { setupGracefulShutdown } from './shutdown.js';
import { requestContextMiddleware } from './middleware/request-context.js';
import { handleCreateTransaction } from './adapters/web/transaction.controller.js';

const app = express();
app.use(express.json());

// 1. Pino Logger & Context Middleware (must be first)
app.use(requestContextMiddleware);

// 2. Routes
app.post('/transactions', handleCreateTransaction);

const server = app.listen(3000, () => {
  console.log('API Gateway running on port 3000');
});

// 3. Graceful Shutdown
setupGracefulShutdown(server, []);