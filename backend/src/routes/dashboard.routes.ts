import { Router } from 'express'
import * as dashboardController from '../controllers/dashboard.controller'
import { authenticate } from '../middleware/auth.middleware'
import { authorize } from '../middleware/role.middleware'

const readers = ['ADMIN', 'ASSESSOR', 'SANITIZATION_OFFICER', 'DISPOSITION_OFFICER', 'VIEWER'] as const

export const dashboardRouter = Router()

dashboardRouter.use(authenticate, authorize(...readers))
dashboardRouter.get('/summary', dashboardController.summary)
dashboardRouter.get('/device-status', dashboardController.deviceStatus)
dashboardRouter.get('/disposition-summary', dashboardController.dispositionSummary)
dashboardRouter.get('/monthly-activity', dashboardController.monthlyActivity)
