import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@/__tests__/utils/test-utils'
import ScreenNode from './ScreenNode'
import type { NodeProps } from '@xyflow/react'
import type { ScreenNode as ScreenNodeType } from '@/types/nodes'

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

vi.mock('@/app/actions/enhanceNodeWithAI', () => ({
  enhanceScreenWithAI: vi.fn(),
}))

function makeProps(overrides?: Partial<NodeProps<ScreenNodeType>>): NodeProps<ScreenNodeType> {
  return {
    id: 'screen-1',
    data: {
      screenName: 'Dashboard',
      purpose: 'Main overview page',
      keyElements: ['Stats card', 'Chart'],
      userActions: ['View stats'],
      states: ['Loading', 'Loaded'],
      navigation: 'From sidebar',
      dataSources: [],
      wireframeUrl: '',
      notes: '',
      aiContext: '',
      acceptanceCriteria: [],
      componentHierarchy: [],
      codeReferences: [],
      testingRequirements: '',
      tags: [],
      estimatedHours: null,
      version: 1,
      expanded: true,
      completed: false,
    },
    type: 'screen',
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
  } as NodeProps<ScreenNodeType>
}

describe('ScreenNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders screen name input', () => {
    render(<ScreenNode {...makeProps()} />)
    expect(screen.getByPlaceholderText('Screen name')).toBeInTheDocument()
  })

  it('renders purpose textarea', () => {
    render(<ScreenNode {...makeProps()} />)
    expect(screen.getByPlaceholderText('What is this screen for?')).toBeInTheDocument()
  })

  it('renders key elements, user actions, and states textareas', () => {
    render(<ScreenNode {...makeProps()} />)
    expect(screen.getByPlaceholderText('Major UI components (one per line)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('What can users do? (one per line)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Empty, loading, error states (one per line)')).toBeInTheDocument()
  })

  it('renders navigation textarea', () => {
    render(<ScreenNode {...makeProps()} />)
    expect(screen.getByPlaceholderText('How users get to/from this screen')).toBeInTheDocument()
  })

  it('calls updateNodeData on screen name change', async () => {
    const user = userEvent.setup()
    render(<ScreenNode {...makeProps()} />)

    const input = screen.getByPlaceholderText('Screen name')
    await user.type(input, 'X')

    expect(mockUpdateNodeData).toHaveBeenCalled()
    expect(mockUpdateNodeData.mock.calls[0][0]).toBe('screen-1')
  })

  it('shows Generate with AI button', () => {
    render(<ScreenNode {...makeProps()} />)
    expect(screen.getByText(/generate with ai/i)).toBeInTheDocument()
  })

  it('displays header with screenName or fallback', () => {
    const { rerender } = render(<ScreenNode {...makeProps()} />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    rerender(
      <ScreenNode
        {...makeProps({
          data: { ...makeProps().data, screenName: '' },
        } as Partial<NodeProps<ScreenNodeType>>)}
      />
    )
    expect(screen.getByText('Screen')).toBeInTheDocument()
  })
})
