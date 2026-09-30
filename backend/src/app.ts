import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { corsOrigins, env } from './config/env'
import { openApiDocument } from './docs/openapi'
import { errorHandler, notFound } from './middleware/error.middleware'
import { assessmentRouter } from './routes/assessment.routes'
import { auditRouter } from './routes/audit.routes'
import { authRouter } from './routes/auth.routes'
import { dashboardRouter } from './routes/dashboard.routes'
import { deviceRouter } from './routes/device.routes'
import { dispositionRouter } from './routes/disposition.routes'
import { documentRouter } from './routes/document.routes'
import { reportRouter } from './routes/report.routes'
import { sanitizationRouter } from './routes/sanitization.routes'
import { userRouter } from './routes/user.routes'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    }),
  )
  app.use(cors({ origin: corsOrigins, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, message: 'Too many requests. Try again later.' },
    }),
  )

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, message: 'RE:SET API is running.' })
  })
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))

  app.use('/api/auth', authRouter)
  app.use('/api/users', userRouter)
  app.use('/api/devices', deviceRouter)
  app.use('/api/assessments', assessmentRouter)
  app.use('/api/sanitization', sanitizationRouter)
  app.use('/api/dispositions', dispositionRouter)
  app.use('/api/disposition', dispositionRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/reports', reportRouter)
  app.use('/api/audit', auditRouter)
  app.use('/api/documents', documentRouter)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
