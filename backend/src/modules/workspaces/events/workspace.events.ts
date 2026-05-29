import { QueueManager } from '@/shared/queue/queue'
import { logger } from '@/shared/logger/logger'
import type { Job } from 'bullmq'
import { processEventForAudit } from '@/modules/activity/events/audit.listener'

export type WorkspaceCreatedPayload = {
  workspaceId: string; ownerId: string; createdAt: Date
}

export type WorkspaceUpdatedPayload = {
  workspaceId: string; changes: Partial<Record<string, unknown>>; updatedAt: Date
}

export type WorkspaceDeletedPayload = {
  workspaceId: string; ownerId: string; deletedAt: Date
}

export type MemberInvitedPayload = {
  workspaceId: string; email: string; role: string; invitedBy: string; invitedAt: Date
}

export type MemberJoinedPayload = {
  workspaceId: string; userId: string; role: string; joinedAt: Date
}

export type MemberRemovedPayload = {
  workspaceId: string; userId: string; removedBy: string; removedAt: Date
}

export type MemberLeftPayload = {
  workspaceId: string; userId: string; leftAt: Date
}

export type MemberRoleChangedPayload = {
  workspaceId: string; userId: string; oldRole: string; newRole: string; changedBy: string; changedAt: Date
}

export type WorkspaceEventPayload =
  | WorkspaceCreatedPayload
  | WorkspaceUpdatedPayload
  | WorkspaceDeletedPayload
  | MemberInvitedPayload
  | MemberJoinedPayload
  | MemberRemovedPayload
  | MemberLeftPayload
  | MemberRoleChangedPayload

export const WorkspaceEventNames = {
  WORKSPACE_CREATED:       'workspace.created',
  WORKSPACE_UPDATED:       'workspace.updated',
  WORKSPACE_DELETED:       'workspace.deleted',
  MEMBER_INVITED:          'workspace.member_invited',
  MEMBER_JOINED:           'workspace.member_joined',
  MEMBER_REMOVED:          'workspace.member_removed',
  MEMBER_LEFT:             'workspace.member_left',
  MEMBER_ROLE_CHANGED:     'workspace.member_role_changed',
} as const

const processWorkspaceEvent = async (job: Job<WorkspaceEventPayload>): Promise<void> => {
  logger.info({ eventName: job.name, payload: job.data }, 'Workspace event processed')
  await processEventForAudit(job.name, job.data)
}

export const workspaceEventsQueue = new QueueManager<WorkspaceEventPayload>({
  name: 'workspace-events',
  processor: processWorkspaceEvent,
})

export const emitWorkspaceCreated = async (workspaceId: string, ownerId: string) =>
  workspaceEventsQueue.addJob(WorkspaceEventNames.WORKSPACE_CREATED, {
    workspaceId, ownerId, createdAt: new Date(),
  })

export const emitWorkspaceUpdated = async (workspaceId: string, changes: Partial<Record<string, unknown>>) =>
  workspaceEventsQueue.addJob(WorkspaceEventNames.WORKSPACE_UPDATED, {
    workspaceId, changes, updatedAt: new Date(),
  })

export const emitWorkspaceDeleted = async (workspaceId: string, ownerId: string) =>
  workspaceEventsQueue.addJob(WorkspaceEventNames.WORKSPACE_DELETED, {
    workspaceId, ownerId, deletedAt: new Date(),
  })

export const emitMemberInvited = async (workspaceId: string, email: string, role: string, invitedBy: string) =>
  workspaceEventsQueue.addJob(WorkspaceEventNames.MEMBER_INVITED, {
    workspaceId, email, role, invitedBy, invitedAt: new Date(),
  })

export const emitMemberJoined = async (workspaceId: string, userId: string, role: string) =>
  workspaceEventsQueue.addJob(WorkspaceEventNames.MEMBER_JOINED, {
    workspaceId, userId, role, joinedAt: new Date(),
  })

export const emitMemberRemoved = async (workspaceId: string, userId: string, removedBy: string) =>
  workspaceEventsQueue.addJob(WorkspaceEventNames.MEMBER_REMOVED, {
    workspaceId, userId, removedBy, removedAt: new Date(),
  })

export const emitMemberLeft = async (workspaceId: string, userId: string) =>
  workspaceEventsQueue.addJob(WorkspaceEventNames.MEMBER_LEFT, {
    workspaceId, userId, leftAt: new Date(),
  })

export const emitMemberRoleChanged = async (
  workspaceId: string, userId: string, oldRole: string, newRole: string, changedBy: string,
) =>
  workspaceEventsQueue.addJob(WorkspaceEventNames.MEMBER_ROLE_CHANGED, {
    workspaceId, userId, oldRole, newRole, changedBy, changedAt: new Date(),
  })
