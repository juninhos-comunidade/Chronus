import { describe, it, expect } from 'vitest';
import { Err, Ok, Result } from './types';
import { ErrorFactory } from './factory';
import { flatMap, isErr, isOk, map, matchError, unwrap, unwrapOr, unwrapOrElse } from './utils';
import z from 'zod';
import { validateWithZod } from './zod-integration';
import { AppError } from './errors';

describe('Result Pattern - Core', () => {
  it('deve criar Ok com valor', () => {
    const result = Ok(42);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(42);
    }
  });

  it('deve criar Err com erro', () => {
    const error = ErrorFactory.notFound('User not found');
    const result = Err(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('NOT_FOUND');
    }
  });

  it('isOk deve retornar true para Ok', () => {
    const result = Ok(100);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
  });

  it('isErr deve retornar true para Err', () => {
    const result = Err(ErrorFactory.business('Invalid operation'));
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
  });
});

describe('Result Pattern - Transformations', () => {
  it('map deve transformar valor em Ok', () => {
    const result = Ok(10);
    const mapped = map(result, (x) => x * 2);
    expect(mapped.success).toBe(true);
    if (mapped.success) {
      expect(mapped.value).toBe(20);
    }
  });

  it('map não deve transformar Err', () => {
    const error = ErrorFactory.unauthorized('No token');
    const result = Err(error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = map(result, (x: any) => x * 2);
    expect(mapped.success).toBe(false);
  });

  it('flatMap deve encadear Results', () => {
    const result = Ok(5);
    const chained = flatMap(result, (x) => Ok(x * 3));
    expect(chained.success).toBe(true);
    if (chained.success) {
      expect(chained.value).toBe(15);
    }
  });

  it('flatMap deve propagar Err', () => {
    const error = ErrorFactory.conflict('Email exists');
    const result = Err(error);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chained = flatMap(result, (x: any) => Ok(x * 3));
    expect(chained.success).toBe(false);
  });
});

describe('Result Pattern - Unwrap Functions', () => {
  it('unwrap deve retornar valor de Ok', () => {
    const result = Ok('success');
    expect(unwrap(result)).toBe('success');
  });

  it('unwrap deve lançar erro em Err', () => {
    const result = Err(ErrorFactory.business('Failed'));
    expect(() => unwrap(result)).toThrow();
  });

  it('unwrapOr deve retornar valor padrão em Err', () => {
    const result = Err(ErrorFactory.notFound('Not found'));
    expect(unwrapOr(result, 'default')).toBe('default');
  });

  it('unwrapOrElse deve computar valor padrão em Err', () => {
    const result = Err(ErrorFactory.database('DB error'));
    const value = unwrapOrElse(result, (err) => `Error: ${err.type}`);
    expect(value).toBe('Error: DATABASE_ERROR');
  });
});

describe('ErrorFactory', () => {
  it('deve criar ValidationError com timestamp', () => {
    const error = ErrorFactory.validation('Invalid data', [
      { field: 'email', message: 'Email inválido' }
    ]);
    expect(error.type).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(422);
    expect(error.timestamp).toBeDefined();
    expect(error.errors).toHaveLength(1);
  });

  it('deve criar NotFoundError com resource', () => {
    const error = ErrorFactory.notFound('User not found', 'User', 123);
    expect(error.type).toBe('NOT_FOUND');
    expect(error.resource).toBe('User');
    expect(error.resourceId).toBe(123);
  });

  it('deve criar UnauthorizedError com reason', () => {
    const error = ErrorFactory.unauthorized('Token expired', 'expired_token');
    expect(error.type).toBe('UNAUTHORIZED');
    expect(error.reason).toBe('expired_token');
  });
});

describe('matchError', () => {
  it('deve executar handler específico', () => {
    const error = ErrorFactory.notFound('Not found');
    const result = matchError(error, {
      NOT_FOUND: (e) => `Resource não encontrado: ${e.message}`,
      default: () => 'Erro desconhecido'
    });
    expect(result).toContain('Resource não encontrado');
  });

  it('deve executar default quando handler não existe', () => {
    const error = ErrorFactory.database('DB error');
    const result = matchError(error, {
      NOT_FOUND: () => 'Not found',
      default: (e) => `Default: ${e.type}`
    });
    expect(result).toBe('Default: DATABASE_ERROR');
  });
});

describe('Zod Integration', () => {
  const UserSchema = z.object({
    email: z.string().email('Email inválido'),
    age: z.number().min(18, 'Deve ter no mínimo 18 anos'),
  });

  it('deve validar dados corretos com Zod', () => {
    const data = { email: 'test@example.com', age: 25 };
    const result = validateWithZod(UserSchema, data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.email).toBe('test@example.com');
    }
  });

  it('deve retornar ValidationError para dados inválidos', () => {
    const data = { email: 'invalid', age: 15 };
    const result = validateWithZod(UserSchema, data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('VALIDATION_ERROR');
      expect(result.error.errors).toHaveLength(2);
      expect(result.error.errors[0].field).toBe('email');
    }
  });

  it('deve estruturar erros para frontend', () => {
    const data = { email: 'bad', age: 10 };
    const result = validateWithZod(UserSchema, data, 'UserForm');
    
    if (!result.success) {
      const emailError = result.error.errors.find(e => e.field === 'email');
      const ageError = result.error.errors.find(e => e.field === 'age');
      
      expect(emailError?.message).toBe('Email inválido');
      expect(ageError?.message).toBe('Deve ter no mínimo 18 anos');
      expect(result.error.component).toBe('UserForm');
    }
  });
});

describe('Example - User Registration', () => {
  const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
  });


  const registerUser = async (data: unknown): Promise<Result<{ id: number }, AppError>> => {
    // 1. Validação
    const validation = validateWithZod(RegisterSchema, data, 'RegisterForm');
    if (!validation.success) {
      return validation;
    }

    const user = validation.value;

    // 2. Verificar se email já existe (simulado)
    if (user.email === 'existe@example.com') {
      return Err(ErrorFactory.conflict(
        'Email já cadastrado',
        'email',
        user.email
      ));
    }

    // 3. Criar usuário (simulado)
    return Ok({ id: 1 });
  };

  it('deve registrar usuário com sucesso', async () => {
    const data = {
      email: 'novo@example.com',
      password: 'senha123',
      name: 'João'
    };
    const result = await registerUser(data);
    expect(result.success).toBe(true);
  });

  it('deve retornar erro de validação', async () => {
    const data = { email: 'bad', password: '123', name: 'A' };
    const result = await registerUser(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('VALIDATION_ERROR');
    }
  });

  it('deve retornar erro de conflito', async () => {
    const data = {
      email: 'existe@example.com',
      password: 'senha123',
      name: 'João'
    };
    const result = await registerUser(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CONFLICT');
    }
  });
});