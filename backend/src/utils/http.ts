import type { NextFunction, Request, Response } from 'express'

export function sendSuccess(res: Response, data: unknown, message: string, status = 200) {
  res.status(status).json({ success: true, data, message })
}

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
