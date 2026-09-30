import { AuditAction, EntityType, Prisma } from '@prisma/client'
import { prisma } from '../config/database'
import type { RequestContext } from '../utils/request-context'

type Db = Prisma.TransactionClient | typeof prisma

function safeJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined
  const json = JSON.parse(
    JSON.stringify(value, (key, nested) => {
      if (key === 'passwordHash' || key === 'password' || key === 'tokenHash') return undefined
      if (typeof nested === 'bigint') return nested.toString()
      return nested
    }),
  ) as Prisma.InputJsonValue
  return json
}

export async function recordAudit(
  db: Db,
  input: {
    action: AuditAction
    entityType: EntityType
    entityId: string
    oldValue?: unknown
    newValue?: unknown
    context?: RequestContext
  },
) {
  await db.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      oldValue: safeJson(input.oldValue),
      newValue: safeJson(input.newValue),
      userId: input.context?.userId,
      ipAddress: input.context?.ipAddress,
      userAgent: input.context?.userAgent,
    },
  })
}
