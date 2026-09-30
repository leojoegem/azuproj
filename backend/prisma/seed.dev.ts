import { prisma } from '../src/config/database'
import { env } from '../src/config/env'
import { ensureAdmin } from './ensure-admin'

async function main() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to load development seed data in production.')
  }
  const admin = await ensureAdmin()
  const existing = await prisma.device.count()
  if (existing > 0) {
    console.log('Development devices already exist. Skipping sample rows.')
    return
  }

  await prisma.device.createMany({
    data: [
      {
        assetTag: 'AST-DEV-001',
        serialNumber: 'DEV-LAT-5420',
        manufacturer: 'Dell',
        model: 'Latitude 5420',
        deviceType: 'LAPTOP',
        location: 'Nairobi HQ — Intake',
        department: 'Finance',
        status: 'RECEIVED',
        processor: 'Intel Core i5-1145G7',
        ram: '16 GB',
        storage: '256 GB',
        storageType: 'SSD',
      },
      {
        assetTag: 'AST-DEV-002',
        serialNumber: 'DEV-TP-T14',
        manufacturer: 'Lenovo',
        model: 'ThinkPad T14',
        deviceType: 'LAPTOP',
        location: 'Nairobi HQ — Bay A',
        department: 'Engineering',
        status: 'RECEIVED',
        processor: 'Intel Core i7-1165G7',
        ram: '16 GB',
        storage: '512 GB',
        storageType: 'NVME',
      },
    ],
  })
  console.log(`Development devices created for ${admin.email}.`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
