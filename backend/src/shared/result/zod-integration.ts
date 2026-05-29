// src/shared/result/zod-integration.ts
import { z } from 'zod';
import { ValidationError, ValidationFieldError } from './errors';
import { ErrorFactory } from './factory';
import { Err, Ok, Result } from './types';
import { logger } from '../logger/logger';

/**
 * Tipo auxiliar para extrair o output type de um schema Zod
 */
export type ZodOutput<T extends z.ZodTypeAny> = z.infer<T>;

/**
 * Verifica se o issue é do tipo que tem a propriedade 'received'
 */
function hasReceivedProperty(issue: z.ZodIssue): issue is z.ZodIssue & { received: unknown } {
  return issue.code === 'invalid_type' && 'received' in issue;
}

/**
 * Obtém o valor recebido de um issue, se disponível
 */
function getReceivedValue(issue: z.ZodIssue): unknown {
  if (hasReceivedProperty(issue)) {
    return issue.received;
  }
  if ('input' in issue) {
    return (issue as { input?: unknown }).input;
  }
  return undefined;
}

/**
 * Converte erro do Zod para ValidationError estruturado.
 * MELHORADO: Inclui mais contexto e detalhes para debugging
 */
export const zodErrorToValidationError = (
  error: z.ZodError,
  component?: string,
  originalData?: unknown
): ValidationError => {
  // Agrupa erros por campo
  const errorsByField = new Map<string, z.ZodIssue[]>();
  
  for (const err of error.errors) {
    const fieldPath = err.path.join('.');
    if (!errorsByField.has(fieldPath)) {
      errorsByField.set(fieldPath, []);
    }
    errorsByField.get(fieldPath)!.push(err);
  }

  const errors: ValidationFieldError[] = Array.from(errorsByField.entries()).map(
    ([field, issues]) => {
      const primaryIssue = issues[0];
      
      return {
        field: field || 'root',
        message: formatZodMessage(primaryIssue),
        rule: primaryIssue.code,
        value: shouldHideValue(field) ? '[REDACTED]' : getReceivedValue(primaryIssue),
   
        details: issues.length > 1 ? issues.slice(1).map(i => formatZodMessage(i)) : undefined,
      };
    }
  );

  // Log estruturado de validação (para debugging local)
  if (process.env.NODE_ENV === 'development') {
    logger.debug({
      component: component || 'ZodValidation',
      errorCount: errors.length,
      fields: errors.map(e => e.field),
      errors: errors,
      // Dados originais (útil para entender o que foi enviado)
      originalData: sanitizeForLogging(originalData),
    }, 'Validation failed');
  }

  return ErrorFactory.validation(
    `Erro de validação: ${errors.length} campo(s) inválido(s)`,
    errors,
    component
  );
};

/**
 * Remove dados sensíveis antes de logar
 */
function sanitizeForLogging(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data as Record<string, unknown> };
  const sensitiveFields = ['password', 'senha', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Formata mensagens do Zod de forma mais amigável
 */
function formatZodMessage(issue: z.ZodIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined') {
        return 'Campo obrigatório';
      }
      return `Tipo inválido: esperado ${issue.expected}, recebido ${issue.received}`;
    
    case 'too_small':
      if (issue.type === 'string') {
        return `Mínimo de ${issue.minimum} caracteres`;
      }
      if (issue.type === 'number') {
        return `Valor mínimo: ${issue.minimum}`;
      }
      if (issue.type === 'array') {
        return `Mínimo de ${issue.minimum} itens`;
      }
      return issue.message;
    
    case 'too_big':
      if (issue.type === 'string') {
        return `Máximo de ${issue.maximum} caracteres`;
      }
      if (issue.type === 'number') {
        return `Valor máximo: ${issue.maximum}`;
      }
      if (issue.type === 'array') {
        return `Máximo de ${issue.maximum} itens`;
      }
      return issue.message;
    
    case 'invalid_string':
      if (issue.validation === 'email') {
        return 'E-mail inválido';
      }
      if (issue.validation === 'uuid') {
        return 'ID inválido (formato UUID esperado)';
      }
      if (issue.validation === 'url') {
        return 'URL inválida';
      }
      return issue.message;
    
    case 'invalid_date':
      return 'Data inválida';
    
    case 'invalid_enum_value':
      return `Valor deve ser um de: ${issue.options?.join(', ')}`;
    
    case 'custom':
      return issue.message || 'Valor inválido';
    
    default:
      return issue.message;
  }
}

/**
 * Determina se o valor deve ser ocultado no log
 */
function shouldHideValue(field: string): boolean {
  const sensitiveFields = ['password', 'senha', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
  return sensitiveFields.some(sensitive => 
    field.toLowerCase().includes(sensitive.toLowerCase())
  );
}

/**
 * Valida dados com schema Zod e retorna Result.
 * MELHORADO: Logs mais detalhados em caso de erro
 */
export const validateWithZod = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  component?: string
): Result<ZodOutput<T>, ValidationError> => {
  const parsed = schema.safeParse(data);
  
  // Log de debugging em desenvolvimento
  if (process.env.NODE_ENV === 'development' && !parsed.success) {
    logger.debug({
      component: component || 'ZodValidation',
      dataReceived: sanitizeForLogging(data),
      errorCount: parsed.error.errors.length,
    }, 'Validation attempt failed');
  }
  
  if (parsed.success) {
    return Ok(parsed.data as ZodOutput<T>);
  }
  
  return Err(zodErrorToValidationError(parsed.error, component, data));
};

/**
 * Helper assíncrono para validação com Zod
 */
export const validateWithZodAsync = async <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  component?: string
): Promise<Result<ZodOutput<T>, ValidationError>> => {
  const parsed = await schema.safeParseAsync(data);
  
  if (parsed.success) {
    return Ok(parsed.data as ZodOutput<T>);
  }
  
  return Err(zodErrorToValidationError(parsed.error, component, data));
};

/**
 * Valida dados parciais (útil para updates PATCH)
 */
export const validatePartialWithZod = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
  component?: string
): Result<Partial<ZodOutput<T>>, ValidationError> => {
  const parsed = schema.safeParse(data);
  
  if (parsed.success) {
    return Ok(parsed.data as ZodOutput<T>);
  }
  
  if (Object.keys(data as object).length === 0) {
    return Ok({} as Partial<ZodOutput<T>>);
  }
  
  return Err(zodErrorToValidationError(parsed.error, component, data));
};

/**
 * Extrai erros de validação em formato plano para formulários
 */
export const flattenValidationErrors = (
  error: ValidationError | null | undefined
): Record<string, string> => {
  if (!error || !error.errors) {
    return {};
  }
  
  return error.errors.reduce((acc, fieldError) => {
    acc[fieldError.field] = fieldError.message;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Extrai o primeiro erro de validação
 */
export const getFirstErrorMessage = (
  error: ValidationError | null | undefined
): string | null => {
  if (!error || !error.errors || error.errors.length === 0) {
    return null;
  }
  return error.errors[0].message;
};

// Schemas helpers (mantidos do código original)
export const createPreprocessedSchema = <T extends z.ZodTypeAny>(
  preprocessor: (val: unknown) => unknown,
  schema: T
) => {
  return z.preprocess(preprocessor, schema);
};

export const numericStringSchema = (options?: { 
  min?: number; 
  max?: number;
  allowNegative?: boolean;
}) => {
  return z.union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === 'number') return val.toString();
      return val.trim();
    })
    .refine((val) => {
      const num = parseFloat(val);
      if (isNaN(num)) return false;
      
      if (options?.allowNegative === false && num < 0) return false;
      if (options?.min !== undefined && num < options.min) return false;
      if (options?.max !== undefined && num > options.max) return false;
      
      return true;
    }, {
      message: (() => {
        const parts: string[] = [];
        if (options?.allowNegative === false) parts.push('não pode ser negativo');
        if (options?.min !== undefined) parts.push(`mínimo: ${options.min}`);
        if (options?.max !== undefined) parts.push(`máximo: ${options.max}`);
        
        if (parts.length > 0) {
          return `Valor inválido (${parts.join(', ')})`;
        }
        return 'Deve ser um número válido';
      })(),
    })
    .transform((val) => parseFloat(val).toString());
};

export const flexibleDateSchema = () => {
  return z.union([z.string(), z.date()])
    .transform((val) => {
      if (val instanceof Date) return val;
      const parsed = new Date(val);
      if (isNaN(parsed.getTime())) {
        throw new Error('Data inválida');
      }
      return parsed;
    });
};

export const paginationSchema = (defaults?: { page?: number; perPage?: number }) => {
  return z.object({
    page: z.coerce.number().min(1).default(defaults?.page ?? 1),
    perPage: z.coerce.number().min(1).max(100).default(defaults?.perPage ?? 20),
  });
};

export const sortingSchema = <T extends string>(allowedFields: T[]) => {
  return z.object({
    sortBy: z.enum(allowedFields as [T, ...T[]]).default(allowedFields[0]),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });
};

export const dateRangeSchema = () => {
  return z.object({
    startDate: z.string().optional().transform((val) => 
      val ? new Date(val) : undefined
    ),
    endDate: z.string().optional().transform((val) => 
      val ? new Date(val) : undefined
    ),
  });
};

export const dateRangeWithValidationSchema = () => {
  return dateRangeSchema().refine((data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  }, {
    message: 'Data inicial não pode ser maior que data final',
    path: ['endDate'],
  });
};