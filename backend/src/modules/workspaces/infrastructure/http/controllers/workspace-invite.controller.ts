import { Elysia, t } from 'elysia'
import { db } from '@/db'
import { createWorkspaceMemberRepository } from '../../persistence/workspace-member.repository'
import { createWorkspaceInviteRepository } from '../../persistence/workspace-invite.repository'
import { createWorkspaceInviteService } from '../../../application/services/workspace-invite.service'
import { createUserRepository } from '@/modules/users/infrastructure/persistence/users.repository'

import { authMiddleware, getAuth } from '@/middlewares/auth.middleware'
import { rateLimitMiddleware, RateLimitPresets } from '@/middlewares/rate-limit.middleware'
import { validateWithZod } from '@/shared/result/zod-integration'
import {
  workspaceIdSchema, inviteMemberSchema,
} from '../../../application/dtos/workspace.dto'
import type { Result } from '@/shared/result/types'
import type { AppError } from '@/shared/result/errors'
import type { InviteResponseDTO, WorkspaceMemberResponseDTO } from '../../../application/dtos/workspace.dto'
import type { ListResponse } from '@/shared/types/query.types'

const memberRepo    = createWorkspaceMemberRepository(db)
const inviteRepo    = createWorkspaceInviteRepository(db)
const userRepo      = createUserRepository(db)
const inviteSvc     = createWorkspaceInviteService(memberRepo, inviteRepo, userRepo)

export const workspaceInviteController = new Elysia({ prefix: '/workspaces' })
  .use(authMiddleware())
  .use(rateLimitMiddleware(RateLimitPresets.API))

  .post('/:id/invites',
    async ({ auth, params, body }): Promise<Result<InviteResponseDTO, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      const pv = validateWithZod(workspaceIdSchema, params, 'WorkspaceInviteController')
      if (!pv.success) return pv
      const bv = validateWithZod(inviteMemberSchema, body, 'WorkspaceInviteController')
      if (!bv.success) return bv
      return inviteSvc.inviteMember(pv.value.id, bv.value, userId)
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({ email: t.String(), role: t.Optional(t.String()) }),
      detail: { tags: ['workspace-invites'], summary: 'Convidar membro (admin/lead)' },
    }
  )

  .get('/:id/invites',
    async ({ auth, params, query }): Promise<Result<ListResponse<InviteResponseDTO>, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      const pv = validateWithZod(workspaceIdSchema, params, 'WorkspaceInviteController')
      if (!pv.success) return pv
      const member = await memberRepo.findMember(pv.value.id, userId)
      if (!member || member.role !== 'admin') {
        return { success: true, value: { data: [], pagination: { currentPage: 1, perPage: 20, totalItems: 0, totalPages: 0 } } }
      }
      const invites = await inviteRepo.listInvites(pv.value.id, query)
      return { success: true, value: invites }
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
      }),
      detail: { tags: ['workspace-invites'], summary: 'Listar invites pendentes (admin)' },
    }
  )

export const inviteAcceptController = new Elysia({ prefix: '/invites' })
  .use(authMiddleware())
  .use(rateLimitMiddleware(RateLimitPresets.API))

  .post('/:token/accept',
    async ({ auth, params }): Promise<Result<WorkspaceMemberResponseDTO, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      return inviteSvc.acceptInvite(params.token, userId)
    },
    {
      params: t.Object({ token: t.String() }),
      detail: { tags: ['workspace-invites'], summary: 'Aceitar convite (token)' },
    }
  )
