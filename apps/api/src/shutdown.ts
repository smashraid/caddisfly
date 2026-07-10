// src/shutdown.ts
import { Server } from 'node:http';
import { logger } from '@caddisfly/logger';

export interface Disposable {
  close(): Promise<void>;
}

export const setupGracefulShutdown = (
  server: Server,
  dependencies: Disposable[]
) => {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // 1. Stop accepting new HTTP connections
    const serverClose = new Promise<void>((resolve, reject) => {
      server.close((err?: Error) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 2. Hard timeout for the entire shutdown
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Shutdown timeout')), 10000);
    });

    try {
      await Promise.race([serverClose, timeout]);
      logger.info('HTTP server closed.');
    } catch (err) {
      logger.error({ err }, 'HTTP server shutdown failed or timed out');
    }

    // 3. Close all infrastructure connections
    try {
      await Promise.all(dependencies.map((dep) => dep.close()));
      logger.info('All infrastructure services disconnected successfully.');
      process.exit(0);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error({ err }, 'Error during infrastructure shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};