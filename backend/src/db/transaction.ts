import type { Database } from '@/db'
import { db as defaultDb } from '@/db'

/**
 * Tipo da transacção Drizzle — inferido do tipo do db.
 * Passado para funções que precisam de correr dentro de uma transacção existente.
 */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

/**
 * União do db normal com uma transacção activa.
 * Permite que funções do repository aceitem ambos — reutilizáveis dentro e fora de transacções.
 *
 * @example
 * // Repository method que funciona em ambos os contextos:
 * async create(data: Foo, db: DbOrTx = defaultDb): Promise<Foo> {
 *   const [row] = await db.insert(foos).values(data).returning()
 *   return row
 * }
 */
export type DbOrTx = Database | Transaction

/**
 * Executa uma função dentro de uma transacção Drizzle.
 * Faz rollback automático se qualquer erro for lançado.
 * Pool gerido pelo postgres.js — sem overhead de conexão extra.
 *
 * @example
 * // Operação composta com rollback automático:
 * const result = await withTransaction(async (tx) => {
 *   const activity = await activityRepo.complete(activityId, data, tx)
 *   await inputRepo.debitStock(inputId, quantity, tx)
 *   await financialRepo.create(entry, tx)
 *   return activity
 * })
 */
export const withTransaction = async <T>(
  fn: (tx: Transaction) => Promise<T>,
  dbInstance: Database = defaultDb
): Promise<T> => {
  return dbInstance.transaction(fn)
}

/**
 * Verifica se um valor é uma transacção activa (vs o db root).
 * Útil quando precisas de iniciar uma transacção só se não houver uma activa.
 *
 * Nota: Drizzle não suporta savepoints nativamente —
 * se precisares de transacções aninhadas, passa a tx para baixo explicitamente.
 */
export const isTx = (dbOrTx: DbOrTx): boolean => {
  return !('transaction' in dbOrTx)
}