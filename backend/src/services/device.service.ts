import { Prisma, type Device, type Role } from '@prisma/client'
import { prisma } from '../config/database'
import { recordAudit } from './audit.service'
import { AppError } from '../utils/errors'
import { pageMeta, paginate } from '../utils/pagination'
import { decimalToNumber } from '../utils/serialize'
import type { RequestContext } from '../utils/request-context'
import type { z } from 'zod'
import type { createDeviceSchema, listDeviceSchema, updateDeviceSchema } from '../schemas/device.schema'

type Actor = { id: string; role: Role }
type CreateInput = z.infer<typeof createDeviceSchema>
type UpdateInput = z.infer<typeof updateDeviceSchema>
type ListInput = z.infer<typeof listDeviceSchema>

const terminal: Device['status'][] = ['DISPOSED', 'REDEPLOYED', 'RECYCLED', 'SCRAPPED']

export function serializeDevice(device: Device) {
  return { ...device, purchasePrice: decimalToNumber(device.purchasePrice) }
}

export function deviceVisibilityWhere(actor: Actor): Prisma.DeviceWhereInput {
  if (actor.role === 'ADMIN' || actor.role === 'VIEWER') return {}
  if (actor.role === 'ASSESSOR') {
    return {
      OR: [
        { status: { in: ['RECEIVED', 'UNDER_ASSESSMENT', 'ASSESSMENT_COMPLETE', 'ON_HOLD'] } },
        { assessments: { some: { assessorId: actor.id } } },
      ],
    }
  }
  if (actor.role === 'SANITIZATION_OFFICER') {
    return {
      status: { in: ['AWAITING_SANITIZATION', 'SANITIZATION_IN_PROGRESS', 'SANITIZED'] },
    }
  }
  return {
    status: {
      in: ['AWAITING_DISPOSITION', 'DISPOSITION_IN_PROGRESS', 'DISPOSED', 'REDEPLOYED', 'RECYCLED', 'SCRAPPED'],
    },
  }
}

function listWhere(input: ListInput, actor: Actor): Prisma.DeviceWhereInput {
  const visibility = deviceVisibilityWhere(actor)
  const filters: Prisma.DeviceWhereInput[] = [visibility]
  if (!(actor.role === 'ADMIN' && input.includeDeleted === 'true')) {
    filters.push({ deletedAt: null })
  }
  if (input.q) {
    filters.push({
      OR: [
        { assetTag: { contains: input.q, mode: 'insensitive' } },
        { serialNumber: { contains: input.q, mode: 'insensitive' } },
        { manufacturer: { contains: input.q, mode: 'insensitive' } },
        { model: { contains: input.q, mode: 'insensitive' } },
      ],
    })
  }
  if (input.assetTag) filters.push({ assetTag: { contains: input.assetTag, mode: 'insensitive' } })
  if (input.serialNumber) filters.push({ serialNumber: { contains: input.serialNumber, mode: 'insensitive' } })
  if (input.manufacturer) filters.push({ manufacturer: { contains: input.manufacturer, mode: 'insensitive' } })
  if (input.model) filters.push({ model: { contains: input.model, mode: 'insensitive' } })
  if (input.department) filters.push({ department: { equals: input.department, mode: 'insensitive' } })
  if (input.location) filters.push({ location: { equals: input.location, mode: 'insensitive' } })
  if (input.status) filters.push({ status: input.status })
  if (input.condition) filters.push({ currentCondition: input.condition })
  if (input.createdFrom || input.createdTo) {
    filters.push({
      createdAt: {
        gte: input.createdFrom,
        lte: input.createdTo,
      },
    })
  }
  return { AND: filters }
}

export async function createDevice(input: CreateInput, context: RequestContext) {
  const assetTag = input.assetTag.toUpperCase()
  const serialNumber = input.serialNumber.toUpperCase()
  return prisma.$transaction(async (tx) => {
    const clash = await tx.device.findFirst({ where: { OR: [{ assetTag }, { serialNumber }] } })
    if (clash?.assetTag === assetTag) {
      throw new AppError(409, 'A device with this asset tag already exists.')
    }
    if (clash) throw new AppError(409, 'A device with this serial number already exists.')
    const device = await tx.device.create({
      data: {
        ...input,
        assetTag,
        serialNumber,
        purchasePrice: input.purchasePrice,
        status: 'RECEIVED',
      },
    })
    await recordAudit(tx, {
      action: 'DEVICE_CREATED',
      entityType: 'DEVICE',
      entityId: device.id,
      newValue: serializeDevice(device),
      context,
    })
    return serializeDevice(device)
  })
}

export async function listDevices(input: ListInput, actor: Actor) {
  const paging = paginate(input.page, input.limit)
  const where = listWhere(input, actor)
  const [total, rows] = await prisma.$transaction([
    prisma.device.count({ where }),
    prisma.device.findMany({
      where,
      orderBy: { [input.sortBy]: input.sortOrder },
      skip: paging.skip,
      take: paging.take,
    }),
  ])
  return { items: rows.map(serializeDevice), ...pageMeta(paging.page, paging.limit, total) }
}

export async function getDevice(id: string, actor: Actor) {
  const device = await prisma.device.findFirst({
    where: { id, AND: [deviceVisibilityWhere(actor), actor.role === 'ADMIN' ? {} : { deletedAt: null }] },
    include: {
      assessments: { orderBy: { createdAt: 'desc' } },
      sanitizations: { orderBy: { createdAt: 'desc' } },
      dispositions: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!device) throw new AppError(404, 'Device not found.')
  return {
    ...serializeDevice(device),
    assessments: device.assessments.map(serializeAssessmentMoney),
    sanitizations: device.sanitizations,
    dispositions: device.dispositions.map(serializeDispositionMoney),
  }
}

export async function updateDevice(id: string, input: UpdateInput, actor: Actor, context: RequestContext) {
  const existing = await prisma.device.findFirst({
    where: { id, deletedAt: null, ...deviceVisibilityWhere(actor) },
  })
  if (!existing) throw new AppError(404, 'Device not found.')
  if (terminal.includes(existing.status)) {
    throw new AppError(422, 'Completed device records cannot be modified.')
  }
  const device = await prisma.$transaction(async (tx) => {
    const updated = await tx.device.update({ where: { id }, data: input })
    await recordAudit(tx, {
      action: 'DEVICE_UPDATED',
      entityType: 'DEVICE',
      entityId: id,
      oldValue: serializeDevice(existing),
      newValue: serializeDevice(updated),
      context,
    })
    return updated
  })
  return serializeDevice(device)
}

export async function softDeleteDevice(id: string, context: RequestContext) {
  const existing = await prisma.device.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) throw new AppError(404, 'Device not found.')
  const device = await prisma.$transaction(async (tx) => {
    const updated = await tx.device.update({ where: { id }, data: { deletedAt: new Date() } })
    await recordAudit(tx, {
      action: 'DEVICE_SOFT_DELETED',
      entityType: 'DEVICE',
      entityId: id,
      oldValue: { deletedAt: null },
      newValue: { deletedAt: updated.deletedAt },
      context,
    })
    return updated
  })
  return serializeDevice(device)
}

function serializeAssessmentMoney<T extends { estimatedRepairCost: Prisma.Decimal | null; estimatedMarketValue: Prisma.Decimal | null }>(
  row: T,
) {
  return {
    ...row,
    estimatedRepairCost: decimalToNumber(row.estimatedRepairCost),
    estimatedMarketValue: decimalToNumber(row.estimatedMarketValue),
  }
}

function serializeDispositionMoney<T extends { salePrice: Prisma.Decimal | null }>(row: T) {
  return { ...row, salePrice: decimalToNumber(row.salePrice) }
}
