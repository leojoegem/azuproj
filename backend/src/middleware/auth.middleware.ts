import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../config/auth'
import { prisma } from '../config/database'
import { AppError } from '../utils/errors'

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.get('authorization')
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required.')
    }
    const payload = verifyAccessToken(header.slice(7).trim())
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.disabledAt) {
      throw new AppError(401, 'Authentication required.')
    }
    req.auth = { id: user.id, email: user.email, name: user.name, role: user.role }
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
      return
    }
    next(new AppError(401, 'Authentication required.'))
  }
}
