import type { DeviceStatus, DispositionType, Recommendation } from '@prisma/client'
import { AppError } from '../utils/errors'

const ALWAYS_SANITIZE: Recommendation[] = [
  'SANITIZE_AND_REDEPLOY',
  'DONATE',
  'RESELL',
  'RECYCLE',
  'SCRAP',
]

const WAIVABLE: Recommendation[] = ['REDEPLOY', 'REPAIR', 'REASSIGN']

export function resolveSanitizationRequired(recommendation: Recommendation, requested?: boolean) {
  if (recommendation === 'HOLD') return false
  if (ALWAYS_SANITIZE.includes(recommendation)) return true
  if (WAIVABLE.includes(recommendation)) return requested !== false
  return true
}

export function statusAfterAssessment(
  recommendation: Recommendation,
  sanitizationRequired: boolean,
): DeviceStatus {
  if (recommendation === 'HOLD') return 'ON_HOLD'
  if (sanitizationRequired) return 'ASSESSMENT_COMPLETE'
  return 'AWAITING_DISPOSITION'
}

export function assertCanStartAssessment(status: DeviceStatus) {
  if (status !== 'RECEIVED' && status !== 'ON_HOLD') {
    throw new AppError(422, `Assessment cannot start while the device is ${status}.`)
  }
}

export function assertCanApproveSanitization(status: DeviceStatus, sanitizationRequired: boolean) {
  if (!sanitizationRequired) {
    throw new AppError(422, 'This device was not approved for a sanitization workflow.')
  }
  if (status !== 'ASSESSMENT_COMPLETE') {
    throw new AppError(422, 'Sanitization can only be approved after assessment is complete.')
  }
}

export function assertCanStartSanitization(status: DeviceStatus) {
  if (status !== 'AWAITING_SANITIZATION' && status !== 'SANITIZATION_IN_PROGRESS') {
    throw new AppError(422, 'A device cannot be sanitized unless sanitization has been approved.')
  }
}

export function deviceStatusAfterVerification(passed: boolean): DeviceStatus {
  return passed ? 'SANITIZED' : 'SANITIZATION_IN_PROGRESS'
}

export function assertReadyForDisposition(input: {
  hasCompletedAssessment: boolean
  sanitizationRequired: boolean
  sanitizationPassed: boolean
  status: DeviceStatus
}) {
  if (!input.hasCompletedAssessment) {
    throw new AppError(422, 'A device cannot be disposed of before an assessment is completed.')
  }
  if (input.sanitizationRequired && !input.sanitizationPassed) {
    throw new AppError(422, 'A device cannot be disposed of before required sanitization is completed.')
  }
  const allowed: DeviceStatus[] = input.sanitizationRequired
    ? ['SANITIZED', 'AWAITING_DISPOSITION']
    : ['AWAITING_DISPOSITION', 'ASSESSMENT_COMPLETE']
  if (!allowed.includes(input.status)) {
    throw new AppError(422, `Device cannot enter disposition from status ${input.status}.`)
  }
}

export function terminalStatusForDisposition(type: DispositionType): DeviceStatus {
  switch (type) {
    case 'REDEPLOYED':
      return 'REDEPLOYED'
    case 'RECYCLED':
      return 'RECYCLED'
    case 'SCRAPPED':
    case 'DESTROYED':
      return 'SCRAPPED'
    case 'DONATED':
    case 'SOLD':
    case 'RETURNED':
      return 'DISPOSED'
    default:
      return 'DISPOSED'
  }
}

export function dispositionNeedsRecipient(type: DispositionType) {
  return type === 'DONATED' || type === 'SOLD' || type === 'RETURNED'
}

export function dispositionNeedsDestructionEvidence(type: DispositionType) {
  return type === 'DESTROYED' || type === 'SCRAPPED'
}
