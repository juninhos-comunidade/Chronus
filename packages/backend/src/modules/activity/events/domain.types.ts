import type {
  StaffActionPayload,
  StaffCreatedPayload,
  StaffDeactivatedPayload,
  StaffLoginPayload,
} from '@/modules/staff/events/staff.events'
import type {
  WorkspaceCreatedPayload,
  WorkspaceUpdatedPayload,
  WorkspaceDeletedPayload,
  MemberInvitedPayload,
  MemberJoinedPayload,
  MemberRemovedPayload,
  MemberLeftPayload,
  MemberRoleChangedPayload,
} from '@/modules/workspaces/events/workspace.events'

export type DomainEventPayload =
  | StaffCreatedPayload
  | StaffLoginPayload
  | StaffActionPayload
  | StaffDeactivatedPayload
  | WorkspaceCreatedPayload
  | WorkspaceUpdatedPayload
  | WorkspaceDeletedPayload
  | MemberInvitedPayload
  | MemberJoinedPayload
  | MemberRemovedPayload
  | MemberLeftPayload
  | MemberRoleChangedPayload

export type EventMeta = {
  entityType: string
  entityIdField: string
  actorIdField?: string
  actorStaffIdField?: string
}

export const EVENT_META: Record<string, EventMeta> = {
  'staff.created': { entityType: 'StaffUser', entityIdField: 'staffId', actorStaffIdField: 'createdBy' },
  'staff.login': { entityType: 'StaffUser', entityIdField: 'staffId', actorStaffIdField: 'staffId' },
  'staff.action': { entityType: 'StaffUser', entityIdField: 'entityId', actorStaffIdField: 'staffId' },
  'staff.deactivated': { entityType: 'StaffUser', entityIdField: 'staffId', actorStaffIdField: 'deactivatedBy' },

  'workspace.created': { entityType: 'Workspace', entityIdField: 'workspaceId', actorIdField: 'ownerId' },
  'workspace.updated': { entityType: 'Workspace', entityIdField: 'workspaceId' },
  'workspace.deleted': { entityType: 'Workspace', entityIdField: 'workspaceId', actorIdField: 'ownerId' },
  'workspace.member_invited': { entityType: 'WorkspaceMember', entityIdField: 'workspaceId', actorIdField: 'invitedBy' },
  'workspace.member_joined': { entityType: 'WorkspaceMember', entityIdField: 'workspaceId', actorIdField: 'userId' },
  'workspace.member_removed': { entityType: 'WorkspaceMember', entityIdField: 'workspaceId', actorIdField: 'removedBy' },
  'workspace.member_left': { entityType: 'WorkspaceMember', entityIdField: 'workspaceId', actorIdField: 'userId' },
  'workspace.member_role_changed': { entityType: 'WorkspaceMember', entityIdField: 'workspaceId', actorIdField: 'changedBy' },
}
