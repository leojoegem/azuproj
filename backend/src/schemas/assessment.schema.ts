import { z } from 'zod'
import { paginationSchema } from './common'

const grade = z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'MISSING', 'FAILED', 'NOT_TESTED'])
const recommendation = z.enum([
  'REDEPLOY',
  'REPAIR',
  'REASSIGN',
  'SANITIZE_AND_REDEPLOY',
  'DONATE',
  'RESELL',
  'RECYCLE',
  'SCRAP',
  'HOLD',
])

export const createAssessmentSchema = z.object({
  deviceId: z.string().cuid(),
  assessmentDate: z.coerce.date().optional(),
  physicalCondition: grade,
  screenCondition: grade,
  keyboardCondition: grade,
  batteryCondition: grade,
  chargerCondition: grade,
  portsCondition: grade,
  storageHealth: grade,
  memoryHealth: grade,
  displayHealth: grade,
  operatingSystemCondition: grade,
  functionalTest: z.boolean(),
  hardwareTest: z.boolean(),
  batteryTest: z.boolean(),
  networkTest: z.boolean(),
  estimatedRepairCost: z.coerce.number().nonnegative().optional(),
  estimatedMarketValue: z.coerce.number().nonnegative().optional(),
  assessmentNotes: z.string().trim().min(12).max(4000),
  recommendation,
  sanitizationRequired: z.boolean().optional(),
})

export const updateAssessmentSchema = createAssessmentSchema.omit({ deviceId: true }).partial()

export const listAssessmentSchema = paginationSchema.extend({
  deviceId: z.string().cuid().optional(),
  assessorId: z.string().cuid().optional(),
  recommendation: recommendation.optional(),
})
