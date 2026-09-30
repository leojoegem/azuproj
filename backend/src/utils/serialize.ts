import { Prisma } from '@prisma/client'

export function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return null
  return Number(value)
}

export function stripSecrets<T extends { passwordHash?: string }>(record: T) {
  const clone = { ...record }
  delete clone.passwordHash
  return clone
}
