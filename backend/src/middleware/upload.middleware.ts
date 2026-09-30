import multer from 'multer'
import { env } from '../config/env'
import { AppError } from '../utils/errors'

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowed.has(file.mimetype)) {
      callback(new AppError(400, 'Only JPEG, PNG, WEBP, and PDF files are allowed.'))
      return
    }
    callback(null, true)
  },
})
