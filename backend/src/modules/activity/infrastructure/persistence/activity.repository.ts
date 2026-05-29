import { eq, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { Database } from '@/db'
import { activityLog } from '@/db/schema'
import type { IActivityLogRepository } from '../../application/ports/activity.port'
import type { ActivityLogResponseDTO } from '../../application/dtos/activity.dto'
import { dbExec } from '@/db/db-exec'

type ActivityLogSelect = InferSelectModel<typeof activityLog>

const toDTO = (row: ActivityLogSelect): ActivityLogResponseDTO => ({
  id:           row.id,
  actorId:      row.actorId      ?? null,
  actorStaffId: row.actorStaffId ?? null,
  action:       row.action,
  entityType:   row.entityType,
  entityId:     row.entityId,
  metadata:     (row.metadata    ?? {}) as Record<string, unknown>,
  ipAddress:    row.ipAddress    ?? null,
  userAgent:    row.userAgent    ?? null,
  createdAt:    row.createdAt,
})

export const createActivityLogRepository = (db: Database): IActivityLogRepository => ({
  async insert(data, tx) {
    return dbExec('insert', 'ActivityLogRepository', async () => {
      const conn = tx ?? db
      const [row] = await conn
        .insert(activityLog)
        .values({
          actorId:      data.actorId      ?? null,
          actorStaffId: data.actorStaffId ?? null,
          action:       data.action,
          entityType:   data.entityType,
          entityId:     data.entityId,
          metadata:     data.metadata     ?? {},
          ipAddress:    data.ipAddress    ?? null,
          userAgent:    data.userAgent    ?? null,
        })
        .returning()
      return toDTO(row)
    })
  },

  async findById(id) {
    return dbExec('findById', 'ActivityLogRepository', async () => {
      const [row] = await db
        .select()
        .from(activityLog)
        .where(eq(activityLog.id, id))
        .limit(1)
      return row ? toDTO(row) : null
    })
  },

  async list(filters) {
    return dbExec('list', 'ActivityLogRepository', async () => {
      const pageSize = filters.pageSize ?? 50
      const offset   = ((filters.page ?? 1) - 1) * pageSize

      const conditions: ReturnType<typeof sql>[] = []
      if (filters.actorId)      conditions.push(sql`actor_id       = ${filters.actorId}`)
      if (filters.actorStaffId) conditions.push(sql`actor_staff_id = ${filters.actorStaffId}`)
      if (filters.entityType)   conditions.push(sql`entity_type    = ${filters.entityType}`)
      if (filters.entityId)     conditions.push(sql`entity_id      = ${filters.entityId}`)
      if (filters.action)       conditions.push(sql`action         = ${filters.action}`)
      if (filters.from)         conditions.push(sql`created_at    >= ${filters.from}`)
      if (filters.to)           conditions.push(sql`created_at    <= ${filters.to}`)

      const where = conditions.length
        ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
        : sql``

      const [dataRows, countRow] = await Promise.all([
        db.execute<{
          id: string; actor_id: string | null; actor_staff_id: string | null
          action: string; entity_type: string; entity_id: string
          metadata: Record<string, unknown>; ip_address: string | null
          user_agent: string | null; created_at: Date
        }>(sql`
          SELECT id, actor_id, actor_staff_id, action,
                 entity_type, entity_id, metadata, ip_address, user_agent, created_at
          FROM activity_log
          ${where}
          ORDER BY created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `),
        db.execute<{ total: string }>(sql`
          SELECT COUNT(*)::text AS total FROM activity_log ${where}
        `),
      ])

      return {
        data: dataRows.map(r => ({
          id:           r.id,
          actorId:      r.actor_id      ?? null,
          actorStaffId: r.actor_staff_id ?? null,
          action:       r.action,
          entityType:   r.entity_type,
          entityId:     r.entity_id,
          metadata:     r.metadata      ?? {},
          ipAddress:    r.ip_address    ?? null,
          userAgent:    r.user_agent    ?? null,
          createdAt:    r.created_at,
        })),
        total: parseInt(countRow[0]?.total ?? '0', 10),
      }
    })
  },
})
