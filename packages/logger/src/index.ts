import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

export const logger = pino({
  level: 'info',
  mixin: () => {
    const store = asyncLocalStorage.getStore();
    return { traceId: store?.get('traceId') || 'n/a' };
  }
});