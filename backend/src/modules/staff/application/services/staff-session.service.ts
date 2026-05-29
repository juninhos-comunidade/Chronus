import type { Result } from '@/shared/result/types'
import type { AppError } from '@/shared/result/errors'
import type { IStaffSessionRepository } from '../ports/staff-session.port'
import { Ok, Err } from '@/shared/result/types'
import { ErrorFactory } from '@/shared/result/factory'
import { signToken, verifyToken } from '@/shared/auth/auth'

const COMPONENT    = 'StaffSessionService'
const ACCESS_TTL   = 15 * 60        // 15 min em segundos
const REFRESH_TTL  = 7 * 24 * 3600  // 7 dias em segundos

export interface IStaffSessionService {
  createSession(
    staffId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Result<{ accessToken: string; refreshToken: string }, AppError>>

  refreshSession(
    refreshToken: string
  ): Promise<Result<{ accessToken: string; refreshToken: string }, AppError>>

  revokeSession(token: string): Promise<Result<void, AppError>>

  revokeAllSessions(staffId: string): Promise<void>
}

export const createStaffSessionService = (
  repository: IStaffSessionRepository,
): IStaffSessionService => {
  return {
    async createSession(staffId, userAgent, ipAddress) {
      const accessToken  = signToken({ staffId, type: 'staff' },         ACCESS_TTL)
      const refreshToken = signToken({ staffId, type: 'staff_refresh' }, REFRESH_TTL)

      await repository.create({
        staffId,
        token:        accessToken,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + ACCESS_TTL * 1000),
      })

      return Ok({ accessToken, refreshToken })
    },

    async refreshSession(refreshToken) {
      // 1. Verificar JWT e garantir que é um refresh token de staff
      const payload = verifyToken(refreshToken)
      if (!payload || payload.type !== 'staff_refresh') {
        return Err(
          ErrorFactory.unauthorized(
            'Refresh token inválido ou expirado',
            'invalid_token',
            COMPONENT
          )
        )
      }

      // 2. Confirmar que a sessão existe e está activa na DB
      const session = await repository.findByRefreshToken(refreshToken)
      if (!session || !session.isActive) {
        return Err(
          ErrorFactory.unauthorized(
            'Sessão inválida ou revogada',
            'expired_token',
            COMPONENT
          )
        )
      }

      // 3. Revogar sessão anterior (rotation — refresh token de uso único)
      await repository.revoke(session.id)

      // 4. Criar nova sessão com novos tokens
      const { staffId } = payload
      const newAccess  = signToken({ staffId, type: 'staff' },         ACCESS_TTL)
      const newRefresh = signToken({ staffId, type: 'staff_refresh' }, REFRESH_TTL)

      await repository.create({
        staffId,
        token:        newAccess,
        refreshToken: newRefresh,
        expiresAt:    new Date(Date.now() + ACCESS_TTL * 1000),
      })

      return Ok({ accessToken: newAccess, refreshToken: newRefresh })
    },

    async revokeSession(token) {
      const session = await repository.findByToken(token)
      if (!session) {
        // Sessão não encontrada — tratar como já revogada, não como erro
        return Ok(undefined)
      }
      await repository.revoke(session.id)
      return Ok(undefined)
    },

    async revokeAllSessions(staffId) {
      await repository.revokeAllByStaff(staffId)
    },
  }
}