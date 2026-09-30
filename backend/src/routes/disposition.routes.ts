import { Router } from 'express'
import * as dispositionController from '../controllers/disposition.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { validate } from '../middleware/validation.middleware'
import { completeDispositionSchema, createDispositionSchema, listDispositionSchema } from '../schemas/disposition.schema'
import { idParamSchema } from '../schemas/device.schema'

const readers = ['ADMIN', 'DISPOSITION_OFFICER', 'VIEWER'] as const

export const dispositionRouter = Router()

dispositionRouter.use(authenticate)
dispositionRouter.get('/', authorize(...readers), validate({ query: listDispositionSchema }), dispositionController.list)
dispositionRouter.get('/:id', authorize(...readers), validate({ params: idParamSchema }), dispositionController.get)
dispositionRouter.post(
  '/',
  authorize('ADMIN', 'DISPOSITION_OFFICER'),
  validate({ body: createDispositionSchema }),
  dispositionController.create,
)
dispositionRouter.post('/:id/approve', authorize('ADMIN'), validate({ params: idParamSchema }), dispositionController.approve)
dispositionRouter.post('/:id/reject', authorize('ADMIN'), validate({ params: idParamSchema }), dispositionController.reject)
dispositionRouter.post(
  '/:id/complete',
  authorize('ADMIN', 'DISPOSITION_OFFICER'),
  validate({ params: idParamSchema, body: completeDispositionSchema }),
  dispositionController.complete,
)
