import { Elysia } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { staffUsers, staffSessions } from '@/db/schema'
import { verifyToken } from '@/shared/auth/auth'
import { ErrorFactory } from '@/shared/result/factory'
import { Err, Ok, type Result } from '@/shared/result/types'
import type { UnauthorizedError, ForbiddenError } from '@/shared/result/errors'

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────

export interface StaffAuthContext {
  staffId: string
  email:   string
  name:    string
}

type StaffAuthError  = UnauthorizedError | ForbiddenError
export type StaffAuthResult = Result<StaffAuthContext, StaffAuthError>

// ─────────────────────────────────────────────
// Helper — unwrap tipado para controllers
// ─────────────────────────────────────────────

/**
 * Extrai o StaffAuthContext de forma type-safe.
 *
 * O middleware já bloqueou requests não autenticados via `onBeforeHandle`,
 * por isso quando o controller executa `auth` é sempre Success.
 * Este helper torna isso explícito para o TypeScript sem casts manuais.
 *
 * Uso:
 * ```ts
 * .post('/members', async ({ auth, body }) => {
 *   const { staffId } = getStaffAuth(auth)
 *   // staffId: string ✓
 * })
 * ```
 */
export const getStaffAuth = (context: { staffAuth: StaffAuthResult }): StaffAuthContext => {
  const auth = context.staffAuth
  if (!auth.success) {
    throw new Error('[StaffAuth] getStaffAuth called with failed auth — middleware bypass detected')
  }
  return auth.value
}

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

export const staffAuthMiddleware = () =>
  new Elysia({ name: 'staff-auth' })

    .derive({ as: 'global' }, async ({ cookie }): Promise<{ staffAuth: StaffAuthResult }> => {
      const rawToken = cookie['staff_token']?.value
      if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '') {
        return {
          staffAuth: Err(
            ErrorFactory.unauthorized('Autenticação necessária', 'missing_token', 'StaffAuthMiddleware')
          ),
        }
      }

      const payload = verifyToken(rawToken)
      if (!payload || payload.type !== 'staff') {
        return {
          staffAuth: Err(
            ErrorFactory.unauthorized('Token inválido ou expirado', 'invalid_token', 'StaffAuthMiddleware')
          ),
        }
      }

      const { staffId } = payload

      const [session] = await db
        .select({ id: staffSessions.id, isActive: staffSessions.isActive })
        .from(staffSessions)
        .where(eq(staffSessions.token, rawToken))
        .limit(1)

      if (!session || !session.isActive) {
        return {
          staffAuth: Err(
            ErrorFactory.unauthorized('Sessão inválida ou revogada', 'expired_token', 'StaffAuthMiddleware')
          ),
        }
      }

      const [staff] = await db
        .select({
          id:       staffUsers.id,
          email:    staffUsers.email,
          name:     staffUsers.name,
          isActive: staffUsers.isActive,
        })
        .from(staffUsers)
        .where(eq(staffUsers.id, staffId))
        .limit(1)

      if (!staff) {
        return {
          staffAuth: Err(
            ErrorFactory.unauthorized('Utilizador não encontrado', 'missing_token', 'StaffAuthMiddleware')
          ),
        }
      }

      if (!staff.isActive) {
        return {
          staffAuth: Err(
            ErrorFactory.forbidden('Conta desactivada', undefined, 'StaffAuthMiddleware')
          ),
        }
      }

      return {
        staffAuth: Ok({
          staffId: staff.id,
          email:   staff.email,
          name:    staff.name,
        }),
      }
    })

    .onBeforeHandle({ as: 'local' }, ({ staffAuth, set }) => {
      if (!staffAuth.success) {
        set.status = staffAuth.error.statusCode
        return staffAuth.error
      }
      return
    })
