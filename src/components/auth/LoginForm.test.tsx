import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent, waitFor } from '@/__tests__/utils/test-utils'
import { LoginForm } from './LoginForm'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}))

const mockSignIn = vi.fn()
const mockSignInWithOAuth = vi.fn()

vi.mock('@/lib/supabase/auth-helpers', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password inputs', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    render(<LoginForm />)

    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('renders OAuth provider buttons', () => {
    render(<LoginForm />)

    expect(screen.getByRole('button', { name: 'Google' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Discord' })).toBeInTheDocument()
  })

  it('submits form with email and password', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ session: {} })

    render(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('redirects to dashboard on successful login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ session: {} })

    render(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('displays error message on auth failure', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    // Make signIn hang so we can see loading state
    mockSignIn.mockImplementation(() => new Promise(() => {}))

    render(<LoginForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })
  })

  it('calls signInWithOAuth when OAuth button clicked', async () => {
    const user = userEvent.setup()
    mockSignInWithOAuth.mockResolvedValue({ url: 'https://...' })

    render(<LoginForm />)

    await user.click(screen.getByRole('button', { name: 'GitHub' }))

    expect(mockSignInWithOAuth).toHaveBeenCalledWith('github')
  })
})
