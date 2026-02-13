import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@/__tests__/utils/test-utils'
import TechStackNode from './TechStackNode'
import type { NodeProps } from '@xyflow/react'
import type { TechStackNode as TechStackNodeType } from '@/types/nodes'

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

function makeProps(overrides?: Partial<NodeProps<TechStackNodeType>>): NodeProps<TechStackNodeType> {
  return {
    id: 'tech-1',
    data: {
      category: 'Frontend',
      toolName: 'React',
      notes: 'A JavaScript library',
      version: '',
      rationale: '',
      configurationNotes: '',
      integrationWith: [],
      tags: [],
      estimatedHours: null,
      expanded: true,
      completed: false,
    },
    type: 'techStack',
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
  } as NodeProps<TechStackNodeType>
}

describe('TechStackNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders category select with 6 options', () => {
    render(<TechStackNode {...makeProps()} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    // "Frontend" appears both in the select option and as subtitle text
    expect(screen.getAllByText('Frontend').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Backend')).toBeInTheDocument()
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Auth')).toBeInTheDocument()
    expect(screen.getByText('Hosting')).toBeInTheDocument()
    // "Other" may also appear in header area
    expect(screen.getAllByText('Other').length).toBeGreaterThanOrEqual(1)
  })

  it('renders tool name input and notes textarea', () => {
    render(<TechStackNode {...makeProps()} />)
    expect(screen.getByPlaceholderText('Tool name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Notes')).toBeInTheDocument()
  })

  it('calls updateNodeData on category change', async () => {
    const user = userEvent.setup()
    render(<TechStackNode {...makeProps()} />)

    await user.selectOptions(screen.getByRole('combobox'), 'Backend')
    expect(mockUpdateNodeData).toHaveBeenCalledWith('tech-1', { category: 'Backend' })
  })

  it('calls updateNodeData on tool name change', async () => {
    const user = userEvent.setup()
    render(<TechStackNode {...makeProps()} />)

    await user.type(screen.getByPlaceholderText('Tool name'), 'X')
    expect(mockUpdateNodeData).toHaveBeenCalled()
    expect(mockUpdateNodeData.mock.calls[0][0]).toBe('tech-1')
  })

  it('shows header with toolName or fallback', () => {
    render(<TechStackNode {...makeProps()} />)
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('shows fallback header when toolName is empty', () => {
    render(
      <TechStackNode
        {...makeProps({
          data: { ...makeProps().data, toolName: '' },
        } as Partial<NodeProps<TechStackNodeType>>)}
      />
    )
    expect(screen.getByText('Tech Stack')).toBeInTheDocument()
  })
})
