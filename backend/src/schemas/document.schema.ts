import { z } from 'zod'

export const uploadDocumentSchema = z.object({
  entityType: z.enum(['DEVICE', 'ASSESSMENT', 'SANITIZATION', 'DISPOSITION']),
  entityId: z.string().cuid(),
})

export const listDocumentSchema = z.object({
  entityType: z.enum(['DEVICE', 'ASSESSMENT', 'SANITIZATION', 'DISPOSITION']),
  entityId: z.string().cuid(),
})
