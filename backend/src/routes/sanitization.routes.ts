import { Router } from 'express'
import * as sanitizationController from '../controllers/sanitization.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { validate } from '../middleware/validation.middleware'
import { idParamSchema } from '../schemas/device.schema'
import { listSanitizationSchema, startSanitizationSchema, verifySanitizationSchema } from '../schemas/sanitization.schema'

const readers = ['ADMIN', 'SANITIZATION_OFFICER', 'VIEWER'] as const
const writers = ['ADMIN', 'SANITIZATION_OFFICER'] as const

export const sanitizationRouter = Router()

sanitizationRouter.use(authenticate)
sanitizationRouter.get('/', authorize(...readers), validate({ query: listSanitizationSchema }), sanitizationController.list)
sanitizationRouter.get('/:id', authorize(...readers), validate({ params: idParamSchema }), sanitizationController.get)
sanitizationRouter.post('/', authorize(...writers), validate({ body: startSanitizationSchema }), sanitizationController.start)
sanitizationRouter.post(
  '/:id/verify',
  authorize(...writers),
  validate({ params: idParamSchema, body: verifySanitizationSchema }),
  sanitizationController.verify,
)
