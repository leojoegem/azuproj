import type { Request } from 'express'

export interface RequestContext {
  userId?: string
  ipAddress?: string
  userAgent?: string
}

export function requestContext(req: Request): RequestContext {
  const forwarded = req.headers['x-forwarded-for']
  const ipAddress = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]?.trim() || req.ip
  return {
    userId: req.auth?.id,
    ipAddress,
    userAgent: req.get('user-agent')?.slice(0, 512),
  }
}
