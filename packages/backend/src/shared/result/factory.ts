// src/shared/result/factory.ts
import { 
  AppError, 
  BusinessError, 
  ConflictError, 
  DatabaseError, 
  ExternalServiceError, 
  ForbiddenError, 
  InternalServerError, 
  NotFoundError, 
  UnauthorizedError, 
  ValidationError, 
  ValidationFieldError 
} from './errors';

/**
 * Captura stack trace do ponto onde o erro foi criado
 * Isso é CRUCIAL para debugging - mostra exatamente onde o erro aconteceu
 */
const captureStackTrace = (): string | undefined => {
  const stack = new Error().stack;
  if (!stack) return undefined;
  
  const lines = stack.split('\n');
  const relevantLines = lines.filter((line, index) => {
    if (index === 0) return false; 
    if (line.includes('createError')) return false;
    if (line.includes('ErrorFactory')) return false;
    return true;
  });
  
  return relevantLines.join('\n');
};

const createError = <T extends AppError>(
  data: Omit<T, 'timestamp' | 'stack'>
): T => ({
  ...data,
  timestamp: new Date().toISOString(),
  stack: captureStackTrace(),
} as T);

export const ErrorFactory = {
  /**
   * Cria erro de validação com stack trace completa
   */
  validation: (
    message: string,
    errors: ValidationFieldError[] = [],
    component?: string
  ) => {
    const error = createError<ValidationError>({
      type: "VALIDATION_ERROR",
      statusCode: 422,
      message,
      errors,
      component,
    });

    if (error.stack) {
      error.name = 'ValidationError';
    }

    return error;
  },

  notFound: (
    message: string,
    resource?: string,
    resourceId?: string | number,
    component?: string
  ) => {
    const error = createError<NotFoundError>({
      type: 'NOT_FOUND',
      statusCode: 404,
      message,
      resource,
      resourceId,
      component,
    });

    if (error.stack) {
      error.name = 'NotFoundError';
    }

    return error;
  },

  unauthorized: (
    message: string,
    reason?: UnauthorizedError['reason'],
    component?: string
  ) => {
    const error = createError<UnauthorizedError>({
      type: 'UNAUTHORIZED',
      statusCode: 401,
      message,
      reason,
      component,
    });

    if (error.stack) {
      error.name = 'UnauthorizedError';
    }

    return error;
  },

  forbidden: (
    message: string,
    requiredPermission?: string,
    component?: string
  ) => {
    const error = createError<ForbiddenError>({
      type: 'FORBIDDEN',
      statusCode: 403,
      message,
      requiredPermission,
      component,
    });

    if (error.stack) {
      error.name = 'ForbiddenError';
    }

    return error;
  },

  conflict: (
    message: string,
    conflictingField?: string,
    existingValue?: unknown,
    component?: string
  ) => {
    const error = createError<ConflictError>({
      type: 'CONFLICT',
      statusCode: 409,
      message,
      conflictingField,
      existingValue,
      component,
    });

    if (error.stack) {
      error.name = 'ConflictError';
    }

    return error;
  },

  business: (
    message: string,
    code?: string,
    component?: string
  ) => {
    const error = createError<BusinessError>({
      type: 'BUSINESS_ERROR',
      statusCode: 400, 
      message,
      code,
      component
    });

    if (error.stack) {
      error.name = 'BusinessError';
    }

    return error;
  },

  database: (
    message: string,
    cause?: unknown,
    operation?: DatabaseError['operation'],
    table?: string,
    component?: string
  ) => {
    const error = createError<DatabaseError>({
      type: 'DATABASE_ERROR',
      statusCode: 500,
      message,
      operation,
      table,
      cause,
      component,
    });

    if (error.stack) {
      error.name = 'DatabaseError';
    }

    return error;
  },

  externalService: (
    message: string,
    service: string,
    cause?: unknown,
    operation?: string,
    component?: string
  ) => {
    const error = createError<ExternalServiceError>({
      type: 'EXTERNAL_SERVICE_ERROR',
      statusCode: 502,
      message,
      service,
      operation,
      cause,
      component,
    });

    if (error.stack) {
      error.name = 'ExternalServiceError';
    }

    return error;
  },

  internalError: (
    message: string,
    cause?: unknown,
    component?: string
  ) => {
    const error = createError<InternalServerError>({
      type: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      message,
      service: 'api',
      cause,
      component,
    });

    if (error.stack) {
      error.name = 'InternalServerError';
    }

    return error;
  },

  tooManyRequests: (
    message: string,
    retryAfter: number,
    component?: string
  ): AppError => {
    const error = {
      type: 'BUSINESS_ERROR' as const,
      code: 'TOO_MANY_REQUESTS',
      message,
      statusCode: 429,
      component,
      timestamp: new Date().toISOString(),
      stack: captureStackTrace(),
      name: 'RateLimitError',
      metadata: {
        retryAfter,
        retryAfterSeconds: retryAfter,
      },
    };

    return error;
  }
};