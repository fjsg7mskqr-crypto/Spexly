import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NodeWrapper } from './NodeWrapper'

// Mock the store
const mockToggleNodeExpanded = vi.fn()
const mockDeleteNode = vi.fn()
const mockToggleNodeCompleted = vi.fn()

vi.mock('@/store/canvasStore', () => ({
  useCanvasStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      toggleNodeExpanded: mockToggleNodeExpanded,
      deleteNode: mockDeleteNode,
      toggleNodeCompleted: mockToggleNodeCompleted,
    }),
}))

// Mock React Flow handles — use importOriginal to preserve other exports
vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>()
  return {
    ...actual,
    Handle: ({ type, position }: { type: string; position: string }) => (
      <div data-testid={`handle-${type}-${position}`} />
    ),
  }
})

describe('NodeWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with config label when no headerLabel provided', () => {
    render(
      <NodeWrapper id="test-1" type="idea" expanded={true} completed={false}>
        <div>content</div>
      </NodeWrapper>
    )

    expect(screen.getByText('Idea')).toBeInTheDocument()
  })

  it('renders with custom headerLabel', () => {
    render(
      <NodeWrapper id="test-1" type="idea" expanded={true} completed={false} headerLabel="My App">
        <div>content</div>
      </NodeWrapper>
    )

    expect(screen.getByText('My App')).toBeInTheDocument()
  })

  it('renders children when expanded', () => {
    render(
      <NodeWrapper id="test-1" type="idea" expanded={true} completed={false}>
        <div>test content</div>
      </NodeWrapper>
    )

    expect(screen.getByText('test content')).toBeInTheDocument()
  })

  it('renders headerExtra content', () => {
    render(
      <NodeWrapper id="test-1" type="feature" expanded={true} completed={false} headerExtra={<span>Extra</span>}>
        <div>content</div>
      </NodeWrapper>
    )

    expect(screen.getByText('Extra')).toBeInTheDocument()
  })

  it('calls toggleNodeExpanded when header is clicked', async () => {
    const user = userEvent.setup()

    render(
      <NodeWrapper id="test-1" type="idea" expanded={true} completed={false}>
        <div>content</div>
      </NodeWrapper>
    )

    await user.click(screen.getByText('Idea'))

    expect(mockToggleNodeExpanded).toHaveBeenCalledWith('test-1')
  })

  it('renders connection handles', () => {
    render(
      <NodeWrapper id="test-1" type="idea" expanded={true} completed={false}>
        <div>content</div>
      </NodeWrapper>
    )

    expect(screen.getByTestId('handle-target-left')).toBeInTheDocument()
    expect(screen.getByTestId('handle-source-right')).toBeInTheDocument()
  })

  it('renders delete button', () => {
    render(
      <NodeWrapper id="test-1" type="idea" expanded={true} completed={false}>
        <div>content</div>
      </NodeWrapper>
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2) // completion checkbox + delete
  })

  it('calls deleteNode when delete button is clicked', async () => {
    const user = userEvent.setup()

    render(
      <NodeWrapper id="test-1" type="idea" expanded={true} completed={false}>
        <div>content</div>
      </NodeWrapper>
    )

    // Delete button is the second button (after the completion checkbox)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await user.click(deleteButton)

    expect(mockDeleteNode).toHaveBeenCalledWith('test-1')
  })
})
