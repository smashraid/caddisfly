import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  traceId: string;
}

export const als = new AsyncLocalStorage<RequestContext>();

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    const store = als.getStore();
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      traceId: store?.traceId || 'global',
      level: 'INFO',
      message: msg,
      ...meta
    }));
  }
};