import { db } from '@/db'
import { createActivityLogRepository } from '../infrastructure/persistence/activity.repository'
import { logger } from '@/shared/logger/logger'
import { EVENT_META } from './domain.types'

export interface TelemetryExporter {
  name:   string
  export: (eventName: string, payload: Record<string, unknown>) => Promise<void>
}

const exporters: TelemetryExporter[] = []

export const registerTelemetryExporter = (exporter: TelemetryExporter): void => {
  exporters.push(exporter)
  logger.info({ name: exporter.name }, 'Telemetry exporter registered')
}

// ─────────────────────────────────────────────
// REACTIVE NOTIFICATIONS
// ─────────────────────────────────────────────

export type ReactiveHandler = (
  type:      string,
  eventName: string,
  payload:   Record<string, unknown>
) => Promise<void>

const reactiveHandlers: ReactiveHandler[] = []

export const registerReactiveHandler = (handler: ReactiveHandler): void => {
  reactiveHandlers.push(handler)
}

// ─────────────────────────────────────────────
// CORE
// ─────────────────────────────────────────────

export const processEventForAudit = async (
  eventName: string,
  payload:   Record<string, unknown>
): Promise<void> => {
  const meta = EVENT_META[eventName]

  if (!meta) {
    logger.warn({ eventName }, 'processEventForAudit: evento sem metadados — ignorado')
    return
  }

  const entityId      = payload[meta.entityIdField]      as string | undefined
  const actorId       = meta.actorIdField      ? payload[meta.actorIdField]      as string | undefined : undefined
  const actorStaffId  = meta.actorStaffIdField ? payload[meta.actorStaffIdField] as string | undefined : undefined
  if (!entityId) {
    logger.warn({ eventName, meta }, 'processEventForAudit: entityId não encontrado no payload')
    return
  }

  // 1. Persistir no activity_log via repository
  try {
    const repo = createActivityLogRepository(db)
    await repo.insert({
      actorId:      actorId      ?? null,
      actorStaffId: actorStaffId ?? null,
      action:       eventName,
      entityType:   meta.entityType,
      entityId,
      metadata:     payload,
    })
  } catch (err) {
    logger.error(err, `processEventForAudit: failed to persist activity_log for ${eventName}`)
  }

  // 2. Notificações reactivas — fire-and-forget
  // 3. Telemetria externa — fire-and-forget
  for (const exporter of exporters) {
    exporter.export(eventName, payload).catch(err =>
      logger.error(err, `Telemetry exporter failed: ${exporter.name}`)
    )
  }
}
// ─────────────────────────────────────────────
// AUDIT HELPERS
// ─────────────────────────────────────────────

type AuditMetadata = Record<string, unknown>

const insertAuditLog = async (
  actorId:      string | null,
  actorStaffId: string | null,
  entityType:   string,
  entityId:     string,
  action:       string,
  metadata?:    AuditMetadata,
): Promise<void> => {
  try {
    const repo = createActivityLogRepository(db)
    await repo.insert({ actorId, actorStaffId, action, entityType, entityId, metadata })
  } catch (err) {
    logger.error(err, `auditHelpers: failed (${action} ${entityType} ${entityId})`)
  }
}

export const auditHelpers = {
  // ─────────────────────────────────────────────
  // User actions (actor = regular user)
  // ─────────────────────────────────────────────
  create: (actorId: string, entityType: string, entityId: string, metadata?: AuditMetadata) =>
    insertAuditLog(actorId, null, entityType, entityId, `${entityType.toUpperCase()}_CREATED`, metadata),

  update: (actorId: string, entityType: string, entityId: string, metadata?: AuditMetadata) =>
    insertAuditLog(actorId, null, entityType, entityId, `${entityType.toUpperCase()}_UPDATED`, metadata),

  delete: (actorId: string, entityType: string, entityId: string, metadata?: AuditMetadata) =>
    insertAuditLog(actorId, null, entityType, entityId, `${entityType.toUpperCase()}_DELETED`, metadata),

  // ─────────────────────────────────────────────
  // Staff actions (actor = staff member)
  // ─────────────────────────────────────────────
  staffCreate: (staffId: string, entityType: string, entityId: string, metadata?: AuditMetadata) =>
    insertAuditLog(null, staffId, entityType, entityId, `${entityType.toUpperCase()}_CREATED`, metadata),

  staffUpdate: (staffId: string, entityType: string, entityId: string, metadata?: AuditMetadata) =>
    insertAuditLog(null, staffId, entityType, entityId, `${entityType.toUpperCase()}_UPDATED`, metadata),

  staffDelete: (staffId: string, entityType: string, entityId: string, metadata?: AuditMetadata) =>
    insertAuditLog(null, staffId, entityType, entityId, `${entityType.toUpperCase()}_DELETED`, metadata),

  staffAction: (staffId: string, entityType: string, entityId: string, action: string, metadata?: AuditMetadata) =>
    insertAuditLog(null, staffId, entityType, entityId, action, metadata),
}
