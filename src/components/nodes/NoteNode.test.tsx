import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '@/__tests__/utils/test-utils'
import NoteNode from './NoteNode'
import type { NodeProps } from '@xyflow/react'
import type { NoteNode as NoteNodeType } from '@/types/nodes'

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

function makeProps(overrides?: Partial<NodeProps<NoteNodeType>>): NodeProps<NoteNodeType> {
  return {
    id: 'note-1',
    data: {
      title: 'My Note',
      body: 'Note body content here',
      colorTag: 'Slate',
      expanded: true,
      completed: false,
      tags: [],
      estimatedHours: null,
    },
    type: 'note',
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
  } as NodeProps<NoteNodeType>
}

describe('NoteNode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title input, color tag select, and body textarea', () => {
    render(<NoteNode {...makeProps()} />)
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Body')).toBeInTheDocument()
  })

  it('calls updateNodeData on title change', async () => {
    const user = userEvent.setup()
    render(<NoteNode {...makeProps()} />)

    await user.type(screen.getByPlaceholderText('Title'), 'X')
    expect(mockUpdateNodeData).toHaveBeenCalled()
    expect(mockUpdateNodeData.mock.calls[0][0]).toBe('note-1')
  })

  it('calls updateNodeData on color tag change', async () => {
    const user = userEvent.setup()
    render(<NoteNode {...makeProps()} />)

    await user.selectOptions(screen.getByRole('combobox'), 'Amber')
    expect(mockUpdateNodeData).toHaveBeenCalledWith('note-1', { colorTag: 'Amber' })
  })

  it('calls updateNodeData on body change', async () => {
    const user = userEvent.setup()
    render(<NoteNode {...makeProps()} />)

    await user.type(screen.getByPlaceholderText('Body'), 'X')
    expect(mockUpdateNodeData).toHaveBeenCalled()
  })

  it('shows header with title or fallback "Note"', () => {
    const { rerender } = render(<NoteNode {...makeProps()} />)
    expect(screen.getByText('My Note')).toBeInTheDocument()

    rerender(
      <NoteNode
        {...makeProps({
          data: { ...makeProps().data, title: '' },
        } as Partial<NodeProps<NoteNodeType>>)}
      />
    )
    expect(screen.getByText('Note')).toBeInTheDocument()
  })

  it('displays body preview truncated at 80 chars', () => {
    const longBody = 'A'.repeat(100)
    render(
      <NoteNode
        {...makeProps({
          data: { ...makeProps().data, body: longBody },
        } as Partial<NodeProps<NoteNodeType>>)}
      />
    )
    // The subtitle should contain the truncated body with ellipsis
    const truncated = longBody.slice(0, 80) + '…'
    expect(screen.getByText(truncated)).toBeInTheDocument()
  })
})
