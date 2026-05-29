import { eq, and, isNull, asc, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { Database } from '@/db'
import { invites } from '@/db/schema'
import type { IWorkspaceInviteRepository } from '../../application/ports/workspace.port'
import type { InviteResponseDTO } from '../../application/dtos/workspace.dto'
import { dbExec } from '@/db/db-exec'
import { DbOrTx } from '@/db/transaction'
import { normalizePagination, buildListResponse } from '@/shared/types/query.types'
import type { ListResponse } from '@/shared/types/query.types'

type InviteSelect = InferSelectModel<typeof invites>

const COMPONENT = 'WorkspaceInviteRepository'

const toInviteDTO = (row: InviteSelect): InviteResponseDTO => ({
  id:          row.id,
  workspaceId: row.workspaceId,
  email:       row.email,
  role:        row.role,
  token:       row.token,
  expiresAt:   row.expiresAt,
  acceptedAt:  row.acceptedAt ?? null,
  createdAt:   row.createdAt,
})

export const createWorkspaceInviteRepository = (db: Database): IWorkspaceInviteRepository => ({
  async createInvite(data: {
    workspaceId: string; email: string; role: string
    invitedBy: string; token: string; expiresAt: Date
  }, tx?: DbOrTx): Promise<InviteResponseDTO> {
    return dbExec('createInvite', COMPONENT, async () => {
      const conn = tx ?? db
      const [row] = await conn
        .insert(invites)
        .values(data)
        .returning()
      return toInviteDTO(row)
    })
  },

  async findInviteByToken(token: string): Promise<InviteResponseDTO | null> {
    return dbExec('findInviteByToken', COMPONENT, async () => {
      const [row] = await db
        .select()
        .from(invites)
        .where(eq(invites.token, token))
        .limit(1)
      if (!row) return null
      return toInviteDTO(row)
    })
  },

  async findPendingInvite(workspaceId: string, email: string): Promise<InviteResponseDTO | null> {
    return dbExec('findPendingInvite', COMPONENT, async () => {
      const [row] = await db
        .select()
        .from(invites)
        .where(and(
          eq(invites.workspaceId, workspaceId),
          eq(invites.email, email),
          isNull(invites.acceptedAt),
        ))
        .limit(1)
      if (!row) return null
      return toInviteDTO(row)
    })
  },

  async acceptInvite(token: string, tx?: DbOrTx): Promise<void> {
    return dbExec('acceptInvite', COMPONENT, async () => {
      const conn = tx ?? db
      await conn
        .update(invites)
        .set({ acceptedAt: new Date() })
        .where(eq(invites.token, token))
    })
  },

  async listInvites(workspaceId: string, pagination?: import('@/shared/types/query.types').PaginationParams): Promise<ListResponse<InviteResponseDTO>> {
    return dbExec('listInvites', COMPONENT, async () => {
      const { page, pageSize, offset } = normalizePagination(pagination ?? {})

      const conditions = [
        eq(invites.workspaceId, workspaceId),
        isNull(invites.acceptedAt),
      ]

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(invites)
        .where(and(...conditions))

      const totalItems = Number(count)

      const rows = await db
        .select()
        .from(invites)
        .where(and(...conditions))
        .orderBy(asc(invites.createdAt))
        .limit(pageSize)
        .offset(offset)

      return buildListResponse(rows.map(toInviteDTO), totalItems, page, pageSize)
    })
  },
})
