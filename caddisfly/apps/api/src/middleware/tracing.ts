import { Request, Response, NextFunction } from 'express';
import { als } from '@caddisfly/logger';
import { randomUUID } from 'node:crypto';

export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const traceId = (req.headers['x-trace-id'] as string) || randomUUID();
  
  // Bind the store to this specific async execution context
  als.run({ traceId }, () => {
    next();
  });
};