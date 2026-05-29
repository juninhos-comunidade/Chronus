import { eq, and, gte, lte, isNotNull } from 'drizzle-orm'
import { count } from 'drizzle-orm'
import type { Database } from '@/db'
import { activityLog } from '@/db/schema'
import type { IStaffActivityLogRepository } from '../../application/ports/staff.port'
import type { ActivityLogResponseDTO } from '../../application/dtos/staff.dto'
import { dbExec } from '@/db/db-exec'

const toDTO = (row: typeof activityLog.$inferSelect): ActivityLogResponseDTO => ({
  id:           row.id,
  actorId:      row.actorId ?? null,
  actorStaffId: row.actorStaffId ?? null,
  action:       row.action,
  entityType:   row.entityType,
  entityId:     row.entityId,
  metadata:     (row.metadata as Record<string, unknown>) ?? {},
  ipAddress:    row.ipAddress ?? null,
  createdAt:    row.createdAt,
})

export const createStaffActivityLogRepository = (db: Database): IStaffActivityLogRepository => ({
  async list(page, perPage, filters) {
    return dbExec('list', 'StaffActivityLogRepository', async () => {
      const offset = (page - 1) * perPage
      const conditions = []

      if (filters?.actorType === 'user')  conditions.push(isNotNull(activityLog.actorId))
      if (filters?.actorType === 'staff') conditions.push(isNotNull(activityLog.actorStaffId))
      if (filters?.action)     conditions.push(eq(activityLog.action,     filters.action))
      if (filters?.entityType) conditions.push(eq(activityLog.entityType, filters.entityType))
      if (filters?.from)       conditions.push(gte(activityLog.createdAt, filters.from))
      if (filters?.to)         conditions.push(lte(activityLog.createdAt, filters.to))

      const where = conditions.length ? and(...conditions) : undefined

      const [data, totalResult] = await Promise.all([
        db.select().from(activityLog).where(where).limit(perPage).offset(offset),
        db.select({ count: count() }).from(activityLog).where(where),
      ])

      const totalItems = totalResult[0].count
      return {
        data: data.map(toDTO),
        pagination: {
          currentPage: page,
          perPage,
          totalItems,
          totalPages: Math.ceil(totalItems / perPage),
        },
      }
    })
  },
})