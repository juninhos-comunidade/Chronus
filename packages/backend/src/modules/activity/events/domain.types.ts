import type {
  StaffActionPayload,
  StaffCreatedPayload,
  StaffDeactivatedPayload,
  StaffLoginPayload,
} from '@/modules/staff/events/staff.events'

export type DomainEventPayload =
  | StaffCreatedPayload
  | StaffLoginPayload
  | StaffActionPayload
  | StaffDeactivatedPayload

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
}
