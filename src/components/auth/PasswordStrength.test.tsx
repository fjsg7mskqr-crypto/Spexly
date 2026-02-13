import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { PasswordStrength, validatePassword } from './PasswordStrength'

describe('PasswordStrength component', () => {
  it('returns null for empty password', () => {
    const { container } = render(<PasswordStrength password="" />)
    expect(container.innerHTML).toBe('')
  })

  it('shows "Weak" label for password with score 1', () => {
    // 12 chars lowercase only = score 1 (hasMinLength only)
    render(<PasswordStrength password="abcdefghijkl" />)
    expect(screen.getByText('Weak')).toBeInTheDocument()
  })

  it('shows "Fair" label for password with score 2', () => {
    // 12 chars, mixed case = score 2 (hasMinLength + hasUpper&Lower)
    render(<PasswordStrength password="Abcdefghijkl" />)
    expect(screen.getByText('Fair')).toBeInTheDocument()
  })

  it('shows "Good" label for password with score 3', () => {
    // 12 chars, mixed case, number = score 3
    render(<PasswordStrength password="Abcdefghijk1" />)
    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('shows "Strong" label for password with score 4', () => {
    // 16+ chars, mixed case, number, special = score 5 capped to 4
    render(<PasswordStrength password="Abcdefghijk12345!" />)
    expect(screen.getByText('Strong')).toBeInTheDocument()
  })

  it('shows feedback for missing uppercase', () => {
    render(<PasswordStrength password="abcdefghijkl" />)
    expect(screen.getByText(/uppercase/i)).toBeInTheDocument()
  })

  it('shows feedback for missing number', () => {
    render(<PasswordStrength password="Abcdefghijkl" />)
    expect(screen.getByText(/number/i)).toBeInTheDocument()
  })

  it('shows feedback for missing special character', () => {
    render(<PasswordStrength password="Abcdefghijkl1" />)
    expect(screen.getByText(/special character/i)).toBeInTheDocument()
  })

  it('shows feedback for short password with character count', () => {
    render(<PasswordStrength password="Ab1!" />)
    expect(screen.getByText(/12 characters/i)).toBeInTheDocument()
  })

  it('renders strength bar with 4 segments', () => {
    const { container } = render(<PasswordStrength password="abc" />)
    const barSegments = container.querySelectorAll('.rounded-full.h-2')
    expect(barSegments.length).toBe(4)
  })

  it('fills correct number of segments based on score', () => {
    // Strong password scores 4 - all segments should be filled with green
    const { container } = render(<PasswordStrength password="Abcdefghijk12345!" />)
    const greenSegments = container.querySelectorAll('.bg-green-500')
    expect(greenSegments.length).toBe(4)
  })

  it('shows "Meets requirements" for valid passwords', () => {
    render(<PasswordStrength password="Abcdefghijk1!" />)
    expect(screen.getByText(/meets requirements/i)).toBeInTheDocument()
  })
})

describe('validatePassword', () => {
  it('rejects password shorter than 12 characters', () => {
    const result = validatePassword('Abc1!')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/12 characters/i)
  })

  it('rejects password missing uppercase', () => {
    const result = validatePassword('abcdefghijkl1!')
    expect(result.valid).toBe(false)
  })

  it('rejects password missing special character', () => {
    const result = validatePassword('Abcdefghijkl1')
    expect(result.valid).toBe(false)
  })

  it('rejects password missing number', () => {
    const result = validatePassword('Abcdefghijkl!')
    expect(result.valid).toBe(false)
  })

  it('accepts valid password', () => {
    const result = validatePassword('Abcdefghijk1!')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })
})
