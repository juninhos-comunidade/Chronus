import { z } from 'zod'

export type CreateWorkspaceDTO = {
  name: string
  slug: string
  sprintDurationDays?: number
  timezone?: string
}

export type UpdateWorkspaceDTO = {
  name?: string
  sprintDurationDays?: number
  timezone?: string
  kanbanConfig?: {
    states?: Array<{ key: string; label: string; color?: string; position: number }>
  }
}

export type WorkspaceResponseDTO = {
  id: string
  name: string
  slug: string
  ownerId: string
  sprintDurationDays: number
  timezone: string
  kanbanConfig: { states?: Array<{ key: string; label: string; color?: string; position: number }> }
  status: string
  createdAt: Date
}

export type WorkspaceMemberResponseDTO = {
  id: string
  workspaceId: string
  userId: string
  name: string
  email: string
  avatar: string | null
  role: 'admin' | 'lead' | 'member'
  joinedAt: Date
  status: string
}

export type InviteMemberDTO = {
  email: string
  role?: 'admin' | 'lead' | 'member'
}

export type InviteResponseDTO = {
  id: string
  workspaceId: string
  email: string
  role: string
  token: string
  expiresAt: Date
  acceptedAt: Date | null
  createdAt: Date
}

export type UpdateMemberRoleDTO = {
  role: 'admin' | 'lead' | 'member'
}

const strongSlug = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9-]+$/)

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  slug: strongSlug,
  sprintDurationDays: z.union([z.literal(7), z.literal(14), z.literal(30)]).default(14),
  timezone: z.string().optional(),
})

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  sprintDurationDays: z.union([z.literal(7), z.literal(14), z.literal(30)]).optional(),
  timezone: z.string().optional(),
  kanbanConfig: z
    .object({
      states: z
        .array(
          z.object({
            key: z.string(),
            label: z.string(),
            color: z.string().optional(),
            position: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
})

export const workspaceIdSchema = z.object({ id: z.string().uuid() })

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'lead', 'member']).default('member'),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'lead', 'member']),
})
