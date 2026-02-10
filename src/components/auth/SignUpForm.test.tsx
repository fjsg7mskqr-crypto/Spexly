import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent, waitFor } from '@/__tests__/utils/test-utils'
import { SignUpForm } from './SignUpForm'

const mockSignUp = vi.fn()

vi.mock('@/lib/supabase/auth-helpers', () => ({
  signUp: (...args: unknown[]) => mockSignUp(...args),
}))

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email, password, and confirm password inputs', () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
  })

  it('renders sign up button', () => {
    render(<SignUpForm />)

    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows error when password is too short', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmInput = screen.getByLabelText('Confirm Password')

    await user.type(emailInput, 'test@example.com')

    // Fill password fields by setting value directly to bypass browser minLength validation
    await user.type(passwordInput, '12345')
    await user.type(confirmInput, '12345')

    // Submit via form submit event to bypass HTML validation
    const { act } = await import('@testing-library/react')
    await act(async () => {
      const form = passwordInput.closest('form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('calls signUp with email and password on valid submission', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ user: { id: '1' } })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows success message after signup', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ user: { id: '1' } })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  it('displays error message on signUp failure', async () => {
    const user = userEvent.setup()
    mockSignUp.mockRejectedValue(new Error('Email already in use'))

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockSignUp.mockImplementation(() => new Promise(() => {}))

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.type(screen.getByLabelText('Confirm Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument()
    })
  })
})
