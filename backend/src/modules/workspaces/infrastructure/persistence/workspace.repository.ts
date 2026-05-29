import { eq, and, isNull, asc, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { Database } from '@/db'
import { workspaces, workspaceMembers } from '@/db/schema'
import type { IWorkspaceRepository } from '../../application/ports/workspace.port'
import type {
  CreateWorkspaceDTO, UpdateWorkspaceDTO, WorkspaceResponseDTO,
} from '../../application/dtos/workspace.dto'
import { dbExec } from '@/db/db-exec'
import { DbOrTx } from '@/db/transaction'
import { normalizePagination, buildListResponse } from '@/shared/types/query.types'
import type { ListResponse } from '@/shared/types/query.types'

type WorkspaceSelect = InferSelectModel<typeof workspaces>

const COMPONENT = 'WorkspaceRepository'

const toWorkspaceDTO = (row: WorkspaceSelect): WorkspaceResponseDTO => ({
  id:                row.id,
  name:              row.name,
  slug:              row.slug,
  ownerId:           row.ownerId,
  sprintDurationDays: row.sprintDurationDays,
  timezone:          row.timezone,
  kanbanConfig:      row.kanbanConfig as WorkspaceResponseDTO['kanbanConfig'] ?? {},
  status:            row.status,
  createdAt:         row.createdAt,
})

export const createWorkspaceRepository = (db: Database): IWorkspaceRepository => ({
  async create(data: CreateWorkspaceDTO & { ownerId: string }, tx?: DbOrTx  ): Promise<WorkspaceResponseDTO> {
    return dbExec('create', COMPONENT, async () => {
      const conn = tx ?? db
      const [row] = await conn
        .insert(workspaces)
        .values({
          name:               data.name,
          slug:               data.slug,
          ownerId:            data.ownerId,
          sprintDurationDays: data.sprintDurationDays ?? 14,
          timezone:           data.timezone ?? 'UTC',
        })
        .returning()
      return toWorkspaceDTO(row)
    })
  },

  async findById(id: string): Promise<WorkspaceResponseDTO | null> {
    return dbExec('findById', COMPONENT, async () => {
      const [row] = await db
        .select()
        .from(workspaces)
        .where(and(eq(workspaces.id, id), isNull(workspaces.deletedAt)))
        .limit(1)
      if (!row) return null
      return toWorkspaceDTO(row)
    })
  },

  async findBySlug(slug: string): Promise<WorkspaceResponseDTO | null> {
    return dbExec('findBySlug', COMPONENT, async () => {
      const [row] = await db
        .select()
        .from(workspaces)
        .where(and(eq(workspaces.slug, slug), isNull(workspaces.deletedAt)))
        .limit(1)
      if (!row) return null
      return toWorkspaceDTO(row)
    })
  },

  async findByUser(userId: string, pagination?: import('@/shared/types/query.types').PaginationParams): Promise<ListResponse<WorkspaceResponseDTO>> {
    return dbExec('findByUser', COMPONENT, async () => {
      const { page, pageSize, offset } = normalizePagination(pagination ?? {})

      const conditions = [
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.status, 'active'),
        isNull(workspaces.deletedAt),
      ]

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(workspaces)
        .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(and(...conditions))

      const totalItems = Number(count)

      const rows = await db
        .select()
        .from(workspaces)
        .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
        .where(and(...conditions))
        .orderBy(asc(workspaces.createdAt))
        .limit(pageSize)
        .offset(offset)

      return buildListResponse(rows.map(r => toWorkspaceDTO(r.workspaces)), totalItems, page, pageSize)
    })
  },

  async update(id: string, data: Partial<UpdateWorkspaceDTO & { status?: string }>, tx?: DbOrTx): Promise<WorkspaceResponseDTO> {
    return dbExec('update', COMPONENT, async () => {
      const conn = tx ?? db
      const updateData: Record<string, unknown> = { updatedAt: new Date() }
      if (data.name !== undefined) updateData.name = data.name
      if (data.sprintDurationDays !== undefined) updateData.sprintDurationDays = data.sprintDurationDays
      if (data.timezone !== undefined) updateData.timezone = data.timezone
      if (data.kanbanConfig !== undefined) updateData.kanbanConfig = data.kanbanConfig
      if (data.status !== undefined) updateData.status = data.status
      const [row] = await conn
        .update(workspaces)
        .set(updateData)
        .where(eq(workspaces.id, id))
        .returning()
      return toWorkspaceDTO(row)
    })
  },
})
