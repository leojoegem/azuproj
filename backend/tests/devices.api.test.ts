import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../src/config/database', () => {
  const prisma = {
    user: { findUnique: vi.fn() },
    device: { findFirst: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === 'function') return (arg as (client: typeof prisma) => Promise<unknown>)(prisma)
      return Promise.all(arg as Promise<unknown>[])
    }),
  }
  return { prisma }
})

import { prisma } from '../src/config/database'
import { signAccessToken } from '../src/config/auth'
import { createApp } from '../src/app'

const db = prisma as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> }
  device: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
  auditLog: { create: ReturnType<typeof vi.fn> }
}

const app = createApp()
const admin = { id: 'user-admin', email: 'admin@reset.local', name: 'System Admin', role: 'ADMIN' as const, disabledAt: null }

function token(role: 'ADMIN' | 'VIEWER' = 'ADMIN') {
  return signAccessToken({ id: admin.id, email: admin.email, role })
}

describe('device API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.user.findUnique.mockResolvedValue(admin)
    db.auditLog.create.mockResolvedValue({ id: 'audit' })
  })

  it('rejects unauthenticated registration', async () => {
    const response = await request(app).post('/api/devices').send({ assetTag: 'AST-1' })
    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it('returns field errors for an invalid device', async () => {
    const response = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token()}`)
      .send({ assetTag: 'A', serialNumber: '1', manufacturer: 'D', model: '', deviceType: 'LAPTOP' })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Validation failed.')
    expect(response.body.errors.length).toBeGreaterThan(0)
  })

  it('rejects a duplicate serial number', async () => {
    db.device.findFirst.mockResolvedValue({ assetTag: 'OTHER', serialNumber: 'DL5420X9001' })
    const response = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        assetTag: 'AST-001285',
        serialNumber: 'DL5420X9001',
        manufacturer: 'Dell',
        model: 'Latitude 5420',
        deviceType: 'LAPTOP',
        location: 'Nairobi HQ',
        department: 'Finance',
      })
    expect(response.status).toBe(409)
    expect(response.body.message).toBe('A device with this serial number already exists.')
  })

  it('registers a device and writes an audit event', async () => {
    db.device.findFirst.mockResolvedValue(null)
    db.device.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'device-1',
      purchasePrice: null,
      status: 'RECEIVED',
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    }))
    const response = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        assetTag: 'AST-001285',
        serialNumber: 'dl5420x9001',
        manufacturer: 'Dell',
        model: 'Latitude 5420',
        deviceType: 'LAPTOP',
        location: 'Nairobi HQ',
        department: 'Finance',
      })
    expect(response.status).toBe(201)
    expect(response.body.data.serialNumber).toBe('DL5420X9001')
    expect(response.body.data.status).toBe('RECEIVED')
    expect(db.auditLog.create).toHaveBeenCalled()
  })

  it('does not expose an audit mutation route', async () => {
    const response = await request(app).delete('/api/audit/some-id').set('Authorization', `Bearer ${token()}`)
    expect(response.status).toBe(404)
  })
})
