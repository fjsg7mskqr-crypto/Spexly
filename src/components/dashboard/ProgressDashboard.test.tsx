import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@/__tests__/utils/test-utils';
import { ProgressDashboard } from './ProgressDashboard';
import type { SpexlyNode, SpexlyEdge } from '@/types/nodes';

let mockNodes: SpexlyNode[] = [];
let mockEdges: SpexlyEdge[] = [];

vi.mock('@/store/canvasStore', () => ({
  useCanvasStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      nodes: mockNodes,
      edges: mockEdges,
    }),
}));

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    Handle: ({ type, position }: { type: string; position: string }) => (
      <div data-testid={`handle-${type}-${position}`} />
    ),
  };
});

function makeFeatureNode(id: string, status: string): SpexlyNode {
  return {
    id,
    type: 'feature',
    position: { x: 0, y: 0 },
    data: { featureName: id, description: '', priority: 'Must', status, expanded: true, completed: false },
  } as SpexlyNode;
}

function makeNode(id: string, type: string): SpexlyNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { expanded: true, completed: false },
  } as SpexlyNode;
}

function setupDefault() {
  mockNodes = [
    makeNode('i1', 'idea'),
    makeFeatureNode('f1', 'Planned'),
    makeFeatureNode('f2', 'Built'),
    makeNode('s1', 'screen'),
    makeNode('t1', 'techStack'),
  ];
  mockEdges = [
    { id: 'e1', source: 'i1', target: 'f1' },
    { id: 'e2', source: 'i1', target: 'f2' },
    { id: 'e3', source: 'f1', target: 's1' },
  ];
}

describe('ProgressDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefault();
  });

  it('renders panel when open', () => {
    render(<ProgressDashboard isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Project Progress')).toBeInTheDocument();
  });

  it('displays total node count', () => {
    render(<ProgressDashboard isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Nodes')).toBeInTheDocument();
  });

  it('displays total edge count', () => {
    render(<ProgressDashboard isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Edges')).toBeInTheDocument();
  });

  it('displays node type breakdown', () => {
    render(<ProgressDashboard isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Idea')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
    expect(screen.getByText('Screen')).toBeInTheDocument();
  });

  it('displays feature status counts when features exist', () => {
    render(<ProgressDashboard isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Feature Status')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Built')).toBeInTheDocument();
  });

  it('shows correct completion percentage', () => {
    render(<ProgressDashboard isOpen={true} onClose={vi.fn()} />);
    // 1 built out of 2 total features = 50%
    expect(screen.getByText(/50% Complete/)).toBeInTheDocument();
  });

  it('hides feature status when no features exist', () => {
    mockNodes = [makeNode('i1', 'idea'), makeNode('n1', 'note')];
    mockEdges = [];
    render(<ProgressDashboard isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Feature Status')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProgressDashboard isOpen={true} onClose={onClose} />);

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]); // close button
    expect(onClose).toHaveBeenCalled();
  });
});
