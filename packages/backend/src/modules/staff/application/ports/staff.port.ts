import type { Result } from '@/shared/result/types'
import type { AppError } from '@/shared/result/errors'
import type { DbOrTx } from '@/db/transaction'
import type {
  StaffResponseDTO,
  CreateStaffDTO,
  UpdateStaffDTO,
  StaffAuthResponseDTO,
  StaffLoginDTO,
  ActivityLogResponseDTO,
} from '../dtos/staff.dto'

export interface ListResponse<T> {
  data: T
  pagination: {
    currentPage: number
    perPage: number
    totalItems: number
    totalPages: number
  }
}

export interface IStaffRepository {
  create(
    data: CreateStaffDTO & { emailHash: string; passwordHash: string },
    db?: DbOrTx
  ): Promise<StaffResponseDTO>
  findById(id: string): Promise<StaffResponseDTO | null>
  findByEmailHash(
    emailHash: string
  ): Promise<(StaffResponseDTO & { passwordHash: string }) | null>
  list(
    page: number,
    perPage: number,
    filters?: { isActive?: boolean }
  ): Promise<ListResponse<StaffResponseDTO[]>>
  update(id: string, data: Partial<UpdateStaffDTO>, db?: DbOrTx): Promise<StaffResponseDTO>
  updateLastLogin(id: string, db?: DbOrTx): Promise<void>
  count(): Promise<number>
}

export interface IStaffActivityLogRepository {
  list(
    page: number,
    perPage: number,
    filters?: {
      actorType?: 'user' | 'staff'
      action?: string
      entityType?: string
      from?: Date
      to?: Date
    }
  ): Promise<ListResponse<ActivityLogResponseDTO[]>>
}

export interface IStaffService {
  // Auth
  login(
    data: StaffLoginDTO,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Result<StaffAuthResponseDTO, AppError>>

  // Members
  create(
    data: CreateStaffDTO,
    requestingStaffId: string
  ): Promise<Result<StaffResponseDTO, AppError>>
  list(
    page: number,
    perPage: number,
    filters?: { isActive?: boolean }
  ): Promise<Result<ListResponse<StaffResponseDTO[]>, AppError>>
  deactivate(
    staffId: string,
    requestingStaffId: string
  ): Promise<Result<void, AppError>>
  getById(staffId: string): Promise<Result<StaffResponseDTO, AppError>>

  // Activity Log
  listActivityLog(
    page: number,
    perPage: number,
    filters?: {
      actorType?: 'user' | 'staff'
      action?: string
      entityType?: string
      from?: Date
      to?: Date
    }
  ): Promise<Result<ListResponse<ActivityLogResponseDTO[]>, AppError>>

  // Bootstrap
  seed(): Promise<void>
}