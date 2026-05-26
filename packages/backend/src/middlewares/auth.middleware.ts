import { Elysia } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, sessions } from '@/db/schema'
import { verifyToken } from '@/shared/auth/auth'
import { ErrorFactory } from '@/shared/result/factory'
import { Err, Ok, type Result } from '@/shared/result/types'
import type { UnauthorizedError, ForbiddenError } from '@/shared/result/errors'

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────

export interface AuthContext {
  userId: string
  roles:  Array<'buyer' | 'seller'>
}

type AuthError  = UnauthorizedError | ForbiddenError
export type AuthResult = Result<AuthContext, AuthError>

// ─────────────────────────────────────────────
// Helper — unwrap tipado (mesmo padrão do staff)
// ─────────────────────────────────────────────

export const getAuth = (auth: AuthResult): AuthContext => {
  if (!auth.success) {
    throw new Error('[Auth] getAuth called with failed auth — middleware bypass detected')
  }
  return auth.value
}

/**
 * Garante que o utilizador tem role 'owner'.
 * Usar em rotas de gestão de loja.
 *
 * ```ts
 * const ctx = getAuth(auth as AuthResult)
 * const ownerCtx = requireOwner(ctx)
 * if (!ownerCtx.success) return ownerCtx
 * ```
 */
export const requireUser = (
  auth: AuthResult
): Result<AuthContext, ForbiddenError | UnauthorizedError> => {
  if (!auth.success) return auth
  return Ok(auth.value)
}

export const requireSeller = (
  auth: AuthResult
): Result<AuthContext, ForbiddenError | UnauthorizedError> => {
  if (!auth.success) return auth
  if (!auth.value.roles.includes('seller')) {
    return Err(ErrorFactory.forbidden('Acesso restrito a sellers', undefined, 'AuthMiddleware'))
  }
  return Ok(auth.value)
}

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

export const authMiddleware = () =>
  new Elysia({ name: 'auth' })

    .derive({ as: 'global' }, async ({ cookie }): Promise<{ auth: AuthResult; user: AuthResult }> => {
      const rawToken = cookie['auth_token']?.value
      if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '') {
        const failed = Err(
          ErrorFactory.unauthorized('Autenticação necessária', 'missing_token', 'AuthMiddleware')
        )
        return {
          auth: failed,
          user: failed,
        }
      }

      // Verificar JWT — garantir que é token de user (não staff)
      const payload = verifyToken(rawToken)
      if (!payload || payload.type !== 'user') {
        const failed = Err(
          ErrorFactory.unauthorized('Token inválido ou expirado', 'invalid_token', 'AuthMiddleware')
        )
        return {
          auth: failed,
          user: failed,
        }
      }

      const { userId } = payload

      // Confirmar sessão activa na DB
      const [session] = await db
        .select({ id: sessions.id, isActive: sessions.isActive })
        .from(sessions)
        .where(eq(sessions.token, rawToken))
        .limit(1)

      if (!session || !session.isActive) {
        const failed = Err(
          ErrorFactory.unauthorized('Sessão inválida ou revogada', 'expired_token', 'AuthMiddleware')
        )
        return {
          auth: failed,
          user: failed,
        }
      }

      // Confirmar que o user existe e não foi soft-deleted
      const [user] = await db
        .select({ id: users.id, roles: users.roles })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        const failed = Err(
          ErrorFactory.unauthorized('Utilizador não encontrado', 'missing_token', 'AuthMiddleware')
        )
        return {
          auth: failed,
          user: failed,
        }
      }

      const success = Ok({
        userId: user.id,
        roles:  user.roles ?? ['buyer'],
      })

      return {
        auth: success,
        user: success,
      }
    })

    .onBeforeHandle({ as: 'local' }, ({ auth, set }) => {
      if (!auth.success) {
        set.status = auth.error.statusCode
        return auth.error
      }
      return
    })

// ─────────────────────────────────────────────
// Optional — para rotas públicas que beneficiam
// de saber quem está autenticado mas não exigem
// ─────────────────────────────────────────────

export const optionalAuthMiddleware = () =>
  new Elysia({ name: 'optional-auth' })
    .derive({ as: 'global' }, async ({ cookie }): Promise<{ userId: string | null }> => {
      const rawToken = cookie['auth_token']?.value
      if (!rawToken || typeof rawToken !== 'string') return { userId: null }

      const payload = verifyToken(rawToken)
      if (!payload || payload.type !== 'user') return { userId: null }

      return { userId: payload.userId }
    })
