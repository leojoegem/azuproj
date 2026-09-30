import type { Request, Response } from 'express'
import * as dashboardService from '../services/dashboard.service'
import { asyncHandler, sendSuccess } from '../utils/http'

export const summary = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await dashboardService.summary(), 'Dashboard summary.')
})

export const deviceStatus = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await dashboardService.deviceStatus(), 'Device status breakdown.')
})

export const dispositionSummary = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await dashboardService.dispositionSummary(), 'Disposition summary.')
})

export const monthlyActivity = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await dashboardService.monthlyActivity(), 'Monthly activity.')
})
