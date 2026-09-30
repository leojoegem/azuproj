import crypto from 'crypto'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from './env'
import type { Role } from '@prisma/client'

export interface AccessTokenPayload {
  sub: string
  email: string
  role: Role
  type: 'access'
}

export interface RefreshTokenPayload {
  sub: string
  jti: string
  type: 'refresh'
}

export function signAccessToken(input: { id: string; email: string; role: Role }) {
  const payload: AccessTokenPayload = {
    sub: input.id,
    email: input.email,
    role: input.role,
    type: 'access',
  }
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] }
  return jwt.sign(payload, env.JWT_SECRET, options)
}

export function signRefreshToken(userId: string) {
  const jti = crypto.randomUUID()
  const payload: RefreshTokenPayload = { sub: userId, jti, type: 'refresh' }
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] }
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, options)
  const decoded = jwt.decode(token) as { exp: number }
  return { token, jti, expiresAt: new Date(decoded.exp * 1000) }
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload
  if (payload.type !== 'access') {
    throw new jwt.JsonWebTokenError('Invalid access token')
  }
  return payload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
  if (payload.type !== 'refresh') {
    throw new jwt.JsonWebTokenError('Invalid refresh token')
  }
  return payload
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
