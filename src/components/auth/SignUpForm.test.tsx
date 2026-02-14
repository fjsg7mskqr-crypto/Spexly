import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent, waitFor } from '@/__tests__/utils/test-utils'
import { SignUpForm } from './SignUpForm'

const mockSignUpAction = vi.fn()

vi.mock('@/app/actions/auth', () => ({
  signUpAction: (...args: unknown[]) => mockSignUpAction(...args),
}))

describe('SignUpForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders first name, email, password, and confirm password inputs', () => {
    render(<SignUpForm />)

    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
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

    await user.type(screen.getByLabelText('First Name'), 'Jane')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'Different123!')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    expect(mockSignUpAction).not.toHaveBeenCalled()
  })

  it('shows error when password is too short', async () => {
    const user = userEvent.setup()

    render(<SignUpForm />)

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Password')
    const confirmInput = screen.getByLabelText('Confirm Password')

    await user.type(screen.getByLabelText('First Name'), 'Jane')
    await user.type(emailInput, 'test@example.com')

    // Fill password fields by setting value directly to bypass browser minLength validation
    await user.type(passwordInput, 'short')
    await user.type(confirmInput, 'short')

    // Submit via form submit event to bypass HTML validation
    const { act } = await import('@testing-library/react')
    await act(async () => {
      const form = passwordInput.closest('form')!
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    await waitFor(() => {
      expect(
        screen.getByText(
          'Password must be at least 12 characters and include uppercase, lowercase, number, and special character'
        )
      ).toBeInTheDocument()
    })

    expect(mockSignUpAction).not.toHaveBeenCalled()
  })

  it('calls signUp with email, password, and first name on valid submission', async () => {
    const user = userEvent.setup()
    mockSignUpAction.mockResolvedValue({ user: { id: '1' } })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('First Name'), 'Jane')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(mockSignUpAction).toHaveBeenCalledWith('test@example.com', 'Password123!', 'Jane')
    })
  })

  it('shows success message after signup', async () => {
    const user = userEvent.setup()
    mockSignUpAction.mockResolvedValue({ user: { id: '1' } })

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('First Name'), 'Jane')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  it('displays error message on signUp failure', async () => {
    const user = userEvent.setup()
    mockSignUpAction.mockRejectedValue(new Error('Email already in use'))

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('First Name'), 'Jane')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockSignUpAction.mockImplementation(() => new Promise(() => {}))

    render(<SignUpForm />)

    await user.type(screen.getByLabelText('First Name'), 'Jane')
    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.type(screen.getByLabelText('Confirm Password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    await waitFor(() => {
      expect(screen.getByText('Creating account...')).toBeInTheDocument()
    })
  })
})
