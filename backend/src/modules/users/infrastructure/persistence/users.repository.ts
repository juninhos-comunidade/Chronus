import type { Database } from '@/db'
import type { IUserRepository, UserResponseDTO } from '../../application/ports/users.port'

export const createUserRepository = (_db: Database): IUserRepository => ({
  async findByEmailHash(_emailHash: string): Promise<(UserResponseDTO & { passwordHash: string | null }) | null> {
    throw new Error('UserRepository.findByEmailHash not implemented — FASE 1')
  },
  async findById(_id: string): Promise<UserResponseDTO | null> {
    throw new Error('UserRepository.findById not implemented — FASE 1')
  },
})
