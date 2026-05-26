import { ErrorFactory } from '@/shared/result/factory'
import { logger } from '@/shared/logger/logger'

type DbOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION'

function inferOperation(method: string): DbOperation {
  if (method.startsWith('find') || method.startsWith('get'))      return 'SELECT'
  if (method.startsWith('create') || method.startsWith('insert')) return 'INSERT'
  if (method.startsWith('update') || method.startsWith('upsert')) return 'UPDATE'
  if (method.startsWith('delete') || method.startsWith('soft'))   return 'DELETE'
  return 'SELECT'
}

export async function dbExec<T>(
  operation: string,
  component: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    logger.error(
      { err, operation, component },
      `DB error in ${component}.${operation}`,
    )
    throw ErrorFactory.database(
      `DB error in ${operation}`,
      err,
      inferOperation(operation),
      undefined,
      component,
    )
  }
}