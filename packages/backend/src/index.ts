import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { elysiaHelmet } from 'elysiajs-helmet'
import { env } from '@/config/env'
import { logger } from '@/shared/logger/logger'
import { resultMiddleware } from '@/middlewares/result.middleware'
import { staffController } from './modules/staff/infrastructure/http/controllers/staff.controller'

const app = new Elysia()
.use(
  cors({
    origin: (request) => {
      const origin = request.headers.get('origin')
      if (!origin) return true
      
      if (env.CORS_ORIGINS.includes('*')) return true
      
      if (env.CORS_ORIGINS.includes(origin)) return true
      
      for (const allowed of env.CORS_ORIGINS) {
        if (allowed.includes('*')) {
          const pattern = allowed.replace(/\*/g, '.*')
          const regex = new RegExp(`^${pattern}$`)
          if (regex.test(origin)) {
            return true
          }
        }
      }
      
      return false
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-Subdomain', 'x-active-store-id'],
  })
)

  .use(
    elysiaHelmet({
      frameOptions: 'DENY',
      xssProtection: true,
      dnsPrefetch: false,
      referrerPolicy: 'strict-origin-when-cross-origin',
      hsts: { maxAge: 31536000, includeSubDomains: true },
      corp: 'cross-origin',
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
      },
    })
  )

  // Swagger apenas em desenvolvimento
  .use(
    env.NODE_ENV !== 'production'
      ? swagger({
          documentation: {
            info: {
              title: 'Chronus API',
              version: '1.0.0',
              description: 'Plataforma de gestão de tempo focada em equipas',
            },
            tags: [
              { name: 'staff-auth', description: 'Autenticação de staff' },
              { name: 'staff', description: 'Gestão de staff' }
            ],
          },
          path: '/docs',
        })
      : (app: Elysia) => app
  )

  .use(resultMiddleware())

  .get(
    '/health',
    () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }),
    { detail: { tags: ['health'], summary: 'Health check' } }
  )

  // Staff
  .use(staffController)

  .onStart(() => {
    logger.info(`chronus API running on http://localhost:${env.PORT}`)
    if (env.NODE_ENV !== 'production') {
      logger.info(`Swagger docs: http://localhost:${env.PORT}/docs`)
    }
  })
  .onStop(() => {
    logger.info('Server stopped gracefully')
  })

  // Error handler global - previne stack traces em produção
  .onError(({ request, error, code }) => {
    const isProduction = env.NODE_ENV === 'production'
    
    const errorObj = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : { name: 'Unknown', message: String(error) }
    
    logger.error(
      {
        method: request.method,
        url: request.url,
        code,
        error: isProduction 
          ? { name: errorObj.name, message: errorObj.message }
          : errorObj,
      },
      'Unhandled error'
    )

    if (isProduction) {
      return {
        success: false,
        error: {
          type: 'INTERNAL_SERVER_ERROR',
          message: 'Erro interno do servidor',
          timestamp: new Date().toISOString(),
        },
      }
    }
    
    return error
  })

  .listen(env.PORT)

export type App = typeof app
