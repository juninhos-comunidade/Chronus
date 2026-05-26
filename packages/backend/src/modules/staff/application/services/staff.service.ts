import type {
  IStaffRepository,
  IStaffService,
  IStaffActivityLogRepository,
} from '../ports/staff.port'
import type { IStaffSessionService } from './staff-session.service'
import { Ok, Err } from '@/shared/result/types'
import { ErrorFactory } from '@/shared/result/factory'
import { hashPassword, comparePassword } from '@/shared/auth/auth'
import { getEncryption } from '@/shared/crypto/encryption.service'
import { auditHelpers } from '@/modules/activity/events/audit.listener'
import { logger } from '@/shared/logger/logger'
import {
  emitStaffCreated,
  emitStaffLogin,
  emitStaffDeactivated,
} from '../../events/staff.events'
import 'dotenv/config'

const COMPONENT = 'StaffService'

export const createStaffService = (
  repository: IStaffRepository,
  sessionService: IStaffSessionService,
  activityLogRepo: IStaffActivityLogRepository,
): IStaffService => {
  const encryption = getEncryption()

  return {
    // ── Auth ────────────────────────────────────────────────────────────────
    async login(data, userAgent, ipAddress) {
      const emailHash = encryption.hash(data.email)
      const staff = await repository.findByEmailHash(emailHash)
      if (!staff) {
        return Err(ErrorFactory.unauthorized('Credenciais inválidas', 'invalid_credentials', COMPONENT))
      }

      const valid = await comparePassword(data.password, staff.passwordHash)
      if (!valid) {
        return Err(ErrorFactory.unauthorized('Credenciais inválidas', 'invalid_credentials', COMPONENT))
      }

      if (!staff.isActive) {
        return Err(ErrorFactory.forbidden('Conta desactivada', 'account_inactive', COMPONENT))
      }

      const sessionResult = await sessionService.createSession(staff.id, userAgent, ipAddress)
      if (!sessionResult.success) return sessionResult

      Promise.allSettled([
        repository.updateLastLogin(staff.id),
        emitStaffLogin(staff.id, ipAddress, userAgent),
        auditHelpers.staffAction(staff.id, 'StaffUser', staff.id, 'STAFF_LOGIN', {
          ipAddress,
          userAgent,
          loggedInAt: new Date().toISOString(),
        }),
      ]).catch(err => logger.error(err, 'Background tasks failed on staff login'))

      return Ok({
        staff: {
          id:          staff.id,
          email:       staff.email,
          name:        staff.name,
          isActive:    staff.isActive,
          lastLoginAt: staff.lastLoginAt,
          createdAt:   staff.createdAt,
        },
        accessToken:  sessionResult.value.accessToken,
        refreshToken: sessionResult.value.refreshToken,
      })
    },

    // ── Members ─────────────────────────────────────────────────────────────
    async create(data, requestingStaffId) {
      const emailHash = encryption.hash(data.email)
      const existing = await repository.findByEmailHash(emailHash)
      if (existing) {
        return Err(ErrorFactory.conflict('Email já registado', 'email', data.email, COMPONENT))
      }

      const passwordHash = await hashPassword(data.password)
      const staff = await repository.create({ ...data, emailHash, passwordHash })

      Promise.allSettled([
        emitStaffCreated(staff.id, requestingStaffId, data.email),
        auditHelpers.staffCreate(requestingStaffId, 'StaffUser', staff.id, {
          action: 'STAFF_CREATED',
          email: data.email,
          createdBy: requestingStaffId,
        }),
      ]).catch(err => logger.error(err, 'Background tasks failed on staff create'))

      return Ok(staff)
    },

    async list(page, perPage, filters) {
      const result = await repository.list(page, perPage, filters)
      return Ok(result)
    },

    async deactivate(staffId, requestingStaffId) {
      if (staffId === requestingStaffId) {
        return Err(ErrorFactory.business('Não podes desactivar-te a ti próprio', 'self_deactivate', COMPONENT))
      }

      const staff = await repository.findById(staffId)
      if (!staff) {
        return Err(ErrorFactory.notFound('Staff não encontrado', 'StaffUser', staffId, COMPONENT))
      }
      if (!staff.isActive) {
        return Err(ErrorFactory.business('Staff já está desactivado', 'already_inactive', COMPONENT))
      }

      await repository.update(staffId, { isActive: false })

      Promise.allSettled([
        emitStaffDeactivated(staffId, requestingStaffId),
        auditHelpers.staffUpdate(requestingStaffId, 'StaffUser', staffId, {
          action: 'STAFF_DEACTIVATED',
          deactivatedBy: requestingStaffId,
          deactivatedAt: new Date().toISOString(),
        }),
      ]).catch(err => logger.error(err, 'Background tasks failed on staff deactivate'))

      return Ok(undefined)
    },

    async getById(staffId: string) {
      const staff = await repository.findById(staffId)
      if (!staff) {
        return Err(ErrorFactory.notFound('Staff não encontrado', 'StaffUser', staffId, COMPONENT))
      }
      return Ok({
        id:          staff.id,
        email:       staff.email,
        name:        staff.name,
        isActive:    staff.isActive,
        lastLoginAt: staff.lastLoginAt,
        createdAt:   staff.createdAt,
      })
    },

   

    // ── Activity Log ─────────────────────────────────────────────────────────
    async listActivityLog(page, perPage, filters) {
      const result = await activityLogRepo.list(page, perPage, filters)
      return Ok(result)
    },

    // ── Seed ─────────────────────────────────────────────────────────────────
    async seed() {
      const total = await repository.count()
      if (total > 0) return

      const email    = process.env.STAFF_SEED_EMAIL
      const name     = process.env.STAFF_SEED_NAME
      const password = process.env.STAFF_SEED_PASSWORD

      if (!email || !name || !password) {
        logger.warn('Seed staff ignorado — env vars STAFF_SEED_* não definidas')
        return
      }

      const emailHash    = encryption.hash(email)
      const passwordHash = await hashPassword(password)
      const staff = await repository.create({ email, name, password, emailHash, passwordHash })
      console.log(staff)
      await auditHelpers.staffCreate(staff.id, 'StaffUser', staff.id, {
        action: 'STAFF_SEEDED',
        email,
      })

      logger.info({ email }, 'Staff seed criado com sucesso')
    },
  }
}