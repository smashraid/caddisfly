import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import { logger, asyncLocalStorage } from '@caddisfly/logger';

export const requestContextMiddleware = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-trace-id']?.toString() || randomUUID(),
  customProps: (req) => {
    const traceId = req.id as string;
    asyncLocalStorage.enterWith(new Map([['traceId', traceId]]));
    return { traceId };
  }
});