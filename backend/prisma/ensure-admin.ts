import { prisma } from '../src/config/database'
import { env } from '../src/config/env'
import { hashPassword } from '../src/utils/password'

export async function ensureAdmin() {
  const email = env.ADMIN_EMAIL.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin already exists: ${email}`)
    return existing
  }
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD)
  const admin = await prisma.user.create({
    data: {
      email,
      name: env.ADMIN_NAME,
      passwordHash,
      role: 'ADMIN',
    },
  })
  console.log(`Admin created: ${email}`)
  return admin
}
