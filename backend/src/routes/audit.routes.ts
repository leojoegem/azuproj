import { Router } from 'express'
import * as auditController from '../controllers/audit.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { validate } from '../middleware/validation.middleware'
import { auditQuerySchema } from '../schemas/report.schema'

export const auditRouter = Router()

auditRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'VIEWER'),
  validate({ query: auditQuerySchema }),
  auditController.list,
)
