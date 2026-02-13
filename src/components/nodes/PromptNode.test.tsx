import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@/__tests__/utils/test-utils'
import PromptNode from './PromptNode'
import type { NodeProps } from '@xyflow/react'
import type { PromptNode as PromptNodeType } from '@/types/nodes'

const mockUpdateNodeData = vi.fn()

vi.mock('@/store/canvasStore', () => ({
  useCanvasStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      updateNodeData: mockUpdateNodeData,
      toggleNodeExpanded: vi.fn(),
      deleteNode: vi.fn(),
      toggleNodeCompleted: vi.fn(),
      setNodeHeight: vi.fn(),
    }),
}))

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>()
  return {
    ...actual,
    Handle: ({ type, position }: { type: string; position: string }) => (
      <div data-testid={`handle-${type}-${position}`} />
    ),
  }
})

function makeProps(overrides?: Partial<NodeProps<PromptNodeType>>): NodeProps<PromptNodeType> {
  return {
    id: 'prompt-1',
    data: {
      promptText: 'Build an auth system',
      targetTool: 'Claude',
      resultNotes: 'Worked well',
      promptVersion: '',
      contextUsed: [],
      actualOutput: '',
      refinements: [],
      tags: [],
      estimatedHours: null,
      expanded: true,
      completed: false,
    },
    type: 'prompt',
    selected: false,
    isConnectable: true,
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    deletable: true,
    selectable: true,
    connectable: true,
    focusable: true,
    width: 240,
    height: 200,
    ...overrides,
  } as NodeProps<PromptNodeType>
}

describe('PromptNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders prompt textarea, target tool select, and result notes textarea', () => {
    render(<PromptNode {...makeProps()} />)
    expect(screen.getByPlaceholderText('Prompt text')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Result notes')).toBeInTheDocument()
  })

  it('shows all 6 target tool options', () => {
    render(<PromptNode {...makeProps()} />)
    // "Claude" appears in header subtitle and in select option
    expect(screen.getAllByText('Claude').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Bolt')).toBeInTheDocument()
    expect(screen.getByText('Cursor')).toBeInTheDocument()
    expect(screen.getByText('Lovable')).toBeInTheDocument()
    expect(screen.getByText('Replit')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('calls updateNodeData on prompt text change', async () => {
    const user = userEvent.setup()
    render(<PromptNode {...makeProps()} />)

    await user.type(screen.getByPlaceholderText('Prompt text'), 'X')
    expect(mockUpdateNodeData).toHaveBeenCalled()
    expect(mockUpdateNodeData.mock.calls[0][0]).toBe('prompt-1')
  })

  it('calls updateNodeData on target tool change', async () => {
    const user = userEvent.setup()
    render(<PromptNode {...makeProps()} />)

    await user.selectOptions(screen.getByRole('combobox'), 'Cursor')
    expect(mockUpdateNodeData).toHaveBeenCalledWith('prompt-1', { targetTool: 'Cursor' })
  })

  it('shows header with target tool label', () => {
    render(<PromptNode {...makeProps()} />)
    expect(screen.getByText(/Prompt → Claude/)).toBeInTheDocument()
  })

  it('shows fallback header when no target tool', () => {
    render(
      <PromptNode
        {...makeProps({
          data: { ...makeProps().data, targetTool: '' as never },
        } as Partial<NodeProps<PromptNodeType>>)}
      />
    )
    // "Prompt" appears in header and as a label, so verify at least one exists
    expect(screen.getAllByText('Prompt').length).toBeGreaterThanOrEqual(1)
  })
})
