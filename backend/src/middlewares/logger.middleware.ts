import { Elysia } from 'elysia';
import { httpLogger } from '@/shared/logger/logger';
import { randomUUID } from 'crypto';

export const loggerMiddleware = () =>
  new Elysia({ name: 'logger' })
    .derive(({ request }) => {
      const requestId = randomUUID();
      const startTime = Date.now();
      
      httpLogger.info(
        {
          requestId,
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
        },
        'Incoming request'
      );
      
      return { requestId, startTime };
    })
    .onAfterHandle(({ request, path, set, requestId, startTime }) => {
      const duration = Date.now() - (startTime || Date.now());
      
      httpLogger.info(
        {
          requestId,
          method: request.method,
          path,
          statusCode: set.status || 200,
          duration: `${duration}ms`,
        },
        'Request completed'
      );
    })
    .onError(({ request, path, error, requestId }) => {
      httpLogger.error(
        {
          requestId,
          method: request.method,
          path,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : {
            name: 'Unknown',
            message: String(error),
          },
        },
        'Request error'
      );
    });