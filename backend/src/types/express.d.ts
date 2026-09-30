import type { Role } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      auth?: {
        id: string
        email: string
        name: string
        role: Role
      }
    }
  }
}

export {}
