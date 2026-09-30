import { Router } from 'express'
import * as assessmentController from '../controllers/assessment.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { validate } from '../middleware/validation.middleware'
import { createAssessmentSchema, listAssessmentSchema, updateAssessmentSchema } from '../schemas/assessment.schema'
import { idParamSchema } from '../schemas/device.schema'

const readers = ['ADMIN', 'ASSESSOR', 'VIEWER'] as const

export const assessmentRouter = Router()

assessmentRouter.use(authenticate)
assessmentRouter.get('/', authorize(...readers), validate({ query: listAssessmentSchema }), assessmentController.list)
assessmentRouter.get('/:id', authorize(...readers), validate({ params: idParamSchema }), assessmentController.get)
assessmentRouter.post(
  '/',
  authorize('ADMIN', 'ASSESSOR'),
  validate({ body: createAssessmentSchema }),
  assessmentController.create,
)
assessmentRouter.patch(
  '/:id',
  authorize('ADMIN', 'ASSESSOR'),
  validate({ params: idParamSchema, body: updateAssessmentSchema }),
  assessmentController.update,
)
assessmentRouter.post(
  '/:id/complete',
  authorize('ADMIN', 'ASSESSOR'),
  validate({ params: idParamSchema }),
  assessmentController.complete,
)
