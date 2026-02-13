import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  NotFoundError,
  formatErrorForClient,
  getSafeErrorMessage,
  isAppError,
  withErrorHandling,
} from './index'

describe('Error classes', () => {
  describe('AppError', () => {
    it('sets message, code, statusCode, and name', () => {
      const err = new AppError('test', 'TEST_ERROR', 418)
      expect(err.message).toBe('test')
      expect(err.code).toBe('TEST_ERROR')
      expect(err.statusCode).toBe(418)
      expect(err.name).toBe('AppError')
      expect(err.isOperational).toBe(true)
    })

    it('defaults statusCode to 500', () => {
      const err = new AppError('oops', 'ERR')
      expect(err.statusCode).toBe(500)
    })
  })

  describe('ValidationError', () => {
    it('has correct code, statusCode, and name', () => {
      const err = new ValidationError('bad input')
      expect(err.code).toBe('VALIDATION_ERROR')
      expect(err.statusCode).toBe(400)
      expect(err.name).toBe('ValidationError')
      expect(err.message).toBe('bad input')
    })
  })

  describe('DatabaseError', () => {
    it('has correct code, statusCode, and stores original error', () => {
      const original = new Error('pg connection failed')
      const err = new DatabaseError('db fail', original)
      expect(err.code).toBe('DATABASE_ERROR')
      expect(err.statusCode).toBe(500)
      expect(err.originalError).toBe(original)
    })
  })

  describe('AuthenticationError', () => {
    it('uses default message', () => {
      const err = new AuthenticationError()
      expect(err.message).toBe('Authentication required')
      expect(err.code).toBe('AUTH_ERROR')
      expect(err.statusCode).toBe(401)
    })

    it('accepts custom message', () => {
      const err = new AuthenticationError('Token expired')
      expect(err.message).toBe('Token expired')
    })
  })

  describe('AuthorizationError', () => {
    it('uses default message and 403 status', () => {
      const err = new AuthorizationError()
      expect(err.statusCode).toBe(403)
      expect(err.code).toBe('AUTHORIZATION_ERROR')
      expect(err.message).toMatch(/permission/)
    })
  })

  describe('RateLimitError', () => {
    it('uses default message and 429 status', () => {
      const err = new RateLimitError()
      expect(err.statusCode).toBe(429)
      expect(err.code).toBe('RATE_LIMIT_ERROR')
    })
  })

  describe('NotFoundError', () => {
    it('includes resource name in message', () => {
      const err = new NotFoundError('Project')
      expect(err.message).toBe('Project not found')
      expect(err.statusCode).toBe(404)
    })

    it('defaults to Resource', () => {
      const err = new NotFoundError()
      expect(err.message).toBe('Resource not found')
    })
  })
})

describe('formatErrorForClient', () => {
  it('returns AppError message directly', () => {
    const err = new ValidationError('Name too long')
    expect(formatErrorForClient(err)).toBe('Name too long')
  })

  it('returns generic message for unknown Error', () => {
    const err = new Error('Internal: connection pool exhausted')
    expect(formatErrorForClient(err)).toMatch(/unexpected error/i)
  })

  it.each([
    'Not authenticated',
    'Authentication required',
    'Session expired',
    'Invalid credentials',
  ])('passes through safe message: %s', (msg) => {
    const err = new Error(msg)
    expect(formatErrorForClient(err)).toContain(msg)
  })

  it('returns generic message for non-Error types', () => {
    expect(formatErrorForClient('string error')).toMatch(/unexpected error/i)
    expect(formatErrorForClient(null)).toMatch(/unexpected error/i)
  })
})

describe('getSafeErrorMessage', () => {
  it('returns AppError message directly', () => {
    const err = new ValidationError('Invalid email')
    expect(getSafeErrorMessage(err)).toBe('Invalid email')
  })

  it('maps JWT errors to user-friendly message', () => {
    const err = new Error('JWT token is malformed')
    expect(getSafeErrorMessage(err)).toMatch(/session.*expired/i)
  })

  it('maps Network errors to user-friendly message', () => {
    const err = new Error('Network request failed')
    expect(getSafeErrorMessage(err)).toMatch(/network/i)
  })

  it('maps auth errors to sign-in message', () => {
    const err = new Error('User not authenticated')
    expect(getSafeErrorMessage(err)).toMatch(/sign in/i)
  })

  it('returns generic message for unknown errors', () => {
    expect(getSafeErrorMessage(new Error('something random'))).toMatch(/unexpected error/i)
    expect(getSafeErrorMessage(42)).toMatch(/unexpected error/i)
  })
})

describe('isAppError', () => {
  it('returns true for AppError subclasses', () => {
    expect(isAppError(new ValidationError('test'))).toBe(true)
    expect(isAppError(new DatabaseError('test'))).toBe(true)
    expect(isAppError(new AuthenticationError())).toBe(true)
  })

  it('returns false for regular Error', () => {
    expect(isAppError(new Error('test'))).toBe(false)
  })

  it('returns false for non-Error types', () => {
    expect(isAppError('string')).toBe(false)
    expect(isAppError(null)).toBe(false)
  })
})

describe('withErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('rethrows AppError as-is', async () => {
    const action = withErrorHandling(async () => {
      throw new ValidationError('bad')
    })
    await expect(action()).rejects.toThrow(ValidationError)
  })

  it('converts "not authenticated" errors to AuthenticationError', async () => {
    const action = withErrorHandling(async () => {
      throw new Error('User is not authenticated')
    })
    await expect(action()).rejects.toThrow(AuthenticationError)
  })

  it('wraps unknown errors as DatabaseError', async () => {
    const action = withErrorHandling(async () => {
      throw new Error('Something unexpected')
    })
    await expect(action()).rejects.toThrow(DatabaseError)
  })

  it('returns result on success', async () => {
    const action = withErrorHandling(async () => 'ok')
    await expect(action()).resolves.toBe('ok')
  })
})
