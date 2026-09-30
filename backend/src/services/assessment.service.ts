import type { Prisma, Role } from '@prisma/client'
import { prisma } from '../config/database'
import { recordAudit } from './audit.service'
import { deviceVisibilityWhere } from './device.service'
import { assertCanStartAssessment, resolveSanitizationRequired, statusAfterAssessment } from './workflow'
import { AppError } from '../utils/errors'
import { pageMeta, paginate } from '../utils/pagination'
import { decimalToNumber } from '../utils/serialize'
import type { RequestContext } from '../utils/request-context'
import type { z } from 'zod'
import type { createAssessmentSchema, listAssessmentSchema, updateAssessmentSchema } from '../schemas/assessment.schema'

type CreateInput = z.infer<typeof createAssessmentSchema>
type UpdateInput = z.infer<typeof updateAssessmentSchema>
type ListInput = z.infer<typeof listAssessmentSchema>
type Actor = { id: string; role: Role }

function serialize(row: {
  estimatedRepairCost: Prisma.Decimal | null
  estimatedMarketValue: Prisma.Decimal | null
}) {
  return {
    ...row,
    estimatedRepairCost: decimalToNumber(row.estimatedRepairCost),
    estimatedMarketValue: decimalToNumber(row.estimatedMarketValue),
  }
}

export async function createAssessment(input: CreateInput, actor: Actor, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const device = await tx.device.findFirst({
      where: { id: input.deviceId, deletedAt: null, ...deviceVisibilityWhere(actor) },
    })
    if (!device) throw new AppError(404, 'Device not found.')
    assertCanStartAssessment(device.status)
    const open = await tx.assessment.findFirst({
      where: { deviceId: device.id, completedAt: null },
    })
    if (open) throw new AppError(409, 'This device already has an assessment in progress.')

    const sanitizationRequired = resolveSanitizationRequired(input.recommendation, input.sanitizationRequired)
    const assessment = await tx.assessment.create({
      data: {
        ...input,
        assessorId: actor.id,
        assessmentDate: input.assessmentDate ?? new Date(),
        sanitizationRequired,
        completedAt: null,
      },
    })
    const updated = await tx.device.update({
      where: { id: device.id },
      data: { status: 'UNDER_ASSESSMENT', currentCondition: input.physicalCondition },
    })
    await recordAudit(tx, {
      action: 'ASSESSMENT_CREATED',
      entityType: 'ASSESSMENT',
      entityId: assessment.id,
      newValue: serialize(assessment),
      context,
    })
    await recordAudit(tx, {
      action: 'DEVICE_UPDATED',
      entityType: 'DEVICE',
      entityId: device.id,
      oldValue: { status: device.status },
      newValue: { status: updated.status },
      context,
    })
    return serialize(assessment)
  })
}

export async function updateAssessment(id: string, input: UpdateInput, actor: Actor, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.assessment.findUnique({ where: { id }, include: { device: true } })
    if (!existing || existing.device.deletedAt) throw new AppError(404, 'Assessment not found.')
    if (existing.completedAt) throw new AppError(422, 'Completed assessments cannot be modified.')
    if (actor.role !== 'ADMIN' && existing.assessorId !== actor.id) {
      throw new AppError(403, 'You do not have permission to perform this action.')
    }
    const recommendation = input.recommendation ?? existing.recommendation
    const sanitizationRequired = resolveSanitizationRequired(
      recommendation,
      input.sanitizationRequired ?? existing.sanitizationRequired,
    )
    const assessment = await tx.assessment.update({
      where: { id },
      data: { ...input, sanitizationRequired },
    })
    await recordAudit(tx, {
      action: 'ASSESSMENT_UPDATED',
      entityType: 'ASSESSMENT',
      entityId: id,
      oldValue: serialize(existing),
      newValue: serialize(assessment),
      context,
    })
    return serialize(assessment)
  })
}

export async function completeAssessment(id: string, actor: Actor, context: RequestContext) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.assessment.findUnique({ where: { id }, include: { device: true } })
    if (!existing || existing.device.deletedAt) throw new AppError(404, 'Assessment not found.')
    if (existing.completedAt) throw new AppError(409, 'Assessment is already complete.')
    if (actor.role !== 'ADMIN' && existing.assessorId !== actor.id) {
      throw new AppError(403, 'You do not have permission to perform this action.')
    }
    if (existing.device.status !== 'UNDER_ASSESSMENT') {
      throw new AppError(422, `Assessment cannot be completed while the device is ${existing.device.status}.`)
    }
    const nextStatus = statusAfterAssessment(existing.recommendation, existing.sanitizationRequired)
    const assessment = await tx.assessment.update({
      where: { id },
      data: { completedAt: new Date() },
    })
    await tx.device.update({
      where: { id: existing.deviceId },
      data: { status: nextStatus, currentCondition: existing.physicalCondition },
    })
    await recordAudit(tx, {
      action: 'ASSESSMENT_UPDATED',
      entityType: 'ASSESSMENT',
      entityId: id,
      oldValue: { completedAt: null },
      newValue: { completedAt: assessment.completedAt, deviceStatus: nextStatus },
      context,
    })
    return serialize(assessment)
  })
}

export async function listAssessments(input: ListInput, actor: Actor) {
  const paging = paginate(input.page, input.limit)
  const where: Prisma.AssessmentWhereInput = {
    deviceId: input.deviceId,
    assessorId: actor.role === 'ASSESSOR' ? actor.id : input.assessorId,
    recommendation: input.recommendation,
    device: { deletedAt: null, ...deviceVisibilityWhere(actor) },
  }
  const [total, rows] = await prisma.$transaction([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({
      where,
      orderBy: { createdAt: input.sortOrder },
      skip: paging.skip,
      take: paging.take,
    }),
  ])
  return { items: rows.map(serialize), ...pageMeta(paging.page, paging.limit, total) }
}

export async function getAssessment(id: string, actor: Actor) {
  const row = await prisma.assessment.findFirst({
    where: { id, device: { deletedAt: null, ...deviceVisibilityWhere(actor) } },
  })
  if (!row) throw new AppError(404, 'Assessment not found.')
  if (actor.role === 'ASSESSOR' && row.assessorId !== actor.id) {
    throw new AppError(404, 'Assessment not found.')
  }
  return serialize(row)
}
