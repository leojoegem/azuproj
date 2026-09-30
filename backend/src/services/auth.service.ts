import type { Role } from '@prisma/client'
import { prisma } from '../config/database'
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/auth'
import { recordAudit } from './audit.service'
import { createUser } from './user.service'
import { AppError } from '../utils/errors'
import { hashPassword, verifyPassword } from '../utils/password'
import { stripSecrets } from '../utils/serialize'
import type { RequestContext } from '../utils/request-context'

const INVALID = 'Invalid email or password.'

async function issueSession(user: { id: string; email: string; name: string; role: Role }) {
  const accessToken = signAccessToken(user)
  const refresh = signRefreshToken(user.id)
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refresh.token),
      expiresAt: refresh.expiresAt,
    },
  })
  return {
    accessToken,
    refreshToken: refresh.token,
    expiresIn: process.env.JWT_EXPIRES_IN,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  }
}

export async function login(email: string, password: string, context: RequestContext) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  const matches = user ? await verifyPassword(password, user.passwordHash) : false
  if (!user || !matches || user.disabledAt) {
    await recordAudit(prisma, {
      action: 'LOGIN_FAILED',
      entityType: 'AUTH',
      entityId: user?.id ?? 'unknown',
      newValue: { email: email.toLowerCase() },
      context: { ...context, userId: user?.id },
    })
    throw new AppError(401, user?.disabledAt && matches ? 'This account is disabled.' : INVALID)
  }

  const session = await issueSession(user)
  await recordAudit(prisma, {
    action: 'LOGIN_SUCCESS',
    entityType: 'AUTH',
    entityId: user.id,
    context: { ...context, userId: user.id },
  })
  return session
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string }
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new AppError(401, 'Refresh token is invalid.')
  }
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } })
  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.userId !== payload.sub) {
    throw new AppError(401, 'Refresh token is invalid.')
  }
  const user = await prisma.user.findUnique({ where: { id: stored.userId } })
  if (!user || user.disabledAt) throw new AppError(401, 'Refresh token is invalid.')

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } })
  return issueSession(user)
}

export async function logout(refreshToken: string, context: RequestContext) {
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) } })
  if (stored && !stored.revokedAt) {
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } })
    await recordAudit(prisma, {
      action: 'LOGOUT',
      entityType: 'AUTH',
      entityId: stored.userId,
      context: { ...context, userId: stored.userId },
    })
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  context: RequestContext,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(401, 'Authentication required.')
  const matches = await verifyPassword(currentPassword, user.passwordHash)
  if (!matches) throw new AppError(401, 'Current password is incorrect.')
  const passwordHash = await hashPassword(newPassword)
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { passwordHash } })
    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    await recordAudit(tx, {
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: userId,
      context,
    })
  })
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.disabledAt) throw new AppError(401, 'Authentication required.')
  return stripSecrets(user)
}

export async function register(input: {
  email: string
  name: string
  password: string
  role: Role
}, context: RequestContext) {
  if (!context.userId) throw new AppError(403, 'Public registration is disabled.')
  return createUser(input, context)
}
