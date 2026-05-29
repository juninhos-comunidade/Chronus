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
