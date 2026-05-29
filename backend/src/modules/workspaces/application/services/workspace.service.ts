import { Ok, Err } from '@/shared/result/types'
import { ErrorFactory } from '@/shared/result/factory'
import { withTransaction } from '@/db/transaction'
import { logger } from '@/shared/logger/logger'
import type {
  IWorkspaceService, IWorkspaceRepository, IWorkspaceMemberRepository,
} from '../ports/workspace.port'
import type { PaginationParams } from '@/shared/types/query.types'
import {
  emitWorkspaceCreated,
  emitWorkspaceUpdated,
  emitWorkspaceDeleted,
} from '../../events/workspace.events'

export const createWorkspaceService = (
  workspaceRepo: IWorkspaceRepository,
  memberRepo: IWorkspaceMemberRepository,
): IWorkspaceService => {
  function isAdmin(role: string): boolean {
    return role === 'admin'
  }

  return {
    async create(data, userId) {
      const existing = await workspaceRepo.findBySlug(data.slug)
      if (existing) {
        return Err(ErrorFactory.conflict('Slug já está em uso', 'slug', data.slug))
      }

      const result = await withTransaction(async tx => {
        const workspace = await workspaceRepo.create(
          { ...data, ownerId: userId, sprintDurationDays: data.sprintDurationDays ?? 14 },
          tx,
        )
        await memberRepo.addMember(
          { workspaceId: workspace.id, userId, role: 'admin' },
          tx,
        )
        return workspace
      })

      Promise.allSettled([
        emitWorkspaceCreated(result.id, userId),
      ]).catch(err => logger.error(err, 'Background tasks failed on workspace create'))

      return Ok(result)
    },

    async update(workspaceId, data, userId) {
      const workspace = await workspaceRepo.findById(workspaceId)
      if (!workspace) {
        return Err(ErrorFactory.notFound('Workspace não encontrado', 'Workspace', workspaceId))
      }

      const member = await memberRepo.findMember(workspaceId, userId)
      if (!member || !isAdmin(member.role)) {
        return Err(ErrorFactory.forbidden('Apenas admins podem editar o workspace', 'admin'))
      }

      const result = await workspaceRepo.update(workspaceId, data)

      const changes: Record<string, unknown> = {}
      if (data.name) changes.name = data.name
      if (data.sprintDurationDays) changes.sprintDurationDays = data.sprintDurationDays
      if (data.timezone) changes.timezone = data.timezone
      if (data.kanbanConfig) changes.kanbanConfig = data.kanbanConfig

      Promise.allSettled([
        emitWorkspaceUpdated(workspaceId, changes),
      ]).catch(err => logger.error(err, 'Background tasks failed on workspace update'))

      return Ok(result)
    },

    async delete(workspaceId, userId) {
      const workspace = await workspaceRepo.findById(workspaceId)
      if (!workspace) {
        return Err(ErrorFactory.notFound('Workspace não encontrado', 'Workspace', workspaceId))
      }

      if (workspace.ownerId !== userId) {
        return Err(ErrorFactory.forbidden('Apenas o owner pode apagar o workspace', 'owner'))
      }

      await workspaceRepo.update(workspaceId, { deletedAt: new Date() })

      Promise.allSettled([
        emitWorkspaceDeleted(workspaceId, userId),
      ]).catch(err => logger.error(err, 'Background tasks failed on workspace delete'))

      return Ok(undefined)
    },

    async getById(workspaceId, userId) {
      const workspace = await workspaceRepo.findById(workspaceId)
      if (!workspace) {
        return Err(ErrorFactory.notFound('Workspace não encontrado', 'Workspace', workspaceId))
      }

      const member = await memberRepo.findMember(workspaceId, userId)
      if (!member || member.status !== 'active') {
        return Err(ErrorFactory.forbidden('Não és membro deste workspace', 'member'))
      }

      return Ok(workspace)
    },

    async listMyWorkspaces(userId, pagination?: PaginationParams) {
      const result = await workspaceRepo.findByUser(userId, pagination)
      return Ok(result)
    },
  }
}
