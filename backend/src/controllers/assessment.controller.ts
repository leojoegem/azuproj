import type { Request, Response } from 'express'
import * as assessmentService from '../services/assessment.service'
import { asyncHandler, sendSuccess } from '../utils/http'
import { requestContext } from '../utils/request-context'

export const create = asyncHandler(async (req: Request, res: Response) => {
  const assessment = await assessmentService.createAssessment(req.body, req.auth!, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, assessment, 'Assessment started.', 201)
})

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await assessmentService.listAssessments(req.query as never, req.auth!)
  sendSuccess(res, data, 'Assessments retrieved.')
})

export const get = asyncHandler(async (req: Request, res: Response) => {
  const assessment = await assessmentService.getAssessment(req.params.id, req.auth!)
  sendSuccess(res, assessment, 'Assessment retrieved.')
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const assessment = await assessmentService.updateAssessment(req.params.id, req.body, req.auth!, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, assessment, 'Assessment updated.')
})

export const complete = asyncHandler(async (req: Request, res: Response) => {
  const assessment = await assessmentService.completeAssessment(req.params.id, req.auth!, {
    ...requestContext(req),
    userId: req.auth!.id,
  })
  sendSuccess(res, assessment, 'Assessment completed.')
})
