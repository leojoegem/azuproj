import { describe, expect, it } from 'vitest'
import { AppError } from '../src/utils/errors'
import { assertPasswordStrength, hashPassword, verifyPassword } from '../src/utils/password'

describe('passwords', () => {
  it('rejects weak passwords', () => {
    expect(() => assertPasswordStrength('password')).toThrow(AppError)
  })

  it('hashes and verifies a strong password', async () => {
    const hash = await hashPassword('ChangeMe!234')
    expect(hash).not.toContain('ChangeMe!234')
    expect(await verifyPassword('ChangeMe!234', hash)).toBe(true)
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})
