import type { DbOrTx } from '@/db/transaction'

export interface StaffSessionRecord {
  id: string
  staffId: string
  token: string
  refreshToken: string | null
  isActive: boolean
  expiresAt: Date
}

export interface IStaffSessionRepository {
  create(data: {
    staffId: string
    token: string
    refreshToken: string
    userAgent?: string
    ipAddress?: string
    expiresAt: Date
  }, db?: DbOrTx): Promise<StaffSessionRecord>
  findByToken(token: string): Promise<StaffSessionRecord | null>
  findByRefreshToken(refreshToken: string): Promise<StaffSessionRecord | null>
  revoke(sessionId: string, db?: DbOrTx): Promise<void>
  revokeAllByStaff(staffId: string, db?: DbOrTx): Promise<void>
}