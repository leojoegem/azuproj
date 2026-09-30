import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from '../controllers/auth.controller'
import { env } from '../config/env'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'
import { validate } from '../middleware/validation.middleware'
import { changePasswordSchema, loginSchema, refreshSchema, registerSchema } from '../schemas/auth.schema'

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again later.' },
})

export const authRouter = Router()

authRouter.post('/register', authenticate, authorize('ADMIN'), validate({ body: registerSchema }), authController.register)
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), authController.login)
authRouter.post('/logout', validate({ body: refreshSchema }), authController.logout)
authRouter.get('/me', authenticate, authController.me)
authRouter.post('/refresh', validate({ body: refreshSchema }), authController.refresh)
authRouter.post(
  '/change-password',
  authLimiter,
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
)
