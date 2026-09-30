import bcrypt from 'bcryptjs'
import { env } from '../config/env'
import { AppError } from './errors'

const PASSWORD_RULE =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,128}$/

export function assertPasswordStrength(password: string) {
  if (!PASSWORD_RULE.test(password)) {
    throw new AppError(422, 'Password does not meet complexity requirements.', [
      {
        field: 'password',
        message:
          'Use 10 to 128 characters with uppercase, lowercase, a number, and a special character.',
      },
    ])
  }
}

export function hashPassword(password: string) {
  assertPasswordStrength(password)
  return bcrypt.hash(password, env.BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}
