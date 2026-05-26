import { env } from '@/config/env'

/**
 * Configurações de cookie httpOnly para JWT
 */
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 2,
  path: '/',
  domain: env.COOKIE_DOMAIN,
} as const

/**
 * Tipo para o cookie do Elysia (extraído dos tipos reais)
 */
export interface AuthCookie {
  value?: string
  set(options: {
    value: string
    httpOnly: boolean
    secure: boolean
    sameSite: 'lax' | 'strict' | 'none'
    maxAge: number
    path: string
    domain?: string
  }): void
  remove(): void
}

/**
 * Tipo genérico para cookies do Elysia
 * Aceita qualquer Record de cookies
 */
export type AnyCookieStore = Record<
  string,
  {
    value?: unknown
    set(options: Record<string, unknown>): void
    remove(): void
  }
>

/**
 * Define o cookie de autenticação
 * O browser salva automaticamente e envia em toda requisição
 */
export const setAuthCookie = (cookies: AnyCookieStore, token: string): void => {
  const authCookie = cookies['auth_token'] as AuthCookie
  authCookie.set({
    value: token,
    ...COOKIE_CONFIG,
  })
}

/**
 * Remove o cookie (logout)
 */
export const clearAuthCookie = (cookies: AnyCookieStore): void => {
  const authCookie = cookies['auth_token'] as AuthCookie
  authCookie.remove()
}

/**
 * Atualiza/renova o token (refresh)
 */
export const refreshAuthCookie = (cookies: AnyCookieStore, newToken: string): void => {
  setAuthCookie(cookies, newToken)
}
