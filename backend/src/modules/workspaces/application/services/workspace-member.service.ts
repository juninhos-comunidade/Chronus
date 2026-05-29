import { Ok, Err } from '@/shared/result/types'
import { ErrorFactory } from '@/shared/result/factory'
import { logger } from '@/shared/logger/logger'
import type {
  IWorkspaceMemberService, IWorkspaceRepository, IWorkspaceMemberRepository,
} from '../ports/workspace.port'
import type { PaginationParams } from '@/shared/types/query.types'
import {
  emitMemberRoleChanged,
  emitMemberRemoved,
  emitMemberLeft,
} from '../../events/workspace.events'

export const createWorkspaceMemberService = (
  workspaceRepo: IWorkspaceRepository,
  memberRepo: IWorkspaceMemberRepository,
): IWorkspaceMemberService => {
  function isAdmin(role: string): boolean {
    return role === 'admin'
  }

  return {
    async listMembers(workspaceId, userId, pagination?: PaginationParams) {
      const workspace = await workspaceRepo.findById(workspaceId)
      if (!workspace) {
        return Err(ErrorFactory.notFound('Workspace não encontrado', 'Workspace', workspaceId))
      }

      const member = await memberRepo.findMember(workspaceId, userId)
      if (!member || member.status !== 'active') {
        return Err(ErrorFactory.forbidden('Não és membro deste workspace', 'member'))
      }

      const members = await memberRepo.listMembers(workspaceId, { pagination })
      return Ok(members)
    },

    async updateMemberRole(workspaceId, targetUserId, data, requestingUserId) {
      const workspace = await workspaceRepo.findById(workspaceId)
      if (!workspace) {
        return Err(ErrorFactory.notFound('Workspace não encontrado', 'Workspace', workspaceId))
      }

      const requester = await memberRepo.findMember(workspaceId, requestingUserId)
      if (!requester || !isAdmin(requester.role)) {
        return Err(ErrorFactory.forbidden('Apenas admins podem alterar roles', 'admin'))
      }

      if (targetUserId === workspace.ownerId) {
        return Err(ErrorFactory.forbidden('O owner não pode ter o seu role alterado', 'owner'))
      }

      if (targetUserId === requestingUserId && data.role !== 'admin') {
        const adminList = await memberRepo.listMembers(workspaceId, { role: 'admin' })
        if (adminList.data.length <= 1) {
          return Err(ErrorFactory.business('Não podes rebaixar-te a ti próprio — és o único admin', 'last_admin'))
        }
      }

      const targetMember = await memberRepo.findMember(workspaceId, targetUserId)
      if (!targetMember) {
        return Err(ErrorFactory.notFound('Membro não encontrado no workspace', 'WorkspaceMember', targetUserId))
      }

      const oldRole = targetMember.role
      const result = await memberRepo.updateMemberRole(workspaceId, targetUserId, data.role)

      Promise.allSettled([
        emitMemberRoleChanged(workspaceId, targetUserId, oldRole, data.role, requestingUserId),
      ]).catch(err => logger.error(err, 'Background tasks failed on update member role'))

      return Ok(result)
    },

    async removeMember(workspaceId, targetUserId, requestingUserId) {
      const workspace = await workspaceRepo.findById(workspaceId)
      if (!workspace) {
        return Err(ErrorFactory.notFound('Workspace não encontrado', 'Workspace', workspaceId))
      }

      if (targetUserId === workspace.ownerId) {
        return Err(ErrorFactory.forbidden('O owner não pode ser removido', 'owner'))
      }

      const requester = await memberRepo.findMember(workspaceId, requestingUserId)
      if (!requester) {
        return Err(ErrorFactory.forbidden('Não és membro deste workspace', 'member'))
      }

      const targetMember = await memberRepo.findMember(workspaceId, targetUserId)
      if (!targetMember) {
        return Err(ErrorFactory.notFound('Membro não encontrado no workspace', 'WorkspaceMember', targetUserId))
      }

      if (isAdmin(requester.role)) {
        // admin can remove anyone except owner (already checked)
      } else if (requester.role === 'lead' && targetMember.role === 'member') {
        // lead can remove member
      } else {
        return Err(ErrorFactory.forbidden('Não tens permissão para remover este membro', 'remove_member'))
      }

      await memberRepo.removeMember(workspaceId, targetUserId)

      Promise.allSettled([
        emitMemberRemoved(workspaceId, targetUserId, requestingUserId),
      ]).catch(err => logger.error(err, 'Background tasks failed on remove member'))

      return Ok(undefined)
    },

    async leaveWorkspace(workspaceId, userId) {
      const workspace = await workspaceRepo.findById(workspaceId)
      if (!workspace) {
        return Err(ErrorFactory.notFound('Workspace não encontrado', 'Workspace', workspaceId))
      }

      if (userId === workspace.ownerId) {
        return Err(ErrorFactory.business(
          'O owner não pode sair do workspace — transfere a ownership ou apaga o workspace',
          'owner_cannot_leave'
        ))
      }

      const member = await memberRepo.findMember(workspaceId, userId)
      if (!member) {
        return Err(ErrorFactory.notFound('Não és membro deste workspace', 'WorkspaceMember', userId))
      }

      await memberRepo.removeMember(workspaceId, userId)

      Promise.allSettled([
        emitMemberLeft(workspaceId, userId),
      ]).catch(err => logger.error(err, 'Background tasks failed on leave workspace'))

      return Ok(undefined)
    },
  }
}
