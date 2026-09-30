import { z } from 'zod'
import { paginationSchema } from './common'

const deviceType = z.enum(['LAPTOP', 'DESKTOP', 'TABLET', 'OTHER'])
const storageType = z.enum(['HDD', 'SSD', 'NVME', 'EMMC', 'NONE', 'OTHER'])
const condition = z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'MISSING', 'FAILED', 'NOT_TESTED'])
const status = z.enum([
  'RECEIVED',
  'UNDER_ASSESSMENT',
  'ASSESSMENT_COMPLETE',
  'AWAITING_SANITIZATION',
  'SANITIZATION_IN_PROGRESS',
  'SANITIZED',
  'AWAITING_DISPOSITION',
  'DISPOSITION_IN_PROGRESS',
  'DISPOSED',
  'REDEPLOYED',
  'RECYCLED',
  'SCRAPPED',
  'ON_HOLD',
])

export const createDeviceSchema = z.object({
  assetTag: z.string().trim().min(3).max(32).regex(/^[A-Za-z0-9][A-Za-z0-9-]*$/),
  serialNumber: z.string().trim().min(4).max(64),
  manufacturer: z.string().trim().min(2).max(80),
  model: z.string().trim().min(1).max(120),
  deviceType: deviceType,
  processor: z.string().trim().max(120).optional(),
  ram: z.string().trim().max(40).optional(),
  storage: z.string().trim().max(40).optional(),
  storageType: storageType.optional(),
  operatingSystem: z.string().trim().max(80).optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().nonnegative().optional(),
  currentCondition: condition.optional(),
  location: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(120),
  assignedUser: z.string().trim().max(120).optional(),
})

export const updateDeviceSchema = createDeviceSchema
  .pick({
    manufacturer: true,
    model: true,
    processor: true,
    ram: true,
    storage: true,
    storageType: true,
    operatingSystem: true,
    purchaseDate: true,
    purchasePrice: true,
    location: true,
    department: true,
    assignedUser: true,
    currentCondition: true,
  })
  .partial()

export const listDeviceSchema = paginationSchema.extend({
  q: z.string().trim().max(120).optional(),
  assetTag: z.string().trim().max(32).optional(),
  serialNumber: z.string().trim().max(64).optional(),
  manufacturer: z.string().trim().max(80).optional(),
  model: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  status: status.optional(),
  condition: condition.optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'assetTag', 'status']).default('createdAt'),
  includeDeleted: z.enum(['true', 'false']).optional(),
})

export const idParamSchema = z.object({
  id: z.string().cuid(),
})
