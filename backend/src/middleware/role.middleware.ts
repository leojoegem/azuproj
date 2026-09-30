import type { Role } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/errors'

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, 'Authentication required.'))
      return
    }
    if (!roles.includes(req.auth.role)) {
      next(new AppError(403, 'You do not have permission to perform this action.'))
      return
    }
    next()
  }
}
