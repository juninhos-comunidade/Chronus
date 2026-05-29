import { z } from 'zod'

export type StaffResponseDTO = {
  id: string
  email: string
  name: string
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
}

export type CreateStaffDTO = {
  email: string
  name: string
  password: string
}

export type UpdateStaffDTO = {
  name?: string
  isActive?: boolean
}

export type StaffLoginDTO = {
  email: string
  password: string
}

export type StaffAuthResponseDTO = {
  staff: StaffResponseDTO
  accessToken: string
  refreshToken: string
}

export type ListStaffQueryDTO = {
  page?: number
  perPage?: number
  isActive?: boolean
}

export type ActivityLogResponseDTO = {
  id: string
  actorId: string | null
  actorStaffId: string | null
  action: string
  entityType: string
  entityId: string
  metadata: Record<string, unknown>
  ipAddress: string | null
  createdAt: Date
}

export type ListActivityLogQueryDTO = {
  page?: number
  perPage?: number
  actorType?: 'user' | 'staff'
  action?: string
  entityType?: string
  from?: string
  to?: string
}

export type MetricsResponseDTO = {
  gmv: number
  activeSellers: number
  totalOrders: number
  openDisputes: number
  pendingSellers: number
  pendingProducts: number
  pendingWithdrawals: number
  pendingPromotions: number
}

const strongPassword = z.string().min(8, 'Password deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Password deve ter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Password deve ter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Password deve ter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Password deve ter pelo menos um carácter especial')

export const createStaffSchema = z.object({
  email:    z.string().email('Email inválido'),
  name:     z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: strongPassword,
})

export const staffLoginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Password obrigatória'),
})

export const listStaffQuerySchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  perPage:  z.coerce.number().min(1).max(100).default(10),
  isActive: z.coerce.boolean().optional(),
})

export const staffIdSchema = z.object({
  id: z.string().uuid('ID inválido'),
})

export const listActivityLogQuerySchema = z.object({
  page:       z.coerce.number().min(1).default(1),
  perPage:    z.coerce.number().min(1).max(100).default(10),
  actorType:  z.enum(['user', 'staff']).optional(),
  action:     z.string().optional(),
  entityType: z.string().optional(),
  from:       z.string().datetime().optional(),
  to:         z.string().datetime().optional(),
})
