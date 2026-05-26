import { eq, count, asc, and } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import type { Database } from '@/db'
import { staffUsers } from '@/db/schema'
import type { IStaffRepository } from '../../application/ports/staff.port'
import type { StaffResponseDTO } from '../../application/dtos/staff.dto'
import { encryptFields, decryptFields, createCryptoConfig } from '@/shared/crypto/crypto-fields'
import { getEncryption } from '@/shared/crypto/encryption.service'
import { dbExec } from '@/db/db-exec'

type StaffSelect = InferSelectModel<typeof staffUsers>

const CRYPTO_CONFIG = createCryptoConfig(['email', 'name'])

const toStaffResponseDTO = (row: StaffSelect): StaffResponseDTO => {
  const decrypted = decryptFields(row, CRYPTO_CONFIG)
  return {
    id:          row.id,
    email:       decrypted.email as string,
    name:        decrypted.name as string,
    isActive:    row.isActive,
    lastLoginAt: row.lastLoginAt ?? null,
    createdAt:   row.createdAt,
  }
}

export const createStaffRepository = (db: Database): IStaffRepository => {
  const encryption = getEncryption()

  return {
    async create(data, tx) {
      return dbExec('create', 'StaffRepository', async () => {
        const conn = tx ?? db
        const encrypted = encryptFields(data, CRYPTO_CONFIG)
        const [row] = await conn
          .insert(staffUsers)
          .values({
            email:        encrypted.email as string,
            emailHash:    data.emailHash,
            name:         encrypted.name as string,
            passwordHash: data.passwordHash,
            isActive:     true,
          })
          .returning()
        return toStaffResponseDTO(row)
      })
    },

    async findById(id) {
      return dbExec('findById', 'StaffRepository', async () => {
        const [row] = await db
          .select()
          .from(staffUsers)
          .where(eq(staffUsers.id, id))
          .limit(1)
        if (!row) return null
        return toStaffResponseDTO(row)
      })
    },

    async findByEmailHash(emailHash) {
      return dbExec('findByEmailHash', 'StaffRepository', async () => {
        const [row] = await db
          .select()
          .from(staffUsers)
          .where(eq(staffUsers.emailHash, emailHash))
          .limit(1)
        if (!row) return null
        return {
          ...toStaffResponseDTO(row),
          passwordHash: row.passwordHash,
        }
      })
    },

    async list(page, perPage, filters) {
      return dbExec('list', 'StaffRepository', async () => {
        const offset = (page - 1) * perPage

        const conditions = []
        if (filters?.isActive !== undefined) {
          conditions.push(eq(staffUsers.isActive, filters.isActive))
        }
        const where = conditions.length ? and(...conditions) : undefined

        const [data, totalResult] = await Promise.all([
          db
            .select()
            .from(staffUsers)
            .where(where)
            .orderBy(asc(staffUsers.createdAt))
            .limit(perPage)
            .offset(offset),
          db.select({ count: count() }).from(staffUsers).where(where),
        ])

        const totalItems = totalResult[0].count
        return {
          data: data.map(toStaffResponseDTO),
          pagination: {
            currentPage: page,
            perPage,
            totalItems,
            totalPages: Math.ceil(totalItems / perPage),
          },
        }
      })
    },

    async update(id, data, tx) {
      return dbExec('update', 'StaffRepository', async () => {
        const conn = tx ?? db
        const updateData: Record<string, unknown> = { updatedAt: new Date() }

        if (data.name) {
          updateData.name = encryption.encrypt(data.name)
        }
        if (data.isActive !== undefined) {
          updateData.isActive = data.isActive
        }

        const [row] = await conn
          .update(staffUsers)
          .set(updateData)
          .where(eq(staffUsers.id, id))
          .returning()
        return toStaffResponseDTO(row)
      })
    },

    async updateLastLogin(id, tx) {
      return dbExec('updateLastLogin', 'StaffRepository', async () => {
        const conn = tx ?? db
        await conn
          .update(staffUsers)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(staffUsers.id, id))
      })
    },

    async count() {
      return dbExec('count', 'StaffRepository', async () => {
        const [result] = await db.select({ count: count() }).from(staffUsers)
        return result.count
      })
    },
  }
}