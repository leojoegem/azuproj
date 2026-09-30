import { describe, expect, it } from 'vitest'
import { AppError } from '../src/utils/errors'
import {
  assertCanApproveSanitization,
  assertCanStartSanitization,
  assertReadyForDisposition,
  deviceStatusAfterVerification,
  dispositionNeedsDestructionEvidence,
  resolveSanitizationRequired,
  statusAfterAssessment,
  terminalStatusForDisposition,
} from '../src/services/workflow'

describe('assessment workflow', () => {
  it('always requires sanitization before resale, donation, recycle, or scrap', () => {
    expect(resolveSanitizationRequired('RESELL', false)).toBe(true)
    expect(resolveSanitizationRequired('DONATE', false)).toBe(true)
    expect(resolveSanitizationRequired('SCRAP', false)).toBe(true)
    expect(statusAfterAssessment('RESELL', true)).toBe('ASSESSMENT_COMPLETE')
  })

  it('allows an internal redeploy path to waive sanitization', () => {
    expect(resolveSanitizationRequired('REDEPLOY', false)).toBe(false)
    expect(statusAfterAssessment('REDEPLOY', false)).toBe('AWAITING_DISPOSITION')
  })

  it('holds a device when the recommendation is HOLD', () => {
    expect(resolveSanitizationRequired('HOLD', true)).toBe(false)
    expect(statusAfterAssessment('HOLD', false)).toBe('ON_HOLD')
  })

  it('rejects sanitization approval before assessment is complete', () => {
    expect(() => assertCanApproveSanitization('RECEIVED', true)).toThrow(AppError)
    expect(() => assertCanStartSanitization('ASSESSMENT_COMPLETE')).toThrow(/approved/)
  })
})

describe('sanitization and disposition gates', () => {
  it('keeps a failed wipe in progress and releases a passed wipe', () => {
    expect(deviceStatusAfterVerification(false)).toBe('SANITIZATION_IN_PROGRESS')
    expect(deviceStatusAfterVerification(true)).toBe('SANITIZED')
  })

  it('refuses disposition when sanitization was required but did not pass', () => {
    expect(() =>
      assertReadyForDisposition({
        hasCompletedAssessment: true,
        sanitizationRequired: true,
        sanitizationPassed: false,
        status: 'SANITIZATION_IN_PROGRESS',
      }),
    ).toThrow(/sanitization is completed/)
  })

  it('refuses disposition when no assessment exists', () => {
    expect(() =>
      assertReadyForDisposition({
        hasCompletedAssessment: false,
        sanitizationRequired: false,
        sanitizationPassed: false,
        status: 'RECEIVED',
      }),
    ).toThrow(/assessment is completed/)
  })

  it('maps final disposition types onto device status', () => {
    expect(terminalStatusForDisposition('SOLD')).toBe('DISPOSED')
    expect(terminalStatusForDisposition('REDEPLOYED')).toBe('REDEPLOYED')
    expect(terminalStatusForDisposition('RECYCLED')).toBe('RECYCLED')
    expect(terminalStatusForDisposition('DESTROYED')).toBe('SCRAPPED')
    expect(dispositionNeedsDestructionEvidence('DESTROYED')).toBe(true)
  })
})
