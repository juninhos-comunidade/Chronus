import { Elysia } from 'elysia'
import { eq } from 'drizzle-orm'
import Redis from 'ioredis'
import { db } from '@/db'
import { stores } from '@/db/schema'
import { ErrorFactory } from '@/shared/result/factory'
import { Err, Ok, type Result } from '@/shared/result/types'
import { logger } from '@/shared/logger/logger'
import { env } from '@/config/env'
import type { ForbiddenError, NotFoundError } from '@/shared/result/errors'

export interface StoreContext {
  storeId:     string
  ownerId:     string
  storePlan:   'free' | 'pro' | 'enterprise'
  storeStatus: 'pending' | 'active' | 'grace_period'
}

type StoreContextError  = ForbiddenError | NotFoundError
type StoreContextResult = Result<StoreContext, StoreContextError>

const CACHE_TTL_SECS = 5 * 60 // 5 minutos
const CACHE_PREFIX   = 'store:subdomain:'

const redis = new Redis({
  host:                 env.REDIS_HOST,
  port:                 env.REDIS_PORT,
  password:             env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 50, 2000),
})

redis.on('error', (err) => {
  logger.error({ err }, 'Store middleware Redis error')
})

type CachedStore = {
  storeId:     string
  ownerId:     string
  storePlan:   string
  storeStatus: string
}

const getCached = async (subdomain: string): Promise<CachedStore | null> => {
  try {
    const raw = await redis.get(`${CACHE_PREFIX}${subdomain}`)
    if (!raw) return null
    return JSON.parse(raw) as CachedStore
  } catch {
    return null 
  }
}

const setCache = async (subdomain: string, data: CachedStore): Promise<void> => {
  try {
    await redis.setex(`${CACHE_PREFIX}${subdomain}`, CACHE_TTL_SECS, JSON.stringify(data))
  } catch {
    // falha silenciosa — cache é best-effort
  }
}

export const invalidateStoreCache = async (subdomain: string): Promise<void> => {
  try {
    await redis.del(`${CACHE_PREFIX}${subdomain}`)
  } catch {
    logger.warn({ subdomain }, 'Failed to invalidate store cache')
  }
}

export const extractSubdomain = (request: Request): string | null => {
  const explicit = request.headers.get('x-store-subdomain')
  if (explicit?.trim()) return explicit.trim().toLowerCase()

  const origin = request.headers.get('origin') ?? request.headers.get('referer') ?? ''
  if (origin) {
    try {
      const url = new URL(origin)
      const parts = url.hostname.split('.')
      if (parts.length >= 3) {
        const subdomain = parts[0]
        if (!['www', 'api', 'admin', 'staff'].includes(subdomain)) return subdomain
      }
    } catch {
      //
    }
  }

  const host = request.headers.get('host') ?? ''
  const hostWithoutPort = host.split(':')[0]
  const parts = hostWithoutPort.split('.')
  if (parts.length < 3) return null
  const subdomain = parts[0]
  if (['www', 'api', 'admin', 'staff'].includes(subdomain)) return null
  return subdomain
}
const resolveStore = async (subdomain: string): Promise<StoreContextResult> => {
  const cached = await getCached(subdomain)
  if (cached) {
    if (cached.storeStatus === 'pending') {
      return Err(
        ErrorFactory.forbidden(
          'Loja aguarda aprovação',
          undefined,
          'StoreMiddleware'
        )
      )
    }
    if (cached.storeStatus === 'suspended') {
      return Err(
        ErrorFactory.forbidden(
          'Loja suspensa',
          undefined,
          'StoreMiddleware'
        )
      )
    }
    if (cached.storeStatus !== 'active' && cached.storeStatus !== 'grace_period') {
      return Err(
        ErrorFactory.notFound(
          'Loja não disponível',
          'Store',
          subdomain,
          'StoreMiddleware'
        )
      )
    }
    return Ok({
      storeId:     cached.storeId,
      ownerId:     cached.ownerId,
      storePlan:   cached.storePlan as StoreContext['storePlan'],
      storeStatus: cached.storeStatus as StoreContext['storeStatus'],
    })
  }

  // 2. DB lookup
  const [store] = await db
    .select({
      id:      stores.id,
      ownerId: stores.ownerId,
      plan:    stores.plan,
      status:  stores.status,
    })
    .from(stores)
    .where(eq(stores.subdomain, subdomain))
    .limit(1)

  if (!store) {
    return Err(
      ErrorFactory.notFound(
        'Loja não encontrada',
        'Store',
        subdomain,
        'StoreMiddleware'
      )
    )
  }

  if (store.status === 'pending') {
    return Err(
      ErrorFactory.forbidden(
        'Loja aguarda aprovação',
        undefined,
        'StoreMiddleware'
      )
    )
  }

  if (store.status === 'suspended') {
    return Err(
      ErrorFactory.forbidden(
        'Loja suspensa',
        undefined,
        'StoreMiddleware'
      )
    )
  }

  if (store.status !== 'active' && store.status !== 'grace_period') {
    return Err(
      ErrorFactory.notFound(
        'Loja não disponível',
        'Store',
        subdomain,
        'StoreMiddleware'
      )
    )
  }

  const cacheData: CachedStore = {
    storeId:     store.id,
    ownerId:     store.ownerId,
    storePlan:   store.plan,
    storeStatus: store.status,
  }
  await setCache(subdomain, cacheData)

  return Ok({
    storeId:     store.id,
    ownerId:     store.ownerId,
    storePlan:   store.plan as StoreContext['storePlan'],
    storeStatus: store.status as StoreContext['storeStatus'],
  })
}

export const storeMiddleware = () =>
  new Elysia({ name: 'store-context' })

    .derive({ as: 'scoped' }, async ({ request }): Promise<{ store: StoreContextResult }> => {
      const subdomain = extractSubdomain(request)

      if (!subdomain) {
        return {
          store: Err(
            ErrorFactory.notFound(
              'Subdomain não identificado',
              'Store',
              undefined,
              'StoreMiddleware'
            )
          ),
        }
      }

      const result = await resolveStore(subdomain)
      return { store: result }
    })

export const requireStore = (
  store: StoreContextResult
): StoreContextResult => store

export const requireStoreOwner = (
  storeCtx: StoreContext,
  userId: string
): Result<StoreContext, ForbiddenError> => {
  if (storeCtx.ownerId !== userId) {
    return Err(
      ErrorFactory.forbidden(
        'Acesso negado — não és o dono desta loja',
        undefined,
        'StoreMiddleware'
      )
    )
  }
  return Ok(storeCtx)
}
