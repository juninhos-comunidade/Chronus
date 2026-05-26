import type {
  StaffActionPayload,
  StaffCreatedPayload,
  StaffDeactivatedPayload,
  StaffLoginPayload,
} from '@/modules/staff/events/staff.events'
import type {
  UserDeletedPayload,
  UserLoginPayload,
  UserProfileUpdatedPayload,
  UserRegisteredPayload,
} from '@/modules/users/events/user.events'
import type {
  SessionCreatedPayload,
  SessionRefreshedPayload,
  SessionRevokedPayload,
} from '@/modules/auth/events/auth.events'

export type DomainEventPayload =
  | StaffCreatedPayload
  | StaffLoginPayload
  | StaffActionPayload
  | StaffDeactivatedPayload
  | UserRegisteredPayload
  | UserLoginPayload
  | UserProfileUpdatedPayload
  | UserDeletedPayload
  | SessionCreatedPayload
  | SessionRevokedPayload
  | SessionRefreshedPayload

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
  'user.registered': { entityType: 'User', entityIdField: 'userId', actorIdField: 'userId' },
  'user.login': { entityType: 'User', entityIdField: 'userId', actorIdField: 'userId' },
  'user.profile_updated': { entityType: 'User', entityIdField: 'userId', actorIdField: 'userId' },
  'user.deleted': { entityType: 'User', entityIdField: 'userId', actorIdField: 'userId' },
  'auth.session_created': { entityType: 'Session', entityIdField: 'sessionId', actorIdField: 'userId' },
  'auth.session_revoked': { entityType: 'Session', entityIdField: 'sessionId', actorIdField: 'userId' },
  'auth.session_refreshed': { entityType: 'Session', entityIdField: 'userId', actorIdField: 'userId' },
}
