import type { Request, Response } from 'express'
import * as sanitizationService from '../services/sanitization.service'
import { asyncHandler, sendSuccess } from '../utils/http'
import { requestContext } from '../utils/request-context'

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const device = await sanitizationService.approveSanitization(req.params.id, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, device, 'Sanitization approved.')
})

export const start = asyncHandler(async (req: Request, res: Response) => {
  const record = await sanitizationService.startSanitization(req.body, req.auth!, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, record, 'Sanitization started.', 201)
})

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await sanitizationService.listSanitization(req.query as never)
  sendSuccess(res, data, 'Sanitization records retrieved.')
})

export const get = asyncHandler(async (req: Request, res: Response) => {
  const record = await sanitizationService.getSanitization(req.params.id)
  sendSuccess(res, record, 'Sanitization record retrieved.')
})

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const record = await sanitizationService.verifySanitization(req.params.id, req.body, req.auth!, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, record, 'Sanitization verification recorded.')
})
