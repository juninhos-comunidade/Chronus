import type { DbOrTx } from '@/db/transaction'
import type { ActivityLogResponseDTO, ListActivityLogFilters } from '../dtos/activity.dto'

export interface PaginatedResponse<T> {
  data:  T
  total: number
}

export interface IActivityLogRepository {
  insert(data: {
    actorId?:      string | null
    actorStaffId?: string | null
    action:        string
    entityType:    string
    entityId:      string
    metadata?:     Record<string, unknown>
    ipAddress?:    string | null
    userAgent?:    string | null
  }, db?: DbOrTx): Promise<ActivityLogResponseDTO>

  findById(id: string): Promise<ActivityLogResponseDTO | null>

  list(
    filters: ListActivityLogFilters
  ): Promise<PaginatedResponse<ActivityLogResponseDTO[]>>
}
