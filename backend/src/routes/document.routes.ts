import { Router } from 'express'
import * as documentController from '../controllers/document.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { upload } from '../middleware/upload.middleware'
import { validate } from '../middleware/validation.middleware'
import { idParamSchema } from '../schemas/device.schema'
import { listDocumentSchema, uploadDocumentSchema } from '../schemas/document.schema'

const readers = ['ADMIN', 'ASSESSOR', 'SANITIZATION_OFFICER', 'DISPOSITION_OFFICER', 'VIEWER'] as const
const writers = ['ADMIN', 'ASSESSOR', 'SANITIZATION_OFFICER', 'DISPOSITION_OFFICER'] as const

export const documentRouter = Router()

documentRouter.use(authenticate)
documentRouter.get('/', authorize(...readers), validate({ query: listDocumentSchema }), documentController.list)
documentRouter.get('/:id/download', authorize(...readers), validate({ params: idParamSchema }), documentController.download)
documentRouter.post(
  '/',
  authorize(...writers),
  upload.single('file'),
  validate({ body: uploadDocumentSchema }),
  documentController.upload,
)
