import { hash, verify } from '@node-rs/argon2'
import { sign, verify as jwtVerify, type JwtPayload } from 'jsonwebtoken'
import { env } from '@/config/env'

const ARGON2_CONFIG = {
  memoryCost: 19456,
  timeCost:   2,
  parallelism: 1,
} as const

export const hashPassword = async (password: string): Promise<string> => {
  if (!password) throw new Error('Password cannot be empty')
  return hash(password, ARGON2_CONFIG)
}

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!password || !hashedPassword) return false
  try {
    return await verify(hashedPassword, password, ARGON2_CONFIG)
  } catch {
    return false
  }
}


// JWT — payload tipado


/**
 * Tipos de token no sistema.
 * Cada actor tem o seu próprio type — nunca se misturam.
 *
 *   'user'          → customer ou owner autenticado
 *   'user_refresh'  → refresh token de user/owner
 *   'staff'         → staff autenticado
 *   'staff_refresh' → refresh token de staff
 */
export type TokenType =
  | 'user'
  | 'user_refresh'
  | 'staff'
  | 'staff_refresh'

/**
 * Shape do payload JWT.
 * Usa campos discriminados — nunca há ambiguidade sobre quem é o actor.
 */
export type TokenPayload =
  | { type: 'user' | 'user_refresh';   userId:  string }
  | { type: 'staff' | 'staff_refresh'; staffId: string }

type RawPayload = JwtPayload & TokenPayload

const JWT_SECRET = env.JWT_SECRET

/**
 * Assina um JWT com qualquer payload tipado.
 *
 * @param payload  - Dados a incluir no token (userId ou staffId + type)
 * @param ttlSecs  - Tempo de vida em segundos
 * @returns        - JWT assinado
 *
 * @example
 * // Token de acesso de staff (15 min)
 * signToken({ staffId: 'abc', type: 'staff' }, 15 * 60)
 *
 * // Token de acesso de user (15 min)
 * signToken({ userId: 'xyz', type: 'user' }, 15 * 60)
 */
export const signToken = (payload: TokenPayload, ttlSecs: number): string => {
  return sign(payload as object, JWT_SECRET, { expiresIn: ttlSecs })
}

/**
 * Verifica e descodifica um JWT.
 * Retorna null se inválido, expirado, ou com payload malformado.
 *
 * @example
 * const p = verifyToken(token)
 * if (!p || p.type !== 'staff') return unauthorized()
 * // p.staffId está disponível aqui
 */
export const verifyToken = (token: string): TokenPayload | null => {
  if (!token) return null
  try {
    const decoded = jwtVerify(token, JWT_SECRET) as RawPayload
    if (!decoded || typeof decoded === 'string') return null

    // Validar shape do payload consoante o type
    if (
      (decoded.type === 'user' || decoded.type === 'user_refresh') &&
      typeof decoded.userId === 'string'
    ) {
      return { type: decoded.type, userId: decoded.userId }
    }

    if (
      (decoded.type === 'staff' || decoded.type === 'staff_refresh') &&
      typeof decoded.staffId === 'string'
    ) {
      return { type: decoded.type, staffId: decoded.staffId }
    }

    return null
  } catch {
    return null
  }
}


// Compat — mantém generateToken/generateRefreshToken
// para código legacy que ainda os use.
// Deprecar após migração completa.


/** @deprecated Usar signToken({ userId, type: 'user' }, ttl) */
export const generateToken = (userId: string): string =>
  signToken({ userId, type: 'user' }, 7 * 24 * 3600)

/** @deprecated Usar signToken({ userId, type: 'user_refresh' }, ttl) */
export const generateRefreshToken = (userId: string): string =>
  signToken({ userId, type: 'user_refresh' }, 30 * 24 * 3600)