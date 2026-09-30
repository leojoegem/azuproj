import { prisma } from '../src/config/database'
import { ensureAdmin } from './ensure-admin'

ensureAdmin()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
