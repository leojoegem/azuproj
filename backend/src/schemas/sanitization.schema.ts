import { z } from 'zod'
import { paginationSchema } from './common'

export const startSanitizationSchema = z.object({
  deviceId: z.string().cuid(),
  method: z.enum([
    'NIST_800_88_CLEAR',
    'NIST_800_88_PURGE',
    'CRYPTO_ERASE',
    'SECURE_ERASE',
    'PHYSICAL_DESTRUCTION',
    'OTHER',
  ]),
  software: z.string().trim().min(2).max(120),
  softwareVersion: z.string().trim().min(1).max(40),
  driveType: z.string().trim().min(2).max(40),
  driveIdentifier: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(4000).optional(),
  sanitizationDate: z.coerce.date().optional(),
})

export const verifySanitizationSchema = z.object({
  verificationMethod: z.string().trim().min(2).max(120),
  verificationResult: z.enum(['PASSED', 'FAILED']),
  notes: z.string().trim().max(4000).optional(),
  certificateNumber: z.string().trim().min(4).max(64).optional(),
  documentId: z.string().cuid().optional(),
})

export const listSanitizationSchema = paginationSchema.extend({
  deviceId: z.string().cuid().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED']).optional(),
})
