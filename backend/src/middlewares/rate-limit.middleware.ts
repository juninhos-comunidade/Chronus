import { Elysia } from 'elysia'
import Redis from 'ioredis'
import { env } from '@/config/env'
import { ErrorFactory } from '@/shared/result/factory'
import { Err } from '@/shared/result/types'
import { logger } from '@/shared/logger/logger'

const redisConnection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

redisConnection.on('error', (error) => {
  logger.error({ error }, 'Redis rate limiter connection error')
})

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

export const RateLimitPresets = {
  AUTH: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'auth:',
  },

  AUTH_FAIL: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'auth_fail:',
  },

  API: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    keyPrefix: 'api:',
  },

  PUBLIC: {
    windowMs: 60 * 1000,
    maxRequests: 120,
    keyPrefix: 'public:',
  },

  CRITICAL: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'critical:',
  },
} as const

export const recordAuthFailure = async (email: string, ip: string): Promise<void> => {
  const baseKey = `ratelimit:auth_fail:${ip}:${email.slice(0, 4)}`
  try {
    const exists = await redisConnection.exists(baseKey)
    if (!exists) {
      await redisConnection.setex(baseKey, 3600, '1')
    } else {
      await redisConnection.incr(baseKey)
    }
  } catch (err) {
    logger.error({ err, email, ip }, 'Failed to record auth failure')
  }
}

export const rateLimitMiddleware = (config: RateLimitConfig) =>
  new Elysia({ name: 'rate-limit' }).onBeforeHandle(async ({ request, set }) => {
    const ip = getClientIp(request)
    const key = `ratelimit:${config.keyPrefix || ''}${ip}`
    const windowSeconds = Math.ceil(config.windowMs / 1000)

    try {
      const multi = redisConnection.multi()
      multi.incr(key)
      multi.ttl(key)

      const results = await multi.exec()

      if (!results) {
        logger.warn({ ip, key }, 'Redis rate limit check failed')
        return undefined
      }

      const [[, currentCount], [, ttl]] = results as [[null, number], [null, number]]

      if (ttl === -1) {
        await redisConnection.expire(key, windowSeconds)
      }

      const remaining = Math.max(0, config.maxRequests - currentCount)
      const resetTime = ttl > 0 ? Date.now() + ttl * 1000 : Date.now() + config.windowMs

      set.headers['X-RateLimit-Limit'] = config.maxRequests.toString()
      set.headers['X-RateLimit-Remaining'] = remaining.toString()
      set.headers['X-RateLimit-Reset'] = new Date(resetTime).toISOString()

      if (currentCount > config.maxRequests) {
        const retryAfter = ttl > 0 ? ttl : windowSeconds
        set.headers['Retry-After'] = retryAfter.toString()

        logger.warn(
          {
            ip,
            path: new URL(request.url).pathname,
            count: currentCount,
            limit: config.maxRequests,
          },
          'Rate limit exceeded'
        )

        return Err(
          ErrorFactory.tooManyRequests(
            `Too many requests. Try again in ${retryAfter} seconds.`,
            retryAfter,
            'RateLimitMiddleware'
          )
        )
      }

      return undefined
    } catch (error) {
      logger.error({ error, ip, key }, 'Rate limit check error - allowing request')
      return undefined
    }
  })

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/

function isValidIpv4(ip: string): boolean {
  if (!IPV4_REGEX.test(ip)) return false
  const parts = ip.split('.').map(Number)
  return parts.every((part) => part >= 0 && part <= 255)
}

function getClientIp(request: Request): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const trustProxy = isProduction && env.TRUSTED_PROXY

  if (trustProxy) {
    const cfConnectingIp = request.headers.get('cf-connecting-ip')
    if (cfConnectingIp && isValidIpv4(cfConnectingIp)) {
      return cfConnectingIp
    }

    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      const firstIp = forwarded.split(',')[0].trim()
      if (isValidIpv4(firstIp)) {
        return firstIp
      }
    }

    const realIp = request.headers.get('x-real-ip')
    if (realIp && isValidIpv4(realIp)) {
      return realIp
    }
  }

  return 'unknown'
}
