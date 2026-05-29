import { Elysia, t } from 'elysia'
import { db } from '@/db'
import { createWorkspaceRepository } from '../../persistence/workspace.repository'
import { createWorkspaceMemberRepository } from '../../persistence/workspace-member.repository'
import { createWorkspaceService } from '../../../application/services/workspace.service'

import { authMiddleware, getAuth } from '@/middlewares/auth.middleware'
import { rateLimitMiddleware, RateLimitPresets } from '@/middlewares/rate-limit.middleware'
import { validateWithZod } from '@/shared/result/zod-integration'
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
} from '../../../application/dtos/workspace.dto'
import type { Result } from '@/shared/result/types'
import type { AppError } from '@/shared/result/errors'
import type { WorkspaceResponseDTO } from '../../../application/dtos/workspace.dto'
import type { ListResponse } from '@/shared/types/query.types'

const workspaceRepo  = createWorkspaceRepository(db)
const memberRepo     = createWorkspaceMemberRepository(db)
const workspaceSvc   = createWorkspaceService(workspaceRepo, memberRepo)

export const workspaceController = new Elysia({ prefix: '/workspaces' })
  .use(authMiddleware())
  .use(rateLimitMiddleware(RateLimitPresets.API))

  .get('/',
    async ({ auth, query }): Promise<Result<ListResponse<WorkspaceResponseDTO>, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      return workspaceSvc.listMyWorkspaces(userId, query)
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        pageSize: t.Optional(t.Numeric()),
      }),
      detail: { tags: ['workspaces'], summary: 'Listar os meus workspaces' },
    }
  )

  .post('/',
    async ({ auth, body }): Promise<Result<WorkspaceResponseDTO, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      const v = validateWithZod(createWorkspaceSchema, body, 'WorkspaceController')
      if (!v.success) return v
      return workspaceSvc.create(v.value, userId)
    },
    {
      body: t.Object({
        name: t.String(), slug: t.String(),
        sprintDurationDays: t.Optional(t.Number()),
        timezone: t.Optional(t.String()),
      }),
      detail: { tags: ['workspaces'], summary: 'Criar workspace' },
    }
  )

  .get('/:id',
    async ({ auth, params }): Promise<Result<WorkspaceResponseDTO, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      const v = validateWithZod(workspaceIdSchema, params, 'WorkspaceController')
      if (!v.success) return v
      return workspaceSvc.getById(v.value.id, userId)
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['workspaces'], summary: 'Detalhe do workspace' },
    }
  )

  .patch('/:id',
    async ({ auth, params, body }): Promise<Result<WorkspaceResponseDTO, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      const pv = validateWithZod(workspaceIdSchema, params, 'WorkspaceController')
      if (!pv.success) return pv
      const bv = validateWithZod(updateWorkspaceSchema, body, 'WorkspaceController')
      if (!bv.success) return bv
      return workspaceSvc.update(pv.value.id, bv.value, userId)
    },
    {
      params: t.Object({ id: t.String() }),
      body: t.Object({
        name: t.Optional(t.String()),
        sprintDurationDays: t.Optional(t.Number()),
        timezone: t.Optional(t.String()),
        kanbanConfig: t.Optional(t.Any()),
      }),
      detail: { tags: ['workspaces'], summary: 'Editar workspace (admin)' },
    }
  )

  .delete('/:id',
    async ({ auth, params }): Promise<Result<void, AppError>> => {
      if (!auth.success) return auth
      const { userId } = getAuth(auth)
      const v = validateWithZod(workspaceIdSchema, params, 'WorkspaceController')
      if (!v.success) return v
      return workspaceSvc.delete(v.value.id, userId)
    },
    {
      params: t.Object({ id: t.String() }),
      detail: { tags: ['workspaces'], summary: 'Apagar workspace (owner)' },
    }
  )
