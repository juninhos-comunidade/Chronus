import { Elysia } from 'elysia'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { sellerEmployees, sellerProfiles } from '@/db/schema'
import { authMiddleware } from '@/middlewares/auth.middleware'
import { ErrorFactory } from '@/shared/result/factory'
import { Err, Ok, type Result } from '@/shared/result/types'
import type { UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '@/shared/result/errors'

export const ACTIVE_STORE_HEADER = 'x-active-store-id'

export type StoreAccessValue = {
  sellerId: string
  accessType: 'owner' | 'employee'
  permissions: string[]
}

export type StoreAccessResult = Result<StoreAccessValue, UnauthorizedError | ForbiddenError | NotFoundError>

const hasRequiredPermission = (grantedPermissions: string[], requiredPermissions?: string | string[]) => {
  if (!requiredPermissions) return true
  const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
  return required.some(permission => grantedPermissions.includes(permission))
}

export const storeAccessMiddleware = (requiredPermissions?: string | string[]) =>
  new Elysia({ name: 'store-access' })
    .use(authMiddleware())
    .derive({ as: 'global' }, async ({ auth, headers }): Promise<{ storeAccess: StoreAccessResult }> => {
      if (!auth.success) {
        return { storeAccess: auth }
      }

      if (!auth.value.roles.includes('seller')) {
        return {
          storeAccess: Err(
            ErrorFactory.forbidden('Acesso restrito a vendedores', undefined, 'StoreAccessMiddleware')
          ),
        }
      }

      const [profile] = await db
        .select({ id: sellerProfiles.id })
        .from(sellerProfiles)
        .where(eq(sellerProfiles.userId, auth.value.userId))
        .limit(1)

      const requestedSellerId = headers[ACTIVE_STORE_HEADER] ?? headers[ACTIVE_STORE_HEADER.toLowerCase()]

      if (requestedSellerId && profile?.id === requestedSellerId) {
        return {
          storeAccess: Ok({ sellerId: profile.id, accessType: 'owner', permissions: [] }),
        }
      }

      if (!requestedSellerId && profile) {
        return {
          storeAccess: Ok({ sellerId: profile.id, accessType: 'owner', permissions: [] }),
        }
      }

      const employeeStores = await db
        .select({
          sellerId: sellerEmployees.sellerId,
          permissions: sellerEmployees.permissions,
        })
        .from(sellerEmployees)
        .where(and(
          eq(sellerEmployees.userId, auth.value.userId),
          eq(sellerEmployees.isActive, true),
        ))

      const activeEmployeeStore = requestedSellerId
        ? employeeStores.find(store => store.sellerId === requestedSellerId)
        : employeeStores[0]

      if (activeEmployeeStore) {
        const permissions = (activeEmployeeStore.permissions ?? []) as string[]
        if (!hasRequiredPermission(permissions, requiredPermissions)) {
          const required = Array.isArray(requiredPermissions) ? requiredPermissions.join(', ') : requiredPermissions
          return {
            storeAccess: Err(
              ErrorFactory.forbidden('Sem permissão para aceder a esta área', required, 'StoreAccessMiddleware')
            ),
          }
        }

        return {
          storeAccess: Ok({
            sellerId: activeEmployeeStore.sellerId,
            accessType: 'employee',
            permissions,
          }),
        }
      }

      if (requestedSellerId) {
        return {
          storeAccess: Err(
            ErrorFactory.forbidden('Sem acesso a esta loja', undefined, 'StoreAccessMiddleware')
          ),
        }
      }

      return {
        storeAccess: Err(
          ErrorFactory.forbidden('Perfil de vendedor ou vínculo de funcionário não encontrado', undefined, 'StoreAccessMiddleware')
        ),
      }
    })

export const requireStoreAccess = (access: StoreAccessResult): Result<StoreAccessValue, AppError> => {
  if (!access.success) return access
  return Ok(access.value)
}
