import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@/__tests__/utils/test-utils'
import { ProjectCard } from './ProjectCard'
import type { Project } from '@/types/project'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-123',
    user_id: 'user-1',
    name: 'My Project',
    canvas_data: {
      nodes: [{ id: '1' }, { id: '2' }],
      edges: [{ id: 'e1' }],
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-06-15T12:00:00Z',
    ...overrides,
  } as Project
}

describe('ProjectCard', () => {
  const mockOnRename = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders project name as a link to /project/{id}', () => {
    render(<ProjectCard project={makeProject()} onRename={mockOnRename} onDelete={mockOnDelete} />)
    const link = screen.getByRole('link', { name: 'My Project' })
    expect(link).toHaveAttribute('href', '/project/proj-123')
  })

  it('shows node count and edge count', () => {
    render(<ProjectCard project={makeProject()} onRename={mockOnRename} onDelete={mockOnDelete} />)
    expect(screen.getByText('2 nodes')).toBeInTheDocument()
    expect(screen.getByText('1 edges')).toBeInTheDocument()
  })

  it('shows formatted date', () => {
    render(<ProjectCard project={makeProject()} onRename={mockOnRename} onDelete={mockOnDelete} />)
    expect(screen.getByText(/Jun 15, 2025/)).toBeInTheDocument()
  })

  it('enters edit mode on rename button click', async () => {
    const user = userEvent.setup()
    render(<ProjectCard project={makeProject()} onRename={mockOnRename} onDelete={mockOnDelete} />)

    await user.click(screen.getByTitle('Rename'))
    // Should show an input instead of the link
    expect(screen.getByDisplayValue('My Project')).toBeInTheDocument()
  })

  it('calls onRename on Enter key', async () => {
    const user = userEvent.setup()
    render(<ProjectCard project={makeProject()} onRename={mockOnRename} onDelete={mockOnDelete} />)

    await user.click(screen.getByTitle('Rename'))
    const input = screen.getByDisplayValue('My Project')
    await user.clear(input)
    await user.type(input, 'New Name{Enter}')

    expect(mockOnRename).toHaveBeenCalledWith('proj-123', 'New Name')
  })

  it('cancels rename on Escape key', async () => {
    const user = userEvent.setup()
    render(<ProjectCard project={makeProject()} onRename={mockOnRename} onDelete={mockOnDelete} />)

    await user.click(screen.getByTitle('Rename'))
    const input = screen.getByDisplayValue('My Project')
    await user.clear(input)
    await user.type(input, 'Changed{Escape}')

    expect(mockOnRename).not.toHaveBeenCalled()
    // Should go back to showing the link
    expect(screen.getByRole('link', { name: 'My Project' })).toBeInTheDocument()
  })

  it('shows delete button', () => {
    render(<ProjectCard project={makeProject()} onRename={mockOnRename} onDelete={mockOnDelete} />)
    expect(screen.getByTitle('Delete')).toBeInTheDocument()
  })

  it('handles project with no canvas data', () => {
    const project = makeProject({ canvas_data: null as never })
    render(<ProjectCard project={project} onRename={mockOnRename} onDelete={mockOnDelete} />)
    expect(screen.getByText('0 nodes')).toBeInTheDocument()
    expect(screen.getByText('0 edges')).toBeInTheDocument()
  })
})
