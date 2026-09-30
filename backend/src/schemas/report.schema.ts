import { z } from 'zod'
import { paginationSchema } from './common'

export const reportQuerySchema = paginationSchema.extend({
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  status: z.string().trim().max(64).optional(),
})

export const auditQuerySchema = reportQuerySchema.extend({
  action: z.string().trim().max(64).optional(),
  entityType: z.string().trim().max(64).optional(),
  entityId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
})
