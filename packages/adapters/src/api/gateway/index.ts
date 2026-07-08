import type { CreateUserUseCase, GetUserUseCase, UpdateUserUseCase } from '@caddisfly/core';
import { createUserRoutes } from '../rest/express-routes.js';
import type { Application } from 'express';

export interface GatewayConfig {
  port: number;
  useCases: {
    createUser: CreateUserUseCase;
    getUser: GetUserUseCase;
    updateUser: UpdateUserUseCase;
  };
}

// ─── Express Gateway ──────────────────────────────────────────────────────────
export async function createExpressGateway(config: GatewayConfig): Promise<Application> {
  const express = (await import('express')).default;
  const app = express();

  app.use(express.json());
  app.use('/users', createUserRoutes(
    config.useCases.createUser,
    config.useCases.getUser,
    config.useCases.updateUser,
  ));

  app.listen(config.port, () => {
    console.log(`🚀 Express gateway listening on port ${config.port}`);
  });

  return app;
}

// ─── Fastify Gateway ──────────────────────────────────────────────────────────
export async function createFastifyGateway(config: GatewayConfig) {
  const fastify = (await import('fastify')).default;
  const app = fastify({ logger: true });

  app.post('/users', async (req, reply) => {
    const result = await config.useCases.createUser.execute(req.body as any);
    return reply.status(201).send(result);
  });

  app.get('/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await config.useCases.getUser.execute(id);
    return result;
  });

  app.patch('/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await config.useCases.updateUser.execute(id, req.body as any);
    return result;
  });

  await app.listen({ port: config.port });
  console.log(`🚀 Fastify gateway listening on port ${config.port}`);

  return app;
}

// ─── Unified Gateway Factory ──────────────────────────────────────────────────
export async function createGateway(
  framework: 'express' | 'fastify',
  config: GatewayConfig
) {
  switch (framework) {
    case 'express':
      return createExpressGateway(config);
    case 'fastify':
      return createFastifyGateway(config);
    default:
      throw new Error(`Unsupported framework: ${framework}`);
  }
}
