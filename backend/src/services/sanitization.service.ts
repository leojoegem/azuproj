import type { Prisma, Role } from '@prisma/client'
import { prisma } from '../config/database'
import { recordAudit } from './audit.service'
import {
  assertCanApproveSanitization,
  assertCanStartSanitization,
  deviceStatusAfterVerification,
} from './workflow'
import { AppError } from '../utils/errors'
import { pageMeta, paginate } from '../utils/pagination'
import type { RequestContext } from '../utils/request-context'
import type { z } from 'zod'
import type { listSanitizationSchema, startSanitizationSchema, verifySanitizationSchema } from '../schemas/sanitization.schema'

type Actor = { id: string; role: Role }
type StartInput = z.infer<typeof startSanitizationSchema>
type VerifyInput = z.infer<typeof verifySanitizationSchema>
type ListInput = z.infer<typeof listSanitizationSchema>

async function latestCompletedAssessment(tx: Prisma.TransactionClient, deviceId: string) {
  return tx.assessment.findFirst({
    where: { deviceId, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
  })
}

export async function approveSanitization(deviceId: string, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const device = await tx.device.findFirst({ where: { id: deviceId, deletedAt: null } })
    if (!device) throw new AppError(404, 'Device not found.')
    const assessment = await latestCompletedAssessment(tx, deviceId)
    if (!assessment) throw new AppError(422, 'A device cannot be sanitized before an assessment is completed.')
    assertCanApproveSanitization(device.status, assessment.sanitizationRequired)
    const updated = await tx.device.update({
      where: { id: deviceId },
      data: { status: 'AWAITING_SANITIZATION' },
    })
    await recordAudit(tx, {
      action: 'SANITIZATION_APPROVED',
      entityType: 'DEVICE',
      entityId: deviceId,
      oldValue: { status: device.status },
      newValue: { status: updated.status },
      context,
    })
    return updated
  })
}

export async function startSanitization(input: StartInput, actor: Actor, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const device = await tx.device.findFirst({ where: { id: input.deviceId, deletedAt: null } })
    if (!device) throw new AppError(404, 'Device not found.')
    const assessment = await latestCompletedAssessment(tx, input.deviceId)
    if (!assessment?.sanitizationRequired) {
      throw new AppError(422, 'A device cannot be sanitized unless it has been approved for sanitization.')
    }
    assertCanStartSanitization(device.status)
    const open = await tx.sanitizationRecord.findFirst({
      where: { deviceId: device.id, status: 'IN_PROGRESS' },
    })
    if (open) throw new AppError(409, 'Sanitization is already in progress for this device.')

    const record = await tx.sanitizationRecord.create({
      data: {
        deviceId: device.id,
        performedById: actor.id,
        method: input.method,
        software: input.software,
        softwareVersion: input.softwareVersion,
        driveType: input.driveType,
        driveIdentifier: input.driveIdentifier,
        notes: input.notes,
        sanitizationDate: input.sanitizationDate ?? new Date(),
        status: 'IN_PROGRESS',
        verificationResult: 'PENDING',
      },
    })
    await tx.device.update({ where: { id: device.id }, data: { status: 'SANITIZATION_IN_PROGRESS' } })
    await recordAudit(tx, {
      action: 'SANITIZATION_STARTED',
      entityType: 'SANITIZATION',
      entityId: record.id,
      newValue: record,
      context,
    })
    return record
  })
}

export async function verifySanitization(id: string, input: VerifyInput, actor: Actor, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.sanitizationRecord.findUnique({ where: { id }, include: { device: true } })
    if (!record || record.device.deletedAt) throw new AppError(404, 'Sanitization record not found.')
    if (record.status !== 'IN_PROGRESS') {
      throw new AppError(422, 'Only an in-progress sanitization can be verified.')
    }
    if (input.verificationResult === 'FAILED' && !input.notes?.trim()) {
      throw new AppError(422, 'Failed verification requires notes describing the result.', [
        { field: 'notes', message: 'Notes are required when verification fails.' },
      ])
    }

    let certificateFile = record.certificateFile
    if (input.verificationResult === 'PASSED') {
      if (!input.documentId) {
        throw new AppError(422, 'Sanitization evidence is required before a device can be marked sanitized.', [
          { field: 'documentId', message: 'Upload a certificate or evidence file first.' },
        ])
      }
      const document = await tx.document.findFirst({
        where: { id: input.documentId, entityType: 'SANITIZATION', entityId: record.id },
      })
      if (!document) {
        throw new AppError(422, 'The evidence file is not attached to this sanitization record.')
      }
      certificateFile = document.storagePath
    }

    const passed = input.verificationResult === 'PASSED'
    const certificateNumber = passed
      ? input.certificateNumber ?? `SAN-${new Date().getFullYear()}-${record.id.slice(-8).toUpperCase()}`
      : record.certificateNumber

    const updated = await tx.sanitizationRecord.update({
      where: { id },
      data: {
        verifiedById: actor.id,
        verificationMethod: input.verificationMethod,
        verificationResult: input.verificationResult,
        status: passed ? 'PASSED' : 'FAILED',
        notes: input.notes ?? record.notes,
        certificateNumber,
        certificateFile,
        sanitizationDate: record.sanitizationDate ?? new Date(),
      },
    })
    const device = await tx.device.update({
      where: { id: record.deviceId },
      data: { status: deviceStatusAfterVerification(passed) },
    })
    await recordAudit(tx, {
      action: passed ? 'SANITIZATION_COMPLETED' : 'SANITIZATION_VERIFIED',
      entityType: 'SANITIZATION',
      entityId: id,
      oldValue: { status: record.status, verificationResult: record.verificationResult },
      newValue: {
        status: updated.status,
        verificationResult: updated.verificationResult,
        deviceStatus: device.status,
        certificateNumber: updated.certificateNumber,
      },
      context,
    })
    return updated
  })
}

export async function listSanitization(input: ListInput) {
  const paging = paginate(input.page, input.limit)
  const where: Prisma.SanitizationRecordWhereInput = {
    deviceId: input.deviceId,
    status: input.status,
    device: { deletedAt: null },
  }
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

export async function getSanitization(id: string) {
  const row = await prisma.sanitizationRecord.findFirst({
    where: { id, device: { deletedAt: null } },
  })
  if (!row) throw new AppError(404, 'Sanitization record not found.')
  return row
}
