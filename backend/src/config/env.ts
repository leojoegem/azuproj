import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_BASE_URL: z.string().url().default('http://localhost:5000/api'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().default('admin@reset.local'),
  ADMIN_PASSWORD: z.string().min(10).default('ChangeMe!234'),
  ADMIN_NAME: z.string().min(1).default('System Admin'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(10_485_760),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')
  throw new Error(`Invalid environment configuration: ${fields}`)
}

export const env = parsed.data

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
