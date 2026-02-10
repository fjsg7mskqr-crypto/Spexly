import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@/__tests__/utils/test-utils';
import { ProjectWizard } from './ProjectWizard';

const mockSetNodesAndEdges = vi.fn();

vi.mock('@/store/canvasStore', () => ({
  useCanvasStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      nodes: [],
      setNodesAndEdges: mockSetNodesAndEdges,
      toggleNodeExpanded: vi.fn(),
      deleteNode: vi.fn(),
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

describe('ProjectWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders first question when open', () => {
    render(<ProjectWizard isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('What does your app do?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ProjectWizard isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('What does your app do?')).not.toBeInTheDocument();
  });

  it('advances to next step on Next click', async () => {
    const user = userEvent.setup();
    render(<ProjectWizard isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByText('Next'));
    expect(screen.getByText('Who is it for?')).toBeInTheDocument();
  });

  it('goes back on Back click', async () => {
    const user = userEvent.setup();
    render(<ProjectWizard isOpen={true} onClose={vi.fn()} />);

    await user.click(screen.getByText('Next'));
    expect(screen.getByText('Who is it for?')).toBeInTheDocument();

    await user.click(screen.getByText('Back'));
    expect(screen.getByText('What does your app do?')).toBeInTheDocument();
  });

  it('Back button is disabled on first step', () => {
    render(<ProjectWizard isOpen={true} onClose={vi.fn()} />);
    const backBtn = screen.getByText('Back');
    expect(backBtn).toBeDisabled();
  });

  it('shows Generate button on last step', async () => {
    const user = userEvent.setup();
    render(<ProjectWizard isOpen={true} onClose={vi.fn()} />);

    // Navigate to the last step (step 5, 0-indexed)
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByText('Next'));
    }

    expect(screen.getByText('Generate')).toBeInTheDocument();
  });

  it('calls setNodesAndEdges on generate with empty canvas', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ProjectWizard isOpen={true} onClose={onClose} />);

    // Fill in some answers and navigate
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByText('Next'));
    }

    await user.click(screen.getByText('Generate'));
    expect(mockSetNodesAndEdges).toHaveBeenCalled();
  });

  it('shows step indicator with correct number of dots', () => {
    render(<ProjectWizard isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
  });
});
