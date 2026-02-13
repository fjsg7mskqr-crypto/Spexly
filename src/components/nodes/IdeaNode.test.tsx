import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@/__tests__/utils/test-utils'
import IdeaNode from './IdeaNode'
import type { NodeProps } from '@xyflow/react'
import type { IdeaNode as IdeaNodeType } from '@/types/nodes'

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

function makeProps(overrides?: Partial<NodeProps<IdeaNodeType>>): NodeProps<IdeaNodeType> {
  return {
    id: 'idea-1',
    data: {
      appName: '',
      description: '',
      targetUser: '',
      coreProblem: '',
      expanded: true,
      completed: false,
      projectArchitecture: '',
      corePatterns: [],
      constraints: [],
      tags: [],
      estimatedHours: null,
      version: 0,
    },
    type: 'idea',
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
  } as NodeProps<IdeaNodeType>
}

describe('IdeaNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all input fields', () => {
    render(<IdeaNode {...makeProps()} />)

    expect(screen.getByPlaceholderText('App name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Target user')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Core problem')).toBeInTheDocument()
  })

  it('displays provided data values', () => {
    render(
      <IdeaNode
        {...makeProps({
          data: {
            appName: 'Test App',
            description: 'A test app',
            targetUser: 'Developers',
            coreProblem: 'Testing is hard',
            expanded: true,
            completed: false,
            projectArchitecture: '',
            corePatterns: [],
            constraints: [],
            tags: [],
            estimatedHours: null,
            version: 0,
          },
        })}
      />
    )

    expect(screen.getByDisplayValue('Test App')).toBeInTheDocument()
    expect(screen.getByDisplayValue('A test app')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Developers')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Testing is hard')).toBeInTheDocument()
  })

  it('calls updateNodeData when appName changes', async () => {
    const user = userEvent.setup()
    render(<IdeaNode {...makeProps()} />)

    const input = screen.getByPlaceholderText('App name')
    await user.type(input, 'New App')

    expect(mockUpdateNodeData).toHaveBeenCalled()
    expect(mockUpdateNodeData.mock.calls[0][0]).toBe('idea-1')
    expect(mockUpdateNodeData.mock.calls[0][1]).toHaveProperty('appName')
  })

  it('shows custom header label when appName is set', () => {
    render(
      <IdeaNode
        {...makeProps({
          data: { appName: 'My Cool App', description: '', targetUser: '', coreProblem: '', expanded: true, completed: false, projectArchitecture: '', corePatterns: [], constraints: [], tags: [], estimatedHours: null, version: 0 },
        })}
      />
    )

    expect(screen.getAllByText('My Cool App').length).toBeGreaterThanOrEqual(1)
  })

  it('shows default header "Idea" when appName is empty', () => {
    render(<IdeaNode {...makeProps()} />)

    expect(screen.getByText('Idea')).toBeInTheDocument()
  })
})
