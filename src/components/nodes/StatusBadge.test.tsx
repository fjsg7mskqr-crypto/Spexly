import { describe, it, expect } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import { StatusBadge } from './StatusBadge'
import type { FeatureStatus } from '@/types/nodes'

describe('StatusBadge', () => {
  it.each<FeatureStatus>(['Planned', 'In Progress', 'Built', 'Broken', 'Blocked'])(
    'renders status text for "%s"',
    (status) => {
      render(<StatusBadge status={status} />)
      expect(screen.getByText(status)).toBeInTheDocument()
    }
  )

  it('applies pulse class only for "In Progress"', () => {
    const { container: inProgressContainer } = render(<StatusBadge status="In Progress" />)
    const badge = inProgressContainer.querySelector('span')!
    expect(badge.className).toContain('status-pulse')

    const { container: plannedContainer } = render(<StatusBadge status="Planned" />)
    const plannedBadge = plannedContainer.querySelector('span')!
    expect(plannedBadge.className).not.toContain('status-pulse')
  })

  it('renders an icon element inside the badge', () => {
    const { container } = render(<StatusBadge status="Built" />)
    // Lucide icons render as SVG elements
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
