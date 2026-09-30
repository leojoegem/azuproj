import type { Role } from '@prisma/client'
import { prisma } from '../config/database'
import { recordAudit } from './audit.service'
import { AppError } from '../utils/errors'
import { hashPassword } from '../utils/password'
import { stripSecrets } from '../utils/serialize'
import type { RequestContext } from '../utils/request-context'

export async function createUser(
  input: { email: string; name: string; password: string; role: Role },
  context: RequestContext,
) {
  const email = input.email.toLowerCase()
  const passwordHash = await hashPassword(input.password)
  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, name: input.name, passwordHash, role: input.role },
      })
      await recordAudit(tx, {
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: created.id,
        newValue: { email, name: input.name, role: input.role },
        context,
      })
      return created
    })
    return stripSecrets(user)
  } catch (error) {
    if (isUnique(error)) throw new AppError(409, 'A user with this email already exists.')
    throw error
  }
}

export async function listUsers() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  return users.map((user) => stripSecrets(user))
}

export async function updateUser(
  id: string,
  input: { name?: string; role?: Role },
  context: RequestContext,
) {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'User not found.')
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: { name: input.name, role: input.role },
    })
    await recordAudit(tx, {
      action: 'USER_UPDATED',
      entityType: 'USER',
      entityId: id,
      oldValue: { name: existing.name, role: existing.role },
      newValue: { name: updated.name, role: updated.role },
      context,
    })
    return updated
  })
  return stripSecrets(user)
}

export async function disableUser(id: string, actorId: string, context: RequestContext) {
  if (id === actorId) throw new AppError(422, 'You cannot disable your own account.')
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) throw new AppError(404, 'User not found.')
  if (existing.disabledAt) throw new AppError(409, 'User is already disabled.')
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id }, data: { disabledAt: new Date() } })
    await tx.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    await recordAudit(tx, {
      action: 'USER_DISABLED',
      entityType: 'USER',
      entityId: id,
      oldValue: { disabledAt: null },
      newValue: { disabledAt: updated.disabledAt },
      context,
    })
    return updated
  })
  return stripSecrets(user)
}

function isUnique(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  )
}
