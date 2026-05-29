import { Elysia, t } from 'elysia'
import { db } from '@/db'
import { createWorkspaceRepository } from '../../persistence/workspace.repository'
import { createWorkspaceMemberRepository } from '../../persistence/workspace-member.repository'
import { createWorkspaceMemberService } from '../../../application/services/workspace-member.service'

import { authMiddleware, getAuth  } from '@/middlewares/auth.middleware'
import { rateLimitMiddleware, RateLimitPresets } from '@/middlewares/rate-limit.middleware'
import { validateWithZod } from '@/shared/result/zod-integration'
import { workspaceIdSchema, updateMemberRoleSchema } from '../../../application/dtos/workspace.dto'
import type { Result } from '@/shared/result/types'
import type { AppError } from '@/shared/result/errors'
import type { WorkspaceMemberResponseDTO } from '../../../application/dtos/workspace.dto'
import type { ListResponse } from '@/shared/types/query.types'

const workspaceRepo = createWorkspaceRepository(db)
const memberRepo    = createWorkspaceMemberRepository(db)
const memberSvc     = createWorkspaceMemberService(workspaceRepo, memberRepo)

export const workspaceMemberController = new Elysia({ prefix: '/workspaces' })
  .use(authMiddleware())
  .use(rateLimitMiddleware(RateLimitPresets.API))

  .get('/:id/members',
    async ({ auth, params, query }): Promise<Result<ListResponse<WorkspaceMemberResponseDTO>, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      const v = validateWithZod(workspaceIdSchema, params, 'WorkspaceMemberController')
      if (!v.success) return v
      return memberSvc.listMembers(v.value.id, userId, query)
    },
    {
      params: t.Object({ id: t.String() }),
      query: t.Object({
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
      }),
      detail: { tags: ['workspace-members'], summary: 'Listar membros' },
    }
  )

  .patch('/:id/members/:userId/role',
    async ({ auth, params, body }): Promise<Result<WorkspaceMemberResponseDTO, AppError>> => {
      if (!auth.success) return auth
      const { userId: requesterId } = getAuth(auth)
      const bv = validateWithZod(updateMemberRoleSchema, body, 'WorkspaceMemberController')
      if (!bv.success) return bv
      return memberSvc.updateMemberRole(params.id, params.userId, bv.value, requesterId)
    },
    {
      params: t.Object({ id: t.String(), userId: t.String() }),
      body: t.Object({ role: t.String() }),
      detail: { tags: ['workspace-members'], summary: 'Alterar role (admin)' },
    }
  )

  .delete('/:id/members/:userId',
    async ({ auth, params }): Promise<Result<void, AppError>> => {
      if (!auth.success) return auth
      const { userId: requesterId } = getAuth(auth)
      return memberSvc.removeMember(params.id, params.userId, requesterId)
    },
    {
      params: t.Object({ id: t.String(), userId: t.String() }),
      detail: { tags: ['workspace-members'], summary: 'Remover membro (admin/lead)' },
    }
  )

  .post('/:id/leave',
    async ({ auth, params }): Promise<Result<void, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      return memberSvc.leaveWorkspace(params.id, userId)
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['workspace-members'], summary: 'Sair do workspace' },
    }
  )
