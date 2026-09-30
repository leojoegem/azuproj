import { Router } from 'express'
import * as reportController from '../controllers/report.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { validate } from '../middleware/validation.middleware'
import { auditQuerySchema, reportQuerySchema } from '../schemas/report.schema'

export const reportRouter = Router()

reportRouter.use(authenticate)
reportRouter.get('/devices', authorize('ADMIN', 'VIEWER'), validate({ query: reportQuerySchema }), reportController.devices)
reportRouter.get(
  '/assessments',
  authorize('ADMIN', 'ASSESSOR', 'VIEWER'),
  validate({ query: reportQuerySchema }),
  reportController.assessments,
)
reportRouter.get(
  '/sanitization',
  authorize('ADMIN', 'SANITIZATION_OFFICER', 'VIEWER'),
  validate({ query: reportQuerySchema }),
  reportController.sanitization,
)
reportRouter.get(
  '/disposition',
  authorize('ADMIN', 'DISPOSITION_OFFICER', 'VIEWER'),
  validate({ query: reportQuerySchema }),
  reportController.disposition,
)
reportRouter.get('/audit', authorize('ADMIN', 'VIEWER'), validate({ query: auditQuerySchema }), reportController.audit)
