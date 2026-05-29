
/**
 * Estrutura base para todos os erros da aplicação.
 */
export interface BaseAppError {
  message: string;
  name?: string;
  stack?: string;
  statusCode: number;
  metadata?: Record<string, number>;
  component?: string;
  timestamp: string;
}

/**
 * Campo individual com erro de validação.
 * Estrutura otimizada para feedback de formulários.
 */
export interface ValidationFieldError {
  field: string;
  message: string;
  rule?: string;
  value?: unknown;
}

/**
 * Erro de validação de dados (geralmente com Zod).
 */
export type ValidationError = BaseAppError & {
  type: 'VALIDATION_ERROR';
  errors: ValidationFieldError[];
};

export type NotFoundError = BaseAppError & {
  type: 'NOT_FOUND';
  resource?: string;
  resourceId?: string | number;
};

export type UnauthorizedError = BaseAppError & {
  type: 'UNAUTHORIZED';
  reason?: 'invalid_token' | 'expired_token' | 'missing_token' | 'invalid_credentials' | 'missing_credentials';
};

export type ForbiddenError = BaseAppError & {
  type: 'FORBIDDEN';
  requiredPermission?: string;
};

export type ConflictError = BaseAppError & {
  type: 'CONFLICT';
  conflictingField?: string;
  existingValue?: unknown;
};

export type BusinessError = BaseAppError & {
  type: 'BUSINESS_ERROR';
  code?: string;
};

export type DatabaseError = BaseAppError & {
  type: 'DATABASE_ERROR';
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION';
  table?: string;
  cause?: unknown; 
};

export type ExternalServiceError = BaseAppError & {
  type: 'EXTERNAL_SERVICE_ERROR';
  service: string;
  operation?: string;
  cause?: unknown;
};

export type InternalServerError = BaseAppError & {
  type: 'INTERNAL_SERVER_ERROR';
  service?: string;
  operation?: string;
  cause?: unknown;
};

/**
 * Discriminated Union de todos os erros possíveis.
 */
export type AppError = 
  | ValidationError
  | NotFoundError
  | UnauthorizedError
  | ForbiddenError
  | ConflictError
  | BusinessError
  | DatabaseError
  | ExternalServiceError
  | InternalServerError;
