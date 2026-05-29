import { QueueManager } from '@/shared/queue/queue'
import { logger } from '@/shared/logger/logger'
import type { Job } from 'bullmq'
import { processEventForAudit } from '@/modules/activity/events/audit.listener'

export type StaffCreatedPayload = {
  staffId: string
  createdBy: string
  email: string
  createdAt: Date
}

export type StaffLoginPayload = {
  staffId: string
  ipAddress?: string
  userAgent?: string
  loggedInAt: Date
}

export type StaffActionPayload = {
  staffId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}

export type StaffDeactivatedPayload = {
  staffId: string
  deactivatedBy: string
  deactivatedAt: Date
}

export type StaffEventPayload =
  | StaffCreatedPayload
  | StaffLoginPayload
  | StaffActionPayload
  | StaffDeactivatedPayload

export const StaffEventNames = {
  STAFF_CREATED:     'staff.created',
  STAFF_LOGIN:       'staff.login',
  STAFF_ACTION:      'staff.action',
  STAFF_DEACTIVATED: 'staff.deactivated',
} as const

const processStaffEvent = async (job: Job<StaffEventPayload>): Promise<void> => {
  logger.info({ eventName: job.name, payload: job.data }, 'Staff event processed')
  await processEventForAudit(job.name, job.data)
}

export const staffEventsQueue = new QueueManager<StaffEventPayload>({
  name: 'staff-events',
  processor: processStaffEvent,
})

export const emitStaffCreated = async (staffId: string, createdBy: string, email: string) =>
  staffEventsQueue.addJob(StaffEventNames.STAFF_CREATED, {
    staffId, createdBy, email, createdAt: new Date(),
  })

export const emitStaffLogin = async (staffId: string, ipAddress?: string, userAgent?: string) =>
  staffEventsQueue.addJob(StaffEventNames.STAFF_LOGIN, {
    staffId, ipAddress, userAgent, loggedInAt: new Date(),
  })

export const emitStaffAction = async (
  staffId: string, action: string, entityType: string, entityId: string,
  metadata?: Record<string, unknown>
) =>
  staffEventsQueue.addJob(StaffEventNames.STAFF_ACTION, {
    staffId, action, entityType, entityId, metadata,
  })

export const emitStaffDeactivated = async (staffId: string, deactivatedBy: string) =>
  staffEventsQueue.addJob(StaffEventNames.STAFF_DEACTIVATED, {
    staffId, deactivatedBy, deactivatedAt: new Date(),
  })
