import { Prisma } from '@prisma/client'
import type { NextFunction, Request, Response } from 'express'
import { MulterError } from 'multer'
import { ZodError } from 'zod'
import { env } from '../config/env'
import { AppError } from '../utils/errors'

function zodErrors(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'request',
    message: issue.message,
  }))
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Resource not found.' })
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    })
    return
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: zodErrors(error),
    })
    return
  }

  if (error instanceof MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the maximum upload size.' : 'File upload failed.'
    res.status(400).json({ success: false, message })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'A record with these unique values already exists.',
    })
    return
  }

  console.error(error)
  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'production'
        ? 'Internal server error.'
        : error instanceof Error
          ? error.message
          : 'Internal server error.',
  })
}
