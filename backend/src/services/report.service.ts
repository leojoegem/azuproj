import type { Response } from 'express'
import { prisma } from '../config/database'
import { AppError } from '../utils/errors'
import { toCsv } from '../utils/csv'
import { pageMeta, paginate } from '../utils/pagination'
import { decimalToNumber } from '../utils/serialize'

interface ReportQuery {
  page: number
  limit: number
  sortOrder: 'asc' | 'desc'
  format: 'json' | 'csv' | 'pdf'
  createdFrom?: Date
  createdTo?: Date
  status?: string
  action?: string
  entityType?: string
  entityId?: string
  userId?: string
}

function range(input: ReportQuery) {
  if (!input.createdFrom && !input.createdTo) return undefined
  return { gte: input.createdFrom, lte: input.createdTo }
}

export async function deviceReport(input: ReportQuery) {
  const paging = paginate(input.page, input.format === 'json' ? input.limit : 1000)
  const where = { deletedAt: null, createdAt: range(input), status: input.status as never }
  const [total, rows] = await prisma.$transaction([
    prisma.device.count({ where }),
    prisma.device.findMany({ where, orderBy: { createdAt: input.sortOrder }, skip: paging.skip, take: paging.take }),
  ])
  const items = rows.map((row) => ({ ...row, purchasePrice: decimalToNumber(row.purchasePrice) }))
  return { items, ...pageMeta(paging.page, paging.limit, total) }
}

export async function assessmentReport(input: ReportQuery) {
  const paging = paginate(input.page, input.format === 'json' ? input.limit : 1000)
  const where = { createdAt: range(input) }
  const [total, rows] = await prisma.$transaction([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({ where, orderBy: { createdAt: input.sortOrder }, skip: paging.skip, take: paging.take }),
  ])
  const items = rows.map((row) => ({
    ...row,
    estimatedRepairCost: decimalToNumber(row.estimatedRepairCost),
    estimatedMarketValue: decimalToNumber(row.estimatedMarketValue),
  }))
  return { items, ...pageMeta(paging.page, paging.limit, total) }
}

export async function sanitizationReport(input: ReportQuery) {
  const paging = paginate(input.page, input.format === 'json' ? input.limit : 1000)
  const where = { createdAt: range(input), status: input.status as never }
  const [total, items] = await prisma.$transaction([
    prisma.sanitizationRecord.count({ where }),
    prisma.sanitizationRecord.findMany({
      where,
      orderBy: { createdAt: input.sortOrder },
      skip: paging.skip,
      take: paging.take,
    }),
  ])
  return { items, ...pageMeta(paging.page, paging.limit, total) }
}

export async function dispositionReport(input: ReportQuery) {
  const paging = paginate(input.page, input.format === 'json' ? input.limit : 1000)
  const where = { createdAt: range(input), status: input.status as never }
  const [total, rows] = await prisma.$transaction([
    prisma.disposition.count({ where }),
    prisma.disposition.findMany({ where, orderBy: { createdAt: input.sortOrder }, skip: paging.skip, take: paging.take }),
  ])
  return {
    items: rows.map((row) => ({ ...row, salePrice: decimalToNumber(row.salePrice) })),
    ...pageMeta(paging.page, paging.limit, total),
  }
}

export async function auditReport(input: ReportQuery) {
  const paging = paginate(input.page, input.format === 'json' ? input.limit : 1000)
  const where = {
    timestamp: range(input),
    action: input.action as never,
    entityType: input.entityType as never,
    entityId: input.entityId,
    userId: input.userId,
  }
  const [total, items] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: input.sortOrder },
      skip: paging.skip,
      take: paging.take,
    }),
  ])
  return { items, ...pageMeta(paging.page, paging.limit, total) }
}

export function sendReport(
  res: Response,
  filename: string,
  payload: { items: object[] },
  format: ReportQuery['format'],
  message: string,
) {
  if (format === 'pdf') {
    throw new AppError(501, 'PDF export is not enabled. Use format=csv, or register a PDF renderer.')
  }
  if (format === 'csv') {
    const rows = payload.items.map((item) => ({ ...item })) as Record<string, unknown>[]
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`)
    res.status(200).send(toCsv(rows))
    return
  }
  res.status(200).json({ success: true, data: payload, message })
}
