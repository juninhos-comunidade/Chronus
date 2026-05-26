import { z } from 'zod'

export type ActivityLogResponseDTO = {
  id:           string
  actorId:      string | null
  actorStaffId: string | null
  action:       string
  entityType:   string
  entityId:     string
  metadata:     Record<string, unknown>
  ipAddress:    string | null
  userAgent:    string | null
  createdAt:    Date
}

export type ListActivityLogFilters = {
  actorId?:     string
  actorStaffId?: string
  entityType?:  string
  entityId?:    string
  action?:      string
  from?:        Date
  to?:          Date
  page?:        number
  pageSize?:    number
}


export const listActivityLogSchema = z.object({
  actorId:      z.string().uuid().optional(),
  actorStaffId: z.string().uuid().optional(),
  entityType:   z.string().optional(),
  entityId:     z.string().uuid().optional(),
  action:       z.string().optional(),
  from:         z.coerce.date().optional(),
  to:           z.coerce.date().optional(),
  page:         z.coerce.number().min(1).default(1),
  pageSize:     z.coerce.number().min(1).max(100).default(50),
})
