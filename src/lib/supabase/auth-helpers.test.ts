import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/__tests__/mocks/supabase'

const mockClient = createMockSupabaseClient()

vi.mock('./client', () => ({
  createClient: () => mockClient,
}))

// Import AFTER mock is set up
const { signUp, signIn, signOut, resetPassword, signInWithOAuth } = await import('./auth-helpers')

describe('auth-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signUp', () => {
    it('calls supabase.auth.signUp with email and password', async () => {
      mockClient.auth.signUp.mockResolvedValue({ data: { user: { id: '1' } }, error: null })

      await signUp('test@example.com', 'password123')

      expect(mockClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      })
    })

    it('returns data on success', async () => {
      const mockData = { user: { id: '1' }, session: null }
      mockClient.auth.signUp.mockResolvedValue({ data: mockData, error: null })

      const result = await signUp('test@example.com', 'password123')
      expect(result).toEqual(mockData)
    })

    it('throws on error', async () => {
      mockClient.auth.signUp.mockResolvedValue({
        data: null,
        error: new Error('Email already in use'),
      })

      await expect(signUp('test@example.com', 'password123')).rejects.toThrow('Email already in use')
    })
  })

  describe('signIn', () => {
    it('calls supabase.auth.signInWithPassword', async () => {
      mockClient.auth.signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null })

      await signIn('test@example.com', 'password123')

      expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('throws on invalid credentials', async () => {
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: new Error('Invalid login credentials'),
      })

      await expect(signIn('test@example.com', 'wrong')).rejects.toThrow('Invalid login credentials')
    })
  })

  describe('signOut', () => {
    it('calls supabase.auth.signOut', async () => {
      mockClient.auth.signOut.mockResolvedValue({ error: null })

      await signOut()

      expect(mockClient.auth.signOut).toHaveBeenCalled()
    })

    it('throws on error', async () => {
      mockClient.auth.signOut.mockResolvedValue({ error: new Error('Session expired') })

      await expect(signOut()).rejects.toThrow('Session expired')
    })
  })

  describe('resetPassword', () => {
    it('calls supabase.auth.resetPasswordForEmail with redirect URL', async () => {
      mockClient.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

      await resetPassword('test@example.com')

      expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: expect.stringContaining('/auth/callback') }
      )
    })

    it('throws on error', async () => {
      mockClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: new Error('Rate limit exceeded'),
      })

      await expect(resetPassword('test@example.com')).rejects.toThrow('Rate limit exceeded')
    })
  })

  describe('signInWithOAuth', () => {
    it.each(['google', 'github', 'discord'] as const)(
      'calls supabase.auth.signInWithOAuth for %s',
      async (provider) => {
        mockClient.auth.signInWithOAuth.mockResolvedValue({ data: { url: 'https://...' }, error: null })

        await signInWithOAuth(provider)

        expect(mockClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider,
          options: { redirectTo: expect.stringContaining('/auth/callback') },
        })
      }
    )

    it('throws on error', async () => {
      mockClient.auth.signInWithOAuth.mockResolvedValue({
        data: null,
        error: new Error('Provider unavailable'),
      })

      await expect(signInWithOAuth('google')).rejects.toThrow('Provider unavailable')
    })
  })
})
