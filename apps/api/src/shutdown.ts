import { Server } from 'node:http';
import { logger } from '@caddisfly/logger';
import { Closable } from './types/index.js';

export const setupGracefulShutdown = (server: Server, dbConnections: Closable[]) => {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // 1. Stop accepting new requests
    server.close(async (err?: Error) => {
      if (err) {
        logger.error({ err }, 'Error during HTTP server shutdown');
      } else {
        logger.info('HTTP server closed.');
      }

      // 2. Close DB connections
      try {
        await Promise.all(dbConnections.map((db) => db.disconnect()));
        logger.info('Database connections closed.');
        process.exit(0);
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.error({ err: error }, 'Error during database shutdown');
        } else {
          logger.error('An unknown error occurred during database shutdown');
        }
        process.exit(1);
      }
    });

    // 3. Force exit if hanging
    setTimeout(() => {
      logger.error('Shutdown timeout, forcing exit.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};