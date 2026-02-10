import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@/__tests__/utils/test-utils'
import FeatureNode from './FeatureNode'
import type { NodeProps } from '@xyflow/react'
import type { FeatureNode as FeatureNodeType } from '@/types/nodes'

const mockUpdateNodeData = vi.fn()

vi.mock('@/store/canvasStore', () => ({
  useCanvasStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      updateNodeData: mockUpdateNodeData,
      toggleNodeExpanded: vi.fn(),
      deleteNode: vi.fn(),
      toggleNodeCompleted: vi.fn(),
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

function makeProps(overrides?: Partial<NodeProps<FeatureNodeType>>): NodeProps<FeatureNodeType> {
  return {
    id: 'feature-1',
    data: {
      featureName: '',
      description: '',
      priority: 'Must',
      status: 'Planned',
      expanded: true,
      completed: false,
    },
    type: 'feature',
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
  } as NodeProps<FeatureNodeType>
}

describe('FeatureNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all fields', () => {
    render(<FeatureNode {...makeProps()} />)

    expect(screen.getByPlaceholderText('Feature name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(2)
  })

  it('renders StatusBadge with current status', () => {
    render(<FeatureNode {...makeProps()} />)

    // "Planned" appears in both badge and select option
    expect(screen.getAllByText('Planned').length).toBeGreaterThanOrEqual(1)
  })

  it('shows correct priority options', () => {
    render(<FeatureNode {...makeProps()} />)

    expect(screen.getByText('Must Have')).toBeInTheDocument()
    expect(screen.getByText('Should Have')).toBeInTheDocument()
    expect(screen.getByText('Nice to Have')).toBeInTheDocument()
  })

  it('shows correct status options', () => {
    render(<FeatureNode {...makeProps()} />)

    expect(screen.getAllByText('Planned').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Built')).toBeInTheDocument()
    expect(screen.getByText('Broken')).toBeInTheDocument()
    expect(screen.getByText('Blocked')).toBeInTheDocument()
  })

  it('calls updateNodeData when feature name changes', async () => {
    const user = userEvent.setup()
    render(<FeatureNode {...makeProps()} />)

    const input = screen.getByPlaceholderText('Feature name')
    await user.type(input, 'Login')

    expect(mockUpdateNodeData).toHaveBeenCalled()
    expect(mockUpdateNodeData.mock.calls[0][0]).toBe('feature-1')
  })

  it('calls updateNodeData when priority select changes', async () => {
    const user = userEvent.setup()
    render(<FeatureNode {...makeProps()} />)

    const selects = screen.getAllByRole('combobox')
    const prioritySelect = selects[0]
    await user.selectOptions(prioritySelect, 'Should')

    expect(mockUpdateNodeData).toHaveBeenCalledWith('feature-1', { priority: 'Should' })
  })

  it('calls updateNodeData when status select changes', async () => {
    const user = userEvent.setup()
    render(<FeatureNode {...makeProps()} />)

    const selects = screen.getAllByRole('combobox')
    const statusSelect = selects[1]
    await user.selectOptions(statusSelect, 'Built')

    expect(mockUpdateNodeData).toHaveBeenCalledWith('feature-1', { status: 'Built' })
  })
})
