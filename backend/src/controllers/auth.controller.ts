import type { Request, Response } from 'express'
import * as authService from '../services/auth.service'
import { asyncHandler, sendSuccess } from '../utils/http'
import { requestContext } from '../utils/request-context'

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body, { ...requestContext(req), userId: req.auth!.id })
  sendSuccess(res, user, 'User created successfully.', 201)
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const session = await authService.login(req.body.email, req.body.password, requestContext(req))
  sendSuccess(res, session, 'Login successful.')
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken, requestContext(req))
  sendSuccess(res, null, 'Logged out.')
})

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.me(req.auth!.id)
  sendSuccess(res, user, 'Current user.')
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const session = await authService.refresh(req.body.refreshToken)
  sendSuccess(res, session, 'Token refreshed.')
})

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(
    req.auth!.id,
    req.body.currentPassword,
    req.body.newPassword,
    { ...requestContext(req), userId: req.auth!.id },
  )
  sendSuccess(res, null, 'Password changed.')
})
