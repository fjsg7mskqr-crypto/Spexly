'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Plus } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/store/canvasStore';
import { NODE_TYPE_CONFIGS } from '@/lib/constants';
import type { SpexlyNodeType } from '@/types/nodes';

export function AddNodeMenu() {
  const addNode = useCanvasStore((s) => s.addNode);
  const reactFlowInstance = useReactFlow();

  const handleAddNode = (type: SpexlyNodeType) => {
    const center = reactFlowInstance.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    addNode(type, center);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700">
          <Plus size={16} />
          Add Node
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[180px] rounded-xl border border-white/10 bg-slate-800 p-1 shadow-xl shadow-black/40"
          sideOffset={8}
          align="end"
        >
          {Object.values(NODE_TYPE_CONFIGS).map((config) => {
            const Icon = config.icon;
            return (
              <DropdownMenu.Item
                key={config.type}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white outline-none hover:bg-white/5 data-[highlighted]:bg-white/5"
                onSelect={() => handleAddNode(config.type)}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ backgroundColor: config.color + '20' }}
                >
                  <Icon size={14} style={{ color: config.color }} />
                </div>
                {config.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
