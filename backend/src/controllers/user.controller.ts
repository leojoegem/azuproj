import type { Request, Response } from 'express'
import * as userService from '../services/user.service'
import { asyncHandler, sendSuccess } from '../utils/http'
import { requestContext } from '../utils/request-context'

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body, { ...requestContext(req), userId: req.auth!.id })
  sendSuccess(res, user, 'User created successfully.', 201)
})

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.listUsers()
  sendSuccess(res, users, 'Users retrieved.')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.updateUser(req.params.id, req.body, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, user, 'User updated.')
})

export const disable = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.disableUser(req.params.id, req.auth!.id, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, user, 'User disabled.')
})
