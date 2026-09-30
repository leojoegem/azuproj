import type { Prisma } from '@prisma/client'
import { prisma } from '../config/database'
import { recordAudit } from './audit.service'
import {
  assertReadyForDisposition,
  dispositionNeedsDestructionEvidence,
  dispositionNeedsRecipient,
  terminalStatusForDisposition,
} from './workflow'
import { AppError } from '../utils/errors'
import { pageMeta, paginate } from '../utils/pagination'
import { decimalToNumber } from '../utils/serialize'
import type { RequestContext } from '../utils/request-context'
import type { z } from 'zod'
import type {
  completeDispositionSchema,
  createDispositionSchema,
  listDispositionSchema,
} from '../schemas/disposition.schema'

type CreateInput = z.infer<typeof createDispositionSchema>
type CompleteInput = z.infer<typeof completeDispositionSchema>
type ListInput = z.infer<typeof listDispositionSchema>

function serialize<T extends { salePrice: Prisma.Decimal | null }>(row: T) {
  return { ...row, salePrice: decimalToNumber(row.salePrice) }
}

async function readiness(tx: Prisma.TransactionClient, deviceId: string) {
  const device = await tx.device.findFirst({ where: { id: deviceId, deletedAt: null } })
  if (!device) throw new AppError(404, 'Device not found.')
  const assessment = await tx.assessment.findFirst({
    where: { deviceId, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
  })
  const passed = await tx.sanitizationRecord.findFirst({
    where: { deviceId, status: 'PASSED' },
  })
  assertReadyForDisposition({
    hasCompletedAssessment: Boolean(assessment),
    sanitizationRequired: Boolean(assessment?.sanitizationRequired),
    sanitizationPassed: Boolean(passed),
    status: device.status,
  })
  return device
}

export async function createDisposition(input: CreateInput, approverId: string | null, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const device = await readiness(tx, input.deviceId)
    const open = await tx.disposition.findFirst({
      where: { deviceId: device.id, status: { in: ['DRAFT', 'APPROVED', 'IN_PROGRESS'] } },
    })
    if (open) throw new AppError(409, 'This device already has an open disposition.')
    const approved = Boolean(approverId)
    const row = await tx.disposition.create({
      data: {
        deviceId: device.id,
        dispositionType: input.dispositionType,
        recipientName: input.recipientName,
        recipientOrganization: input.recipientOrganization,
        recipientContact: input.recipientContact,
        salePrice: input.salePrice,
        currency: input.currency?.toUpperCase() ?? 'KES',
        notes: input.notes,
        supportingDocument: input.documentId,
        status: approved ? 'APPROVED' : 'DRAFT',
        approvedById: approverId,
      },
    })
    if (device.status === 'SANITIZED') {
      await tx.device.update({ where: { id: device.id }, data: { status: 'AWAITING_DISPOSITION' } })
    }
    await recordAudit(tx, {
      action: approved ? 'DISPOSITION_APPROVED' : 'DISPOSITION_CREATED',
      entityType: 'DISPOSITION',
      entityId: row.id,
      newValue: serialize(row),
      context,
    })
    return serialize(row)
  })
}

export async function approveDisposition(id: string, approverId: string, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.disposition.findUnique({ where: { id }, include: { device: true } })
    if (!existing || existing.device.deletedAt) throw new AppError(404, 'Disposition not found.')
    if (existing.status !== 'DRAFT') throw new AppError(422, 'Only a draft disposition can be approved.')
    const row = await tx.disposition.update({
      where: { id },
      data: { status: 'APPROVED', approvedById: approverId },
    })
    if (existing.device.status === 'SANITIZED') {
      await tx.device.update({ where: { id: existing.deviceId }, data: { status: 'AWAITING_DISPOSITION' } })
    }
    await recordAudit(tx, {
      action: 'DISPOSITION_APPROVED',
      entityType: 'DISPOSITION',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: row.status },
      context,
    })
    return serialize(row)
  })
}

export async function rejectDisposition(id: string, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.disposition.findUnique({ where: { id } })
    if (!existing) throw new AppError(404, 'Disposition not found.')
    if (existing.status !== 'DRAFT' && existing.status !== 'APPROVED') {
      throw new AppError(422, 'This disposition can no longer be rejected.')
    }
    const row = await tx.disposition.update({ where: { id }, data: { status: 'REJECTED' } })
    await tx.device.update({ where: { id: existing.deviceId }, data: { status: 'ON_HOLD' } })
    await recordAudit(tx, {
      action: 'DISPOSITION_REJECTED',
      entityType: 'DISPOSITION',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: 'REJECTED', deviceStatus: 'ON_HOLD' },
      context,
    })
    return serialize(row)
  })
}

export async function completeDisposition(
  id: string,
  input: CompleteInput,
  actorId: string,
  context: RequestContext,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.disposition.findUnique({ where: { id }, include: { device: true } })
    if (!existing || existing.device.deletedAt) throw new AppError(404, 'Disposition not found.')
    if (existing.status !== 'APPROVED') {
      throw new AppError(422, 'Disposition must be approved before it can be completed.')
    }
    const recipientName = input.recipientName ?? existing.recipientName
    const salePrice = input.salePrice ?? decimalToNumber(existing.salePrice)
    if (dispositionNeedsRecipient(existing.dispositionType) && !recipientName) {
      throw new AppError(422, 'Recipient details are required for this disposition.', [
        { field: 'recipientName', message: 'Recipient name is required.' },
      ])
    }
    if (existing.dispositionType === 'SOLD' && (salePrice == null || salePrice < 0)) {
      throw new AppError(422, 'A sale price is required when a device is sold.', [
        { field: 'salePrice', message: 'Sale price is required.' },
      ])
    }
    let supportingDocument = existing.supportingDocument
    if (input.documentId) {
      const document = await tx.document.findFirst({
        where: { id: input.documentId, entityType: 'DISPOSITION', entityId: id },
      })
      if (!document) throw new AppError(422, 'The supporting document is not attached to this disposition.')
      supportingDocument = document.id
    }
    if (dispositionNeedsDestructionEvidence(existing.dispositionType) && !supportingDocument) {
      throw new AppError(422, 'Destruction or scrap disposition requires a supporting document.', [
        { field: 'documentId', message: 'Upload the destruction or recycling certificate first.' },
      ])
    }

    const terminal = terminalStatusForDisposition(existing.dispositionType)
    const row = await tx.disposition.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedById: actorId,
        referenceNumber: input.referenceNumber,
        dispositionDate: input.dispositionDate ?? new Date(),
        recipientName,
        recipientOrganization: input.recipientOrganization ?? existing.recipientOrganization,
        recipientContact: input.recipientContact ?? existing.recipientContact,
        salePrice: salePrice ?? undefined,
        currency: input.currency?.toUpperCase() ?? existing.currency,
        notes: input.notes ?? existing.notes,
        supportingDocument,
      },
    })
    await tx.device.update({ where: { id: existing.deviceId }, data: { status: terminal } })
    await recordAudit(tx, {
      action: 'DISPOSITION_COMPLETED',
      entityType: 'DISPOSITION',
      entityId: id,
      oldValue: { status: existing.status, deviceStatus: existing.device.status },
      newValue: { status: 'COMPLETED', deviceStatus: terminal, referenceNumber: row.referenceNumber },
      context,
    })
    return serialize(row)
  })
}

export async function listDispositions(input: ListInput) {
  const paging = paginate(input.page, input.limit)
  const where: Prisma.DispositionWhereInput = {
    deviceId: input.deviceId,
    status: input.status,
    dispositionType: input.dispositionType,
    device: { deletedAt: null },
  }
  const [total, rows] = await prisma.$transaction([
    prisma.disposition.count({ where }),
    prisma.disposition.findMany({
      where,
      orderBy: { createdAt: input.sortOrder },
      skip: paging.skip,
      take: paging.take,
    }),
  ])
  return { items: rows.map(serialize), ...pageMeta(paging.page, paging.limit, total) }
}

export async function getDisposition(id: string) {
  const row = await prisma.disposition.findFirst({ where: { id, device: { deletedAt: null } } })
  if (!row) throw new AppError(404, 'Disposition not found.')
  return serialize(row)
}
