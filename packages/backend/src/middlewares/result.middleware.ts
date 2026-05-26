// src/middlewares/result.middleware.ts
import { Elysia } from "elysia";
import { Result } from "@/shared/result/types"; 
import { httpLogger } from "@/shared/logger/logger";
import { AppError, ValidationError } from '@/shared/result/errors';

function isResult(value: unknown): value is Result<unknown, AppError> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    ("value" in value || "error" in value)
  );
}

type ErrorResponse = {
  success: false;
  error: {
    type: AppError['type'];
    message: string;
    code?: string;
    details?: unknown;
    resource?: string;
    timestamp: string;
  };
};

const formatErrorResponse = (error: AppError): ErrorResponse => ({
  success: false,
  error: {
    type: error.type,
    message: error.message,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    code: "code" in error ? (error as any).code : undefined,
    details: "errors" in error ? (error as ValidationError).errors : undefined, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resource: "resource" in error ? (error as any).resource : undefined,
    timestamp: error.timestamp,
  },
});

/**
 * Extrai informações estruturadas do erro para logging rico
 */
const extractErrorContext = (error: AppError, request: Request) => {
  const baseContext = {
    type: error.type,
    message: error.message,
    statusCode: error.statusCode,
    component: error.component,
    path: new URL(request.url).pathname,
    method: request.method,
    timestamp: error.timestamp,
  };

  if (error.stack) {
    Object.assign(baseContext, {
      stack: error.stack,
      stackPreview: error.stack.split('\n').slice(0, 4).join('\n'),
    });
  }

  switch (error.type) {
    case 'VALIDATION_ERROR': {
      const validationError = error as ValidationError;
      return {
        ...baseContext,
        validationErrors: validationError.errors.map(err => ({
          field: err.field,
          message: err.message,
          rule: err.rule,
          receivedValue: err.value,
        })),
        failedFields: validationError.errors.map(e => e.field),
        errorCount: validationError.errors.length,
      };
    }

    case 'NOT_FOUND': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const notFoundError = error as any;
      return {
        ...baseContext,
        resource: notFoundError.resource,
        resourceId: notFoundError.resourceId,
      };
    }

    case 'UNAUTHORIZED': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unauthorizedError = error as any;
      return {
        ...baseContext,
        reason: unauthorizedError.reason,
      };
    }

    case 'FORBIDDEN': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const forbiddenError = error as any;
      return {
        ...baseContext,
        requiredPermission: forbiddenError.requiredPermission,
      };
    }

    case 'CONFLICT': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conflictError = error as any;
      return {
        ...baseContext,
        conflictingField: conflictError.conflictingField,
        existingValue: conflictError.existingValue,
      };
    }

    case 'DATABASE_ERROR': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbError = error as any;
      return {
        ...baseContext,
        operation: dbError.operation,
        table: dbError.table,
        cause: dbError.cause ? {
          name: dbError.cause?.name,
          message: dbError.cause?.message,
          code: dbError.cause?.code,
        } : undefined,
      };
    }

    case 'EXTERNAL_SERVICE_ERROR': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serviceError = error as any;
      return {
        ...baseContext,
        service: serviceError.service,
        operation: serviceError.operation,
        cause: serviceError.cause,
      };
    }

    case 'BUSINESS_ERROR': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const businessError = error as any;
      return {
        ...baseContext,
        code: businessError.code,
        metadata: businessError.metadata,
      };
    }

    default:
      return baseContext;
  }
};

/**
 * Determina o nível de log apropriado baseado no tipo de erro
 */
const getLogLevel = (error: AppError): 'error' | 'warn' | 'info' => {
  // Erros de sistema (5xx) são sempre ERROR
  if (error.statusCode >= 500) {
    return 'error';
  }

  // Erros de autenticação/autorização são INFO (não são bugs)
  if (error.type === 'UNAUTHORIZED' || error.type === 'FORBIDDEN') {
    return 'info';
  }

  // Erros de validação são INFO (dados ruins do cliente)
  if (error.type === 'VALIDATION_ERROR') {
    return 'info';
  }

  // NOT_FOUND é INFO (recurso não existe)
  if (error.type === 'NOT_FOUND') {
    return 'info';
  }

  // Conflitos e erros de negócio são WARN
  if (error.type === 'CONFLICT' || error.type === 'BUSINESS_ERROR') {
    return 'warn';
  }

  // Default: WARN
  return 'warn';
};

export const resultMiddleware = () =>
  new Elysia({ name: "result-handler" })
    .onAfterHandle({ as: 'global' }, ({ response, set, request }) => {
      if (!isResult(response)) {
        return response;
      }

      if (response.success) {
        return response.value;
      }

      const error = response.error;
      const logLevel = getLogLevel(error);
      const context = extractErrorContext(error, request);

      // Log estruturado com TODAS as informações relevantes
      switch (logLevel) {
        case 'error':
          httpLogger.error(
            context,
            `[${error.type}] ${error.message}`
          );
          break;
        
        case 'warn':
          httpLogger.warn(
            context,
            `[${error.type}] ${error.message}`
          );
          break;
        
        case 'info':
          httpLogger.info(
            context,
            `[${error.type}] ${error.message}`
          );
          break;
      }

      set.status = error.statusCode;
      return formatErrorResponse(error);
    });