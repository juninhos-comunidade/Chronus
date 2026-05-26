import pino, { type Logger } from 'pino';
import { env } from '@/config/env.js';
import { LogCategory, type LogContext } from './types.js';

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  transport: env.LOG_PRETTY
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'chronus-backend',
    environment: env.NODE_ENV,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createChildLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}

export const appLogger = logger.child({ category: LogCategory.APP });
export const httpLogger = logger.child({ category: LogCategory.HTTP });
export const databaseLogger = logger.child({ category: LogCategory.DATABASE });
export const queueLogger = logger.child({ category: LogCategory.QUEUE });
export const errorLogger = logger.child({ category: LogCategory.ERROR });
export const performanceLogger = logger.child({ category: LogCategory.PERFORMANCE });
export const securityLogger = logger.child({ category: LogCategory.SECURITY });

export function createContextLogger(context: LogContext): Logger {
  return logger.child(context);
}