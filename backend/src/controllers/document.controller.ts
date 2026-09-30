import type { Request, Response } from 'express'
import * as documentService from '../services/document.service'
import { AppError } from '../utils/errors'
import { asyncHandler, sendSuccess } from '../utils/http'
import { requestContext } from '../utils/request-context'

export const upload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError(400, 'A file is required.')
  const document = await documentService.uploadDocument(
    { entityType: req.body.entityType, entityId: req.body.entityId, file: req.file },
    req.auth!,
    { ...requestContext(req), userId: req.auth!.id },
  )
  sendSuccess(res, document, 'Document uploaded.', 201)
})

export const list = asyncHandler(async (req: Request, res: Response) => {
  const documents = await documentService.listDocuments(req.query.entityType as never, String(req.query.entityId))
  sendSuccess(res, documents, 'Documents retrieved.')
})

export const download = asyncHandler(async (req: Request, res: Response) => {
  const { document, buffer } = await documentService.readDocument(req.params.id)
  res.setHeader('Content-Type', document.fileType)
  res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`)
  res.status(200).send(buffer)
})
