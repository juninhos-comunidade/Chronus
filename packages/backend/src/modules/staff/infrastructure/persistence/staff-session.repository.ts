import { eq } from 'drizzle-orm'
import type { Database } from '@/db'
import { staffSessions } from '@/db/schema'
import type { IStaffSessionRepository } from '../../application/ports/staff-session.port'
import { dbExec } from '@/db/db-exec'

export const createStaffSessionRepository = (db: Database): IStaffSessionRepository => ({
  async create(data, tx) {
    return dbExec('create', 'StaffSessionRepository', async () => {
      const conn = tx ?? db
      const [row] = await conn
        .insert(staffSessions)
        .values({
          staffId:      data.staffId,
          token:        data.token,
          refreshToken: data.refreshToken,
          userAgent:    data.userAgent,
          ipAddress:    data.ipAddress,
          expiresAt:    data.expiresAt,
          isActive:     true,
        })
        .returning()
      return {
        id:           row.id,
        staffId:      row.staffId,
        token:        row.token,
        refreshToken: row.refreshToken,
        isActive:     row.isActive,
        expiresAt:    row.expiresAt,
      }
    })
  },

  async findByToken(token) {
    return dbExec('findByToken', 'StaffSessionRepository', async () => {
      const [row] = await db
        .select()
        .from(staffSessions)
        .where(eq(staffSessions.token, token))
        .limit(1)
      if (!row) return null
      return {
        id: row.id, staffId: row.staffId, token: row.token,
        refreshToken: row.refreshToken, isActive: row.isActive, expiresAt: row.expiresAt,
      }
    })
  },

  async findByRefreshToken(refreshToken) {
    return dbExec('findByRefreshToken', 'StaffSessionRepository', async () => {
      const [row] = await db
        .select()
        .from(staffSessions)
        .where(eq(staffSessions.refreshToken, refreshToken))
        .limit(1)
      if (!row) return null
      return {
        id: row.id, staffId: row.staffId, token: row.token,
        refreshToken: row.refreshToken, isActive: row.isActive, expiresAt: row.expiresAt,
      }
    })
  },

  async revoke(sessionId, tx) {
    return dbExec('revoke', 'StaffSessionRepository', async () => {
      const conn = tx ?? db
      await conn
        .update(staffSessions)
        .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
        .where(eq(staffSessions.id, sessionId))
    })
  },

  async revokeAllByStaff(staffId, tx) {
    return dbExec('revokeAllByStaff', 'StaffSessionRepository', async () => {
      const conn = tx ?? db
      await conn
        .update(staffSessions)
        .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
        .where(eq(staffSessions.staffId, staffId))
    })
  },
})