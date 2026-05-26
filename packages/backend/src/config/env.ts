import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  METRICS_PORT: z.string().transform(Number).default('9091'),
  JWT_SECRET: z.string().min(32),
  DB_USER: z.string().min(1, 'DB_USER is required'),
  DB_HOST: z.string().min(1, 'DB_HOST is required'),
  DB_DATABASE: z.string().min(1, 'DB_DATABASE is required'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
  DB_PORT: z.string().transform(Number).default('5432'),
  COOKIE_DOMAIN: z.string().optional(),
  APP_URL: z.string(),
  CORS_ORIGINS: z
    .string()
    .transform((val) => (val === '*' ? ['*'] : val.split(',').map((o) => o.trim()))),
  ENCRYPTION_KEY: z.string().min(1),
  CORS_CREDENTIALS: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  TRUSTED_PROXY: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  SIGNED_URL_SECRET: z.string(),
  STORAGE_DRIVER: z.string().default('local')
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => {
        const path = e.path.join('.')
        const message = e.message
        return `${path}: ${message}`
      })

      console.error('Invalid environment variables:')
      errors.forEach((err) => console.error(`  - ${err}`))

      throw new Error(`Missing or invalid environment variables:\n${errors.join('\n')}`)
    }
    throw error
  }
}

export const env = validateEnv()
