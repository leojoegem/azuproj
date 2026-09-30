import { prisma } from './config/database'
import { env } from './config/env'
import { createApp } from './app'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`RE:SET API listening on port ${env.PORT}`)
  console.log(`Docs: ${env.API_BASE_URL.replace(/\/api$/, '')}/api/docs`)
})

async function shutdown() {
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
