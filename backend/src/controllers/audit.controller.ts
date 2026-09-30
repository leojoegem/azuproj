import type { Request, Response } from 'express'
import type { z } from 'zod'
import type { auditQuerySchema } from '../schemas/report.schema'
import { auditReport } from '../services/report.service'
import { asyncHandler, sendSuccess } from '../utils/http'

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as z.infer<typeof auditQuerySchema>
  const data = await auditReport({ ...query, format: 'json' })
  sendSuccess(res, data, 'Audit log retrieved.')
})
