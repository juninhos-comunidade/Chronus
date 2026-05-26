import { Elysia, t, type Context } from 'elysia'
import { db } from '@/db'
import { createStaffRepository }            from '../../persistence/staff.repository'
import { createStaffSessionRepository }     from '../../persistence/staff-session.repository'
import { createStaffActivityLogRepository } from '../../persistence/staff-activity-log.repository'

import {
  staffAuthMiddleware,
  getStaffAuth,
} from '@/middlewares/staff-auth.middleware'
import { rateLimitMiddleware, RateLimitPresets } from '@/middlewares/rate-limit.middleware'
import { validateWithZod } from '@/shared/result/zod-integration'
import {
  createStaffSchema,
  staffLoginSchema,
  listStaffQuerySchema,
  staffIdSchema,
  listActivityLogQuerySchema,
} from '../../../application/dtos/staff.dto'
import type { Result } from '@/shared/result/types'
import type { AppError } from '@/shared/result/errors'
import type {
  StaffResponseDTO,
  ActivityLogResponseDTO
} from '../../../application/dtos/staff.dto'
import type { ListResponse } from '../../../application/ports/staff.port'
import { createStaffSessionService } from '@/modules/staff/application/services/staff-session.service'
import { createStaffService } from '@/modules/staff/application/services/staff.service'

// ── Bootstrap ────────────────────────────────────────────────────────────────
const staffRepo         = createStaffRepository(db)
const staffSessionRepo  = createStaffSessionRepository(db)
const activityLogRepo   = createStaffActivityLogRepository(db)
const staffSessionSvc   = createStaffSessionService(staffSessionRepo)
const staffSvc          = createStaffService(
  staffRepo,
  staffSessionSvc,
  activityLogRepo,
)

staffSvc.seed().catch(err => console.error('Seed failed', err)).then(() => console.log('Seed completed'))

// ── Cookie helpers ────────────────────────────────────────────────────────────
const setStaffCookie = (ctx: Context, token: string) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const host = ctx.request.headers.get('host')
  const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1')
  
  let domain: string | undefined
  if (isProduction && !isLocalhost) {
    domain = host?.includes('.') ? host.substring(host.indexOf('.') + 1) : undefined
  }
  
  ctx.cookie.staff_token.set({
    value:    token,
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'lax',
    maxAge:   15 * 60,
    path:     '/',
    domain,
  })
}

const removeStaffCookie = (ctx: Context) => {
  const isProduction = process.env.NODE_ENV === 'production'
  const host = ctx.request.headers.get('host')
  const isLocalhost = host?.includes('localhost') || host?.includes('127.0.0.1')
  
  let domain: string | undefined
  if (isProduction && !isLocalhost) {
    domain = host?.includes('.') ? host.substring(host.indexOf('.') + 1) : undefined
  }
  
  if (domain || isLocalhost) {
    ctx.cookie.staff_token.set({
      value:    '',
      httpOnly: true,
      secure:   isProduction,
      sameSite: 'lax',
      maxAge:   0,
      path:     '/',
      domain,
    })
  } else {
    ctx.cookie.staff_token.remove()
  }
}

// ── Controller ────────────────────────────────────────────────────────────────
export const staffController = new Elysia({ prefix: '/staff' })

  // ── Auth (público) ──────────────────────────────────────────────────────────
  .group('', app => app
    .use(rateLimitMiddleware(RateLimitPresets.AUTH))

    .post('/login',
      async (ctx): Promise<Result<{ staff: StaffResponseDTO; refreshToken: string }, AppError>> => {
        const v = validateWithZod(staffLoginSchema, ctx.body, 'StaffController')
        if (!v.success) return v

        const userAgent = ctx.request.headers.get('user-agent') ?? undefined
        const ipAddress = ctx.request.headers.get('x-forwarded-for') ?? undefined
        const result    = await staffSvc.login(v.value, userAgent, ipAddress)
        if (!result.success) return result

        setStaffCookie(ctx, result.value.accessToken)
        return { success: true, value: { staff: result.value.staff, refreshToken: result.value.refreshToken } }
      },
      {
        body:   t.Object({ email: t.String(), password: t.String() }),
        detail: { tags: ['staff-auth'], summary: 'Staff login' },
      }
    )

    .post('/refresh',
      async (ctx): Promise<Result<{ refreshToken: string }, AppError>> => {
        const { refreshToken } = ctx.body as { refreshToken: string }
        const result = await staffSessionSvc.refreshSession(refreshToken)
        if (!result.success) return result

        setStaffCookie(ctx, result.value.accessToken)
        return { success: true, value: { refreshToken: result.value.refreshToken } }
      },
      {
        body:   t.Object({ refreshToken: t.String() }),
        detail: { tags: ['staff-auth'], summary: 'Refresh staff token' },
      }
    )

    .post('/logout',
      async (ctx): Promise<Result<{ message: string }, AppError>> => {
        removeStaffCookie(ctx)
        const token = ctx.request.headers.get('authorization')?.replace('Bearer ', '')
        if (token) await staffSessionSvc.revokeSession(token)
        return { success: true, value: { message: 'Sessão terminada' } }
      },
      { detail: { tags: ['staff-auth'], summary: 'Staff logout' } }
    )
  )

  // ── Rotas protegidas ────────────────────────────────────────────────────────
  .group('', app => app
    .use(staffAuthMiddleware())
    .use(rateLimitMiddleware(RateLimitPresets.API))

    .get('/me',
      async ({ staffAuth }): Promise<Result<StaffResponseDTO, AppError>> => {
        if (!staffAuth.success) return staffAuth
        const { staffId } = getStaffAuth({ staffAuth })
        return staffSvc.getById(staffId)
      },
      { detail: { tags: ['staff-auth'], summary: 'Perfil do staff autenticado' } }
    )

    // ── Members ────────────────────────────────────────────────────────────────
    .get('/members',
      async ({ query }): Promise<Result<ListResponse<StaffResponseDTO[]>, AppError>> => {
        const v = validateWithZod(listStaffQuerySchema, query, 'StaffController')
        if (!v.success) return v
        return staffSvc.list(v.value.page, v.value.perPage, { isActive: v.value.isActive })
      },
      {
        query: t.Object({
          page:     t.Optional(t.Number()),
          perPage:  t.Optional(t.Number()),
          isActive: t.Optional(t.Boolean()),
        }),
        detail: { tags: ['staff'], summary: 'Listar membros staff' },
      }
    )

    .post('/members',
      async ({ staffAuth, body }): Promise<Result<StaffResponseDTO, AppError>> => {
        const { staffId } = getStaffAuth({ staffAuth })
        const v = validateWithZod(createStaffSchema, body, 'StaffController')
        if (!v.success) return v
        return staffSvc.create(v.value, staffId)
      },
      {
        body:   t.Object({ email: t.String(), name: t.String(), password: t.String() }),
        detail: { tags: ['staff'], summary: 'Criar membro staff' },
      }
    )

    .patch('/members/:id/deactivate',
      async ({ staffAuth, params }): Promise<Result<void, AppError>> => {
        const { staffId } = getStaffAuth({ staffAuth })
        const v = validateWithZod(staffIdSchema, params, 'StaffController')
        if (!v.success) return v
        return staffSvc.deactivate(v.value.id, staffId)
      },
      {
        params: t.Object({ id: t.String() }),
        detail: { tags: ['staff'], summary: 'Desactivar membro staff' },
      }
    )

    // ── Activity Log ───────────────────────────────────────────────────────────
    .get('/activity-log',
      async ({ query }): Promise<Result<ListResponse<ActivityLogResponseDTO[]>, AppError>> => {
        const v = validateWithZod(listActivityLogQuerySchema, query, 'StaffController')
        if (!v.success) return v
        return staffSvc.listActivityLog(v.value.page, v.value.perPage, {
          actorType:  v.value.actorType,
          action:     v.value.action,
          entityType: v.value.entityType,
          from:       v.value.from ? new Date(v.value.from) : undefined,
          to:         v.value.to   ? new Date(v.value.to)   : undefined,
        })
      },
      {
        query: t.Object({
          page:       t.Optional(t.Number()),
          perPage:    t.Optional(t.Number()),
          actorType:  t.Optional(t.String()),
          action:     t.Optional(t.String()),
          entityType: t.Optional(t.String()),
          from:       t.Optional(t.String()),
          to:         t.Optional(t.String()),
        }),
        detail: { tags: ['staff-activity'], summary: 'Activity log' },
      }
    )
  )
