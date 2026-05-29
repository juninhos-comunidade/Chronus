import { randomBytes } from 'node:crypto'
import { Ok, Err } from '@/shared/result/types'
import { ErrorFactory } from '@/shared/result/factory'
import { getEncryption } from '@/shared/crypto/encryption.service'
import { withTransaction } from '@/db/transaction'
import { logger } from '@/shared/logger/logger'
import type {
  IWorkspaceInviteService,
  IWorkspaceMemberRepository, IWorkspaceInviteRepository,
} from '../ports/workspace.port'

import type { IUserRepository } from '@/modules/users/application/ports/users.port'
import {
  emitMemberInvited,
  emitMemberJoined,
} from '../../events/workspace.events'

export const createWorkspaceInviteService = (
  memberRepo: IWorkspaceMemberRepository,
  inviteRepo: IWorkspaceInviteRepository,
  userRepo: IUserRepository,
): IWorkspaceInviteService => {
  const encryption = getEncryption()

  function isLeadOrAdmin(role: string): boolean {
    return role === 'admin' || role === 'lead'
  }

  return {
    async inviteMember(workspaceId, data, invitedBy) {
      const member = await memberRepo.findMember(workspaceId, invitedBy)
      if (!member || !isLeadOrAdmin(member.role)) {
        return Err(ErrorFactory.forbidden('Apenas admins e leads podem convidar membros', 'admin_or_lead'))
      }

      const emailHash = encryption.hash(data.email)
      const existingUser = await userRepo.findByEmailHash(emailHash)
      if (!existingUser) {
        return Err(ErrorFactory.notFound('Utilizador com este email não encontrado no sistema', 'User', data.email))
      }

      const pending = await inviteRepo.findPendingInvite(workspaceId, data.email)
      if (pending) {
        return Err(ErrorFactory.conflict('Já existe um convite pendente para este email', 'email', data.email))
      }

      const memberList = await memberRepo.listMembers(workspaceId)
      const alreadyMember = memberList.data.find(m => m.email === data.email && m.status === 'active')
      if (alreadyMember) {
        return Err(ErrorFactory.conflict('Este email já é membro ativo do workspace', 'email', data.email))
      }

      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

      const invite = await inviteRepo.createInvite({
        workspaceId, email: data.email, role: data.role ?? 'member',
        invitedBy, token, expiresAt,
      })

      Promise.allSettled([
        emitMemberInvited(workspaceId, data.email, data.role ?? 'member', invitedBy),
      ]).catch(err => logger.error(err, 'Background tasks failed on invite member'))

      return Ok(invite)
    },

    async acceptInvite(token, userId) {
      const invite = await inviteRepo.findInviteByToken(token)
      if (!invite) {
        return Err(ErrorFactory.notFound('Convite não encontrado', 'Invite', token))
      }

      if (invite.expiresAt < new Date()) {
        return Err(ErrorFactory.validation('Convite expirado', [{ field: 'token', message: 'Convite expirado' }]))
      }

      if (invite.acceptedAt !== null) {
        return Err(ErrorFactory.conflict('Convite já foi usado', 'token', token))
      }

      const result = await withTransaction(async tx => {
        await inviteRepo.acceptInvite(token, tx)
        const member = await memberRepo.addMember(
          { workspaceId: invite.workspaceId, userId, role: invite.role },
          tx,
        )
        return member
      })

      Promise.allSettled([
        emitMemberJoined(invite.workspaceId, userId, invite.role),
      ]).catch(err => logger.error(err, 'Background tasks failed on accept invite'))

      return Ok(result)
    },
  }
}
