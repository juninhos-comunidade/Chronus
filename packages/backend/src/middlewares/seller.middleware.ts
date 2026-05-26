import { Elysia } from 'elysia'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { sellerEmployees, sellerProfiles } from '@/db/schema'
import { authMiddleware } from '@/middlewares/auth.middleware'
import { ErrorFactory } from '@/shared/result/factory'
import { Err, Ok, type Result } from '@/shared/result/types'
import type { ForbiddenError, UnauthorizedError } from '@/shared/result/errors'
import { ACTIVE_STORE_HEADER } from '@/middlewares/store-access.middleware'

export interface SellerContext {
  userId:   string
  sellerId: string
  accessType: 'owner' | 'employee'
  permissions: string[]
}

type SellerAuthError  = UnauthorizedError | ForbiddenError
export type SellerAuthResult = Result<SellerContext, SellerAuthError>


export const getSellerAuth = (sellerAuth: SellerAuthResult): SellerContext => {
  if (!sellerAuth.success) {
    throw new Error('[SellerAuth] getSellerAuth called with failed auth — middleware bypass detected')
  }
  return sellerAuth.value
}

export const requireSellerAuth = (
  sellerAuth: SellerAuthResult
): Result<SellerContext, ForbiddenError | UnauthorizedError> => {
  if (!sellerAuth.success) return sellerAuth
  return sellerAuth
}

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

const hasRequiredPermission = (grantedPermissions: string[], requiredPermissions?: string | string[]) => {
  if (!requiredPermissions) return true
  const required = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
  return required.some(permission => grantedPermissions.includes(permission))
}

export const sellerMiddleware = (requiredPermissions?: string | string[]) =>
  new Elysia({ name: 'seller-auth' })
    .use(authMiddleware())

    .derive({ as: 'global' }, async ({ auth, headers }): Promise<{ sellerAuth: SellerAuthResult }> => {
      if (!auth.success) {
        return {
          sellerAuth: Err(
            ErrorFactory.unauthorized('Autenticação necessária', 'missing_token', 'SellerMiddleware')
          ),
        }
      }

      const { userId } = auth.value
      const [seller] = await db
        .select({ id: sellerProfiles.id, status: sellerProfiles.status })
        .from(sellerProfiles)
        .where(eq(sellerProfiles.userId, userId))
        .limit(1)

      const requestedSellerId = headers[ACTIVE_STORE_HEADER] ?? headers[ACTIVE_STORE_HEADER.toLowerCase()]

      if (seller && seller.status === 'active' && (!requestedSellerId || requestedSellerId === seller.id)) {
        return {
          sellerAuth: Ok({
            userId,
            sellerId: seller.id,
            accessType: 'owner',
            permissions: [],
          }),
        }
      }

      const employeeStores = await db
        .select({
          sellerId: sellerEmployees.sellerId,
          permissions: sellerEmployees.permissions,
          storeStatus: sellerProfiles.status,
        })
        .from(sellerEmployees)
        .innerJoin(sellerProfiles, eq(sellerEmployees.sellerId, sellerProfiles.id))
        .where(and(
          eq(sellerEmployees.userId, userId),
          eq(sellerEmployees.isActive, true),
        ))

      const activeEmployeeStore = requestedSellerId
        ? employeeStores.find(store => store.sellerId === requestedSellerId)
        : employeeStores[0]

      if (activeEmployeeStore) {
        if (activeEmployeeStore.storeStatus !== 'active') {
          return {
            sellerAuth: Err(
              ErrorFactory.forbidden(
                `Loja está '${activeEmployeeStore.storeStatus}' — necessário estar activa`,
                undefined,
                'SellerMiddleware'
              )
            ),
          }
        }

        const permissions = (activeEmployeeStore.permissions ?? []) as string[]
        if (!hasRequiredPermission(permissions, requiredPermissions)) {
          const required = Array.isArray(requiredPermissions) ? requiredPermissions.join(', ') : requiredPermissions
          return {
            sellerAuth: Err(
              ErrorFactory.forbidden('Funcionário sem permissão para esta área', required, 'SellerMiddleware')
            ),
          }
        }

        return {
          sellerAuth: Ok({
            userId,
            sellerId: activeEmployeeStore.sellerId,
            accessType: 'employee',
            permissions,
          }),
        }
      }

      if (!seller) {
        return {
          sellerAuth: Err(
            ErrorFactory.forbidden('Utilizador não tem perfil de seller', undefined, 'SellerMiddleware')
          ),
        }
      }

      if (seller.status !== 'active') {
        return {
          sellerAuth: Err(
            ErrorFactory.forbidden(
              `Perfil de seller está '${seller.status}' — necessário estar activo`,
              undefined,
              'SellerMiddleware'
            )
          ),
        }
      }

      return {
        sellerAuth: Err(
          ErrorFactory.forbidden('Sem acesso à loja seleccionada', undefined, 'SellerMiddleware')
        ),
      }
    })

    .onBeforeHandle({ as: 'scoped' }, ({ sellerAuth, set }) => {
      if (!sellerAuth.success) {
        set.status = sellerAuth.error.statusCode
        return sellerAuth.error
      }
      return
    })
