import type { Request, Response } from 'express'
import * as deviceService from '../services/device.service'
import { asyncHandler, sendSuccess } from '../utils/http'
import { requestContext } from '../utils/request-context'

export const create = asyncHandler(async (req: Request, res: Response) => {
  const device = await deviceService.createDevice(req.body, { ...requestContext(req), userId: req.auth!.id })
  sendSuccess(res, device, 'Device created successfully.', 201)
})

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await deviceService.listDevices(req.query as never, req.auth!)
  sendSuccess(res, data, 'Devices retrieved.')
})

export const get = asyncHandler(async (req: Request, res: Response) => {
  const device = await deviceService.getDevice(req.params.id, req.auth!)
  sendSuccess(res, device, 'Device retrieved.')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const device = await deviceService.updateDevice(req.params.id, req.body, req.auth!, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, device, 'Device updated.')
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const device = await deviceService.softDeleteDevice(req.params.id, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, device, 'Device archived.')
})
