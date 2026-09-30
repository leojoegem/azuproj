import type { Request, Response } from 'express'
import * as dispositionService from '../services/disposition.service'
import { asyncHandler, sendSuccess } from '../utils/http'
import { requestContext } from '../utils/request-context'

export const create = asyncHandler(async (req: Request, res: Response) => {
  const approverId = req.auth!.role === 'ADMIN' ? req.auth!.id : null
  const row = await dispositionService.createDisposition(req.body, approverId, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, row, approverId ? 'Disposition approved.' : 'Disposition submitted for approval.', 201)
})

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await dispositionService.listDispositions(req.query as never)
  sendSuccess(res, data, 'Dispositions retrieved.')
})

export const get = asyncHandler(async (req: Request, res: Response) => {
  const row = await dispositionService.getDisposition(req.params.id)
  sendSuccess(res, row, 'Disposition retrieved.')
})

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const row = await dispositionService.approveDisposition(req.params.id, req.auth!.id, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, row, 'Disposition approved.')
})

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const row = await dispositionService.rejectDisposition(req.params.id, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, row, 'Disposition rejected.')
})

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const row = await dispositionService.completeDisposition(req.params.id, req.body, req.auth!.id, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, row, 'Disposition completed.')
})
