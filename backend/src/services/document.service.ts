import type { EntityType, Role } from '@prisma/client'
import { prisma } from '../config/database'
import { recordAudit } from './audit.service'
import { displayFileName, storage } from './storage.service'
import { AppError } from '../utils/errors'
import type { RequestContext } from '../utils/request-context'

const writers: Record<string, Role[]> = {
  DEVICE: ['ADMIN', 'ASSESSOR'],
  ASSESSMENT: ['ADMIN', 'ASSESSOR'],
  SANITIZATION: ['ADMIN', 'SANITIZATION_OFFICER'],
  DISPOSITION: ['ADMIN', 'DISPOSITION_OFFICER'],
}

export async function uploadDocument(
  input: { entityType: EntityType; entityId: string; file: Express.Multer.File },
  actor: { id: string; role: Role },
  context: RequestContext,
) {
  if (!writers[input.entityType]?.includes(actor.role)) {
    throw new AppError(403, 'You do not have permission to upload this evidence.')
  }
  await assertEntity(input.entityType, input.entityId)
  const stored = await storage.put({
    buffer: input.file.buffer,
    contentType: input.file.mimetype,
    entityType: input.entityType,
    entityId: input.entityId,
  })
  const document = await prisma.$transaction(async (tx) => {
    const created = await tx.document.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        fileName: displayFileName(input.file.originalname),
        fileType: input.file.mimetype,
        fileSize: input.file.size,
        storagePath: stored.storagePath,
        uploadedById: actor.id,
      },
    })
    await recordAudit(tx, {
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: created.id,
      newValue: {
        fileName: created.fileName,
        fileType: created.fileType,
        fileSize: created.fileSize,
        parentType: input.entityType,
        parentId: input.entityId,
      },
      context,
    })
    return created
  })
  return document
}

export async function listDocuments(entityType: EntityType, entityId: string) {
  await assertEntity(entityType, entityId)
  return prisma.document.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      uploadedById: true,
      createdAt: true,
    },
  })
}

export async function readDocument(id: string) {
  const document = await prisma.document.findUnique({ where: { id } })
  if (!document) throw new AppError(404, 'Document not found.')
  const buffer = await storage.read(document.storagePath)
  return { document, buffer }
}

async function assertEntity(entityType: EntityType, entityId: string) {
  if (entityType === 'DEVICE') {
    const row = await prisma.device.findFirst({ where: { id: entityId, deletedAt: null } })
    if (!row) throw new AppError(404, 'Device not found.')
    return
  }
  if (entityType === 'ASSESSMENT') {
    const row = await prisma.assessment.findUnique({ where: { id: entityId } })
    if (!row) throw new AppError(404, 'Assessment not found.')
    return
  }
  if (entityType === 'SANITIZATION') {
    const row = await prisma.sanitizationRecord.findUnique({ where: { id: entityId } })
    if (!row) throw new AppError(404, 'Sanitization record not found.')
    return
  }
  const row = await prisma.disposition.findUnique({ where: { id: entityId } })
  if (!row) throw new AppError(404, 'Disposition not found.')
}
