import type { Request, Response } from 'express'
import type { z } from 'zod'
import * as reportService from '../services/report.service'
import type { auditQuerySchema, reportQuerySchema } from '../schemas/report.schema'
import { asyncHandler } from '../utils/http'

function query(req: Request): z.infer<typeof reportQuerySchema> {
  return req.query as unknown as z.infer<typeof reportQuerySchema>
}

function auditQuery(req: Request): z.infer<typeof auditQuerySchema> {
  return req.query as unknown as z.infer<typeof auditQuerySchema>
}

export const devices = asyncHandler(async (req: Request, res: Response) => {
  const input = query(req)
  const data = await reportService.deviceReport(input)
  reportService.sendReport(res, 'devices', data, input.format, 'Device report.')
})

export const assessments = asyncHandler(async (req: Request, res: Response) => {
  const input = query(req)
  const data = await reportService.assessmentReport(input)
  reportService.sendReport(res, 'assessments', data, input.format, 'Assessment report.')
})

export const sanitization = asyncHandler(async (req: Request, res: Response) => {
  const input = query(req)
  const data = await reportService.sanitizationReport(input)
  reportService.sendReport(res, 'sanitization', data, input.format, 'Sanitization report.')
})

export const disposition = asyncHandler(async (req: Request, res: Response) => {
  const input = query(req)
  const data = await reportService.dispositionReport(input)
  reportService.sendReport(res, 'disposition', data, input.format, 'Disposition report.')
})

export const audit = asyncHandler(async (req: Request, res: Response) => {
  const input = auditQuery(req)
  const data = await reportService.auditReport(input)
  reportService.sendReport(res, 'audit', data, input.format, 'Audit report.')
})
