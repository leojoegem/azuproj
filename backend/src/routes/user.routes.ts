import { Router } from 'express'
import * as userController from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { validate } from '../middleware/validation.middleware'
import { registerSchema, updateUserSchema } from '../schemas/auth.schema'
import { idParamSchema } from '../schemas/device.schema'

export const userRouter = Router()

userRouter.use(authenticate, authorize('ADMIN'))
userRouter.get('/', userController.list)
userRouter.post('/', validate({ body: registerSchema }), userController.create)
userRouter.patch('/:id', validate({ params: idParamSchema, body: updateUserSchema }), userController.update)
userRouter.post('/:id/disable', validate({ params: idParamSchema }), userController.disable)
