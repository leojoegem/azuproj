import { Router } from 'express'
import * as deviceController from '../controllers/device.controller'
import * as sanitizationController from '../controllers/sanitization.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { validate } from '../middleware/validation.middleware'
import { createDeviceSchema, idParamSchema, listDeviceSchema, updateDeviceSchema } from '../schemas/device.schema'

const readers = ['ADMIN', 'ASSESSOR', 'SANITIZATION_OFFICER', 'DISPOSITION_OFFICER', 'VIEWER'] as const

export const deviceRouter = Router()

deviceRouter.use(authenticate)
deviceRouter.get('/', authorize(...readers), validate({ query: listDeviceSchema }), deviceController.list)
deviceRouter.get('/search', authorize(...readers), validate({ query: listDeviceSchema }), deviceController.list)
deviceRouter.get('/:id', authorize(...readers), validate({ params: idParamSchema }), deviceController.get)
deviceRouter.post('/', authorize('ADMIN', 'ASSESSOR'), validate({ body: createDeviceSchema }), deviceController.create)
deviceRouter.patch(
  '/:id',
  authorize('ADMIN', 'ASSESSOR'),
  validate({ params: idParamSchema, body: updateDeviceSchema }),
  deviceController.update,
)
deviceRouter.delete('/:id', authorize('ADMIN'), validate({ params: idParamSchema }), deviceController.remove)
deviceRouter.post(
  '/:id/approve-sanitization',
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  sanitizationController.approve,
)
