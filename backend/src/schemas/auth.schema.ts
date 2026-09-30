import { z } from 'zod'
import { passwordSchema } from './common'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(120),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'ASSESSOR', 'SANITIZATION_OFFICER', 'DISPOSITION_OFFICER', 'VIEWER']),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
})

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(['ADMIN', 'ASSESSOR', 'SANITIZATION_OFFICER', 'DISPOSITION_OFFICER', 'VIEWER']).optional(),
})
