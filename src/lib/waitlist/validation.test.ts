import { describe, it, expect } from 'vitest'
import { validateWaitlistSubmission, isValidConfirmationToken } from './validation'

describe('validateWaitlistSubmission', () => {
  // ─── Invalid payloads ──────────────────────────────────
  it('rejects null input', () => {
    const result = validateWaitlistSubmission(null as never)
    expect(result.valid).toBe(false)
  })

  it('rejects undefined input', () => {
    const result = validateWaitlistSubmission(undefined as never)
    expect(result.valid).toBe(false)
  })

  it('rejects non-object input', () => {
    const result = validateWaitlistSubmission('string' as never)
    expect(result.valid).toBe(false)
  })

  it('rejects missing email (non-string)', () => {
    const result = validateWaitlistSubmission({ email: 123 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/email/i)
  })

  it('rejects empty email string', () => {
    const result = validateWaitlistSubmission({ email: '   ' })
    expect(result.valid).toBe(false)
  })

  it('rejects email exceeding 254 characters', () => {
    const longEmail = 'a'.repeat(246) + '@test.com' // 255 chars total
    const result = validateWaitlistSubmission({ email: longEmail })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/long/i)
  })

  it('rejects invalid email format', () => {
    const result = validateWaitlistSubmission({ email: 'not-an-email' })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/valid email/i)
  })

  // ─── Valid email ───────────────────────────────────────
  it('accepts valid email and normalizes to lowercase', () => {
    const result = validateWaitlistSubmission({ email: 'Test@Example.COM' })
    expect(result.valid).toBe(true)
    expect(result.data!.emailNormalized).toBe('test@example.com')
  })

  // ─── Optional fields ──────────────────────────────────
  it('returns null for missing optional fields', () => {
    const result = validateWaitlistSubmission({ email: 'test@example.com' })
    expect(result.valid).toBe(true)
    expect(result.data!.primaryTool).toBeNull()
    expect(result.data!.whatBuilding).toBeNull()
    expect(result.data!.referralCode).toBeNull()
    expect(result.data!.utmSource).toBeNull()
    expect(result.data!.utmMedium).toBeNull()
    expect(result.data!.utmCampaign).toBeNull()
  })

  it('truncates optional fields to max lengths', () => {
    const result = validateWaitlistSubmission({
      email: 'test@example.com',
      primaryTool: 'A'.repeat(200), // max 64
      whatBuilding: 'B'.repeat(500), // max 240
      referralCode: 'C'.repeat(200), // max 64
    })
    expect(result.valid).toBe(true)
    expect(result.data!.primaryTool!.length).toBe(64)
    expect(result.data!.whatBuilding!.length).toBe(240)
    expect(result.data!.referralCode!.length).toBe(64)
  })

  // ─── Honeypot detection ────────────────────────────────
  it('triggers honeypot when website field is filled', () => {
    const result = validateWaitlistSubmission({
      email: 'test@example.com',
      website: 'http://spam.com',
    })
    expect(result.valid).toBe(true)
    expect(result.data!.honeypotTriggered).toBe(true)
  })

  it('does not trigger honeypot when website field is empty', () => {
    const result = validateWaitlistSubmission({ email: 'test@example.com' })
    expect(result.valid).toBe(true)
    expect(result.data!.honeypotTriggered).toBe(false)
  })
})

describe('isValidConfirmationToken', () => {
  it('rejects token shorter than 40 characters', () => {
    expect(isValidConfirmationToken('abc')).toBe(false)
  })

  it('rejects token longer than 80 characters', () => {
    expect(isValidConfirmationToken('a'.repeat(81))).toBe(false)
  })

  it('rejects token with invalid characters', () => {
    const token = 'a'.repeat(39) + '!' // 40 chars but has !
    expect(isValidConfirmationToken(token)).toBe(false)
  })

  it('accepts valid alphanumeric-dash token of 40 chars', () => {
    const token = 'abcdef01-2345-6789-abcd-ef0123456789-ext'
    expect(isValidConfirmationToken(token)).toBe(true)
  })

  it('accepts valid token at exactly 80 characters', () => {
    const token = 'a'.repeat(80)
    expect(isValidConfirmationToken(token)).toBe(true)
  })
})
