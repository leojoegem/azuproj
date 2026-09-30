import { Prisma } from '@prisma/client'
import { prisma } from '../config/database'

export async function summary() {
  const groups = await prisma.device.groupBy({
    by: ['status'],
    where: { deletedAt: null },
    _count: { _all: true },
  })
  const count = (status: string) => groups.find((group) => group.status === status)?._count._all ?? 0
  const totalDevices = groups.reduce((sum, group) => sum + group._count._all, 0)
  return {
    totalDevices,
    underAssessment: count('UNDER_ASSESSMENT'),
    assessmentComplete: count('ASSESSMENT_COMPLETE'),
    awaitingSanitization: count('AWAITING_SANITIZATION'),
    sanitizationInProgress: count('SANITIZATION_IN_PROGRESS'),
    sanitized: count('SANITIZED'),
    awaitingDisposition: count('AWAITING_DISPOSITION'),
    disposed: count('DISPOSED'),
    recycled: count('RECYCLED'),
    scrapped: count('SCRAPPED'),
    redeployed: count('REDEPLOYED'),
    onHold: count('ON_HOLD'),
    received: count('RECEIVED'),
  }
}

export async function deviceStatus() {
  const groups = await prisma.device.groupBy({
    by: ['status'],
    where: { deletedAt: null },
    _count: { _all: true },
  })
  return groups.map((group) => ({ status: group.status, count: group._count._all }))
}

export async function dispositionSummary() {
  const groups = await prisma.disposition.groupBy({
    by: ['dispositionType'],
    where: { status: 'COMPLETED', device: { deletedAt: null } },
    _count: { _all: true },
    _sum: { salePrice: true },
  })
  return groups.map((group) => ({
    dispositionType: group.dispositionType,
    count: group._count._all,
    saleValue: group._sum.salePrice ? Number(group._sum.salePrice) : 0,
  }))
}

export async function monthlyActivity() {
  const since = new Date()
  since.setUTCMonth(since.getUTCMonth() - 11)
  since.setUTCDate(1)
  since.setUTCHours(0, 0, 0, 0)

  const [devices, assessments, sanitizations, dispositions] = await Promise.all([
    prisma.$queryRaw<{ month: Date; count: number }[]>(Prisma.sql`
      SELECT date_trunc('month', "createdAt") AS month, COUNT(*)::int AS count
      FROM "Device"
      WHERE "deletedAt" IS NULL AND "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `),
    prisma.$queryRaw<{ month: Date; count: number }[]>(Prisma.sql`
      SELECT date_trunc('month', "completedAt") AS month, COUNT(*)::int AS count
      FROM "Assessment"
      WHERE "completedAt" IS NOT NULL AND "completedAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `),
    prisma.$queryRaw<{ month: Date; count: number }[]>(Prisma.sql`
      SELECT date_trunc('month', "updatedAt") AS month, COUNT(*)::int AS count
      FROM "SanitizationRecord"
      WHERE status = 'PASSED' AND "updatedAt" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `),
    prisma.$queryRaw<{ month: Date; count: number }[]>(Prisma.sql`
      SELECT date_trunc('month', "dispositionDate") AS month, COUNT(*)::int AS count
      FROM "Disposition"
      WHERE status = 'COMPLETED' AND "dispositionDate" IS NOT NULL AND "dispositionDate" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `),
  ])

  const key = (value: Date) => value.toISOString().slice(0, 7)
  const months: string[] = []
  const cursor = new Date(since)
  for (let i = 0; i < 12; i += 1) {
    months.push(cursor.toISOString().slice(0, 7))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  const lookup = (rows: { month: Date; count: number }[]) =>
    new Map(rows.filter((row) => row.month).map((row) => [key(new Date(row.month)), row.count]))
  const deviceMap = lookup(devices)
  const assessmentMap = lookup(assessments)
  const sanitizationMap = lookup(sanitizations)
  const dispositionMap = lookup(dispositions)

  return months.map((month) => ({
    month,
    devicesReceived: deviceMap.get(month) ?? 0,
    assessments: assessmentMap.get(month) ?? 0,
    sanitizationsPassed: sanitizationMap.get(month) ?? 0,
    dispositionsCompleted: dispositionMap.get(month) ?? 0,
  }))
}
