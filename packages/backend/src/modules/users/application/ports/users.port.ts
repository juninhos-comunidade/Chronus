import type { Result } from '@/shared/result/types'
import type { AppError } from '@/shared/result/errors'
import type { DbOrTx } from '@/db/transaction'

export type UserResponseDTO = {
  id: string
  email: string
  name: string
  phone: string | null
  avatar: string | null
  timezone: string | null
  locale: string
  status: string
  createdAt: Date
}

export interface IUserRepository {
  findByEmailHash(emailHash: string): Promise<(UserResponseDTO & { passwordHash: string | null }) | null>
  findById(id: string): Promise<UserResponseDTO | null>
}
