import { eq, and, asc, sql } from 'drizzle-orm'
import type { Database } from '@/db'
import { workspaceMembers, users } from '@/db/schema'
import type { IWorkspaceMemberRepository } from '../../application/ports/workspace.port'
import type { WorkspaceMemberResponseDTO } from '../../application/dtos/workspace.dto'
import { dbExec } from '@/db/db-exec'
import { DbOrTx } from '@/db/transaction'
import { normalizePagination, buildListResponse } from '@/shared/types/query.types'
import type { ListResponse } from '@/shared/types/query.types'

type MemberRow = {
  id: string; workspaceId: string; userId: string
  name: string; email: string; avatar: string | null
  role: string; joinedAt: Date; status: string
}

const COMPONENT = 'WorkspaceMemberRepository'

const toMemberDTO = (row: MemberRow): WorkspaceMemberResponseDTO => ({
  id:          row.id,
  workspaceId: row.workspaceId,
  userId:      row.userId,
  name:        row.name,
  email:       row.email,
  avatar:      row.avatar,
  role:        row.role as 'admin' | 'lead' | 'member',
  joinedAt:    row.joinedAt,
  status:      row.status,
})

export const createWorkspaceMemberRepository = (db: Database): IWorkspaceMemberRepository => ({
  async addMember(data: { workspaceId: string; userId: string; role: string; invitedBy?: string }, tx?: DbOrTx): Promise<WorkspaceMemberResponseDTO> {
    return dbExec('addMember', COMPONENT, async () => {
      const conn = tx ?? db
      const [row] = await conn
        .insert(workspaceMembers)
        .values({
          workspaceId: data.workspaceId,
          userId:      data.userId,
          role:        data.role,
          invitedBy:   data.invitedBy,
        })
        .returning()
      const userRow = await conn
        .select({ name: users.name, email: users.email, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1)
        .then(rows => rows[0])
      return toMemberDTO({ ...row, ...userRow })
    })
  },

  async findMember(workspaceId: string, userId: string): Promise<WorkspaceMemberResponseDTO | null> {
    return dbExec('findMember', COMPONENT, async () => {
      const [row] = await db
        .select({
          id: workspaceMembers.id,
          workspaceId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          role: workspaceMembers.role,
          joinedAt: workspaceMembers.joinedAt,
          status: workspaceMembers.status,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ))
        .limit(1)
      if (!row) return null
      return toMemberDTO(row)
    })
  },

  async listMembers(workspaceId: string, filters?: { role?: string; status?: string; pagination?: import('@/shared/types/query.types').PaginationParams }): Promise<ListResponse<WorkspaceMemberResponseDTO>> {
    return dbExec('listMembers', COMPONENT, async () => {
      const { page, pageSize, offset } = normalizePagination(filters?.pagination ?? {})

      const conditions = [eq(workspaceMembers.workspaceId, workspaceId)]
      if (filters?.role) conditions.push(eq(workspaceMembers.role, filters.role))
      if (filters?.status) conditions.push(eq(workspaceMembers.status, filters.status))

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(and(...conditions))

      const totalItems = Number(count)

      const rows = await db
        .select({
          id: workspaceMembers.id,
          workspaceId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          role: workspaceMembers.role,
          joinedAt: workspaceMembers.joinedAt,
          status: workspaceMembers.status,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(workspaceMembers.userId, users.id))
        .where(and(...conditions))
        .orderBy(asc(workspaceMembers.joinedAt))
        .limit(pageSize)
        .offset(offset)

      return buildListResponse(rows.map(toMemberDTO), totalItems, page, pageSize)
    })
  },

  async updateMemberRole(workspaceId: string, userId: string, role: string, tx?: DbOrTx): Promise<WorkspaceMemberResponseDTO> {
    return dbExec('updateMemberRole', COMPONENT, async () => {
      const conn = tx ?? db
      const [row] = await conn
        .update(workspaceMembers)
        .set({ role, updatedAt: new Date() })
        .where(and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ))
        .returning()
      const userRow = await conn
        .select({ name: users.name, email: users.email, avatar: users.avatar })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(rows => rows[0])
      return toMemberDTO({ ...row, ...userRow })
    })
  },

  async updateMemberStatus(workspaceId: string, userId: string, status: string, tx?: DbOrTx): Promise<void> {
    return dbExec('updateMemberStatus', COMPONENT, async () => {
      const conn = tx ?? db
      await conn
        .update(workspaceMembers)
        .set({ status, updatedAt: new Date() })
        .where(and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ))
    })
  },

  async removeMember(workspaceId: string, userId: string, tx?: DbOrTx): Promise<void> {
    return dbExec('removeMember', COMPONENT, async () => {
      const conn = tx ?? db
      await conn
        .delete(workspaceMembers)
        .where(and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ))
    })
  },
})
