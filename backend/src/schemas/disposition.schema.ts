import { z } from 'zod'
import { paginationSchema } from './common'

const dispositionType = z.enum([
  'REDEPLOYED',
  'DONATED',
  'SOLD',
  'RECYCLED',
  'SCRAPPED',
  'RETURNED',
  'DESTROYED',
])

export const createDispositionSchema = z.object({
  deviceId: z.string().cuid(),
  dispositionType,
  recipientName: z.string().trim().max(160).optional(),
  recipientOrganization: z.string().trim().max(160).optional(),
  recipientContact: z.string().trim().max(160).optional(),
  salePrice: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  notes: z.string().trim().max(4000).optional(),
  documentId: z.string().cuid().optional(),
})

export const completeDispositionSchema = z.object({
  referenceNumber: z.string().trim().min(3).max(64),
  dispositionDate: z.coerce.date().optional(),
  recipientName: z.string().trim().max(160).optional(),
  recipientOrganization: z.string().trim().max(160).optional(),
  recipientContact: z.string().trim().max(160).optional(),
  salePrice: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().length(3).optional(),
  notes: z.string().trim().max(4000).optional(),
  documentId: z.string().cuid().optional(),
})

export const listDispositionSchema = paginationSchema.extend({
  deviceId: z.string().cuid().optional(),
  status: z.enum(['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
  dispositionType: dispositionType.optional(),
})
