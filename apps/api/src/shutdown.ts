// src/shutdown.ts
import { Server } from 'node:http';
import { logger } from '@caddisfly/logger';
import { Closable } from './types/index.js';

export const setupGracefulShutdown = (server: Server, dependencies: Closable[]) => {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    server.close(async (err?: Error) => {
      if (err) {
        logger.error({ err }, 'Error during HTTP server shutdown');
      } else {
        logger.info('HTTP server closed.');
      }

      try {
        // Run all cleanup methods in parallel cleanly
        await Promise.all(dependencies.map((dep) => dep.close()));
        logger.info('All infrastructure services disconnected successfully.');
        process.exit(0);
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error({ err: error }, 'Error during infrastructure shutdown');
        } else {
          logger.error('An unknown error occurred during infrastructure shutdown');
        }
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Shutdown timeout, forcing exit.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};