'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { NODE_TYPE_CONFIGS, NOTE_COLOR_OPTIONS } from '@/lib/constants';
import { enhanceFeatureWithAI, enhanceScreenWithAI } from '@/app/actions/enhanceNodeWithAI';
import type {
  SpexlyNode,
  SpexlyNodeType,
  IdeaNodeData,
  FeatureNodeData,
  ScreenNodeData,
  TechStackNodeData,
  PromptNodeData,
  NoteNodeData,
  FeaturePriority,
  FeatureStatus,
  FeatureEffort,
  TechCategory,
  TargetTool,
  NoteColorTag,
} from '@/types/nodes';

interface NodeDetailSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full rounded-lg border border-slate-600/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 transition-colors';

export function NodeDetailSidebar({ isOpen, onClose }: NodeDetailSidebarProps) {
  const sidebarNodeId = useCanvasStore((s) => s.sidebarNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const node = nodes.find((n) => n.id === sidebarNodeId) as SpexlyNode | undefined;

  if (!node) {
    return (
      <div
        className={`fixed left-0 top-0 z-30 h-screen w-[400px] border-r border-white/10 bg-slate-900 transition-transform duration-300 ease-in-out ${
          isOpen && sidebarNodeId ? 'translate-x-0' : '-translate-x-full'
        }`}
      />
    );
  }

  const nodeType = node.type as SpexlyNodeType;
  const config = NODE_TYPE_CONFIGS[nodeType];
  const Icon = config.icon;

  return (
    <div
      className={`fixed left-0 top-0 z-30 h-screen w-[400px] border-r border-white/10 bg-slate-900 transition-transform duration-300 ease-in-out ${
        isOpen && sidebarNodeId ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-slate-900 px-4 py-3">
          <Icon size={16} style={{ color: config.color }} className="shrink-0" />
          <span className="text-sm font-semibold text-slate-100 flex-1 truncate">
            {getNodeTitle(node)}
          </span>
          <span
            className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: config.color + '20', color: config.color }}
          >
            {config.label}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors ml-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 p-4">
          <NodeFields node={node} updateNodeData={updateNodeData} />
        </div>
      </div>
    </div>
  );
}

function getNodeTitle(node: SpexlyNode): string {
  const data = node.data;
  switch (node.type) {
    case 'idea':
      return (data as IdeaNodeData).appName || 'Idea';
    case 'feature':
      return (data as FeatureNodeData).featureName || 'Feature';
    case 'screen':
      return (data as ScreenNodeData).screenName || 'Screen';
    case 'techStack':
      return (data as TechStackNodeData).toolName || 'Tech Stack';
    case 'prompt':
      return (data as PromptNodeData).targetTool
        ? `Prompt → ${(data as PromptNodeData).targetTool}`
        : 'Prompt';
    case 'note':
      return (data as NoteNodeData).title || 'Note';
    default:
      return 'Node';
  }
}

// ─── Field renderers per node type ────────────────────────

interface NodeFieldsProps {
  node: SpexlyNode;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
}

function NodeFields({ node, updateNodeData }: NodeFieldsProps) {
  switch (node.type) {
    case 'idea':
      return <IdeaFields id={node.id} data={node.data as IdeaNodeData} update={updateNodeData} />;
    case 'feature':
      return <FeatureFields id={node.id} data={node.data as FeatureNodeData} update={updateNodeData} />;
    case 'screen':
      return <ScreenFields id={node.id} data={node.data as ScreenNodeData} update={updateNodeData} />;
    case 'techStack':
      return <TechStackFields id={node.id} data={node.data as TechStackNodeData} update={updateNodeData} />;
    case 'prompt':
      return <PromptFields id={node.id} data={node.data as PromptNodeData} update={updateNodeData} />;
    case 'note':
      return <NoteFields id={node.id} data={node.data as NoteNodeData} update={updateNodeData} />;
    default:
      return null;
  }
}

// ─── Shared label + input helpers ─────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs text-slate-400 uppercase tracking-wide mb-1">{children}</label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ─── Idea ─────────────────────────────────────────────────

function IdeaFields({
  id,
  data,
  update,
}: {
  id: string;
  data: IdeaNodeData;
  update: (id: string, d: Record<string, unknown>) => void;
}) {
  const [showAi, setShowAi] = useState(false);
  const corePatterns = Array.isArray(data.corePatterns) ? data.corePatterns : [];
  const constraints = Array.isArray(data.constraints) ? data.constraints : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  return (
    <>
      <Field label="App Name">
        <input className={inputClass} placeholder="App name" value={data.appName} onChange={(e) => update(id, { appName: e.target.value })} />
      </Field>
      <Field label="Description">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Description" rows={3} value={data.description} onChange={(e) => update(id, { description: e.target.value })} />
      </Field>
      <Field label="Target User">
        <input className={inputClass} placeholder="Target user" value={data.targetUser} onChange={(e) => update(id, { targetUser: e.target.value })} />
      </Field>
      <Field label="Core Problem">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Core problem" rows={3} value={data.coreProblem} onChange={(e) => update(id, { coreProblem: e.target.value })} />
      </Field>

      <div className="border-t border-slate-700/50 pt-3">
        <button className="w-full flex items-center justify-between text-sm text-violet-400 hover:text-violet-300 transition-colors mb-2" onClick={() => setShowAi(!showAi)}>
          <span className="font-medium">Architecture & Context</span>
          <span className="text-xs">{showAi ? '▼' : '▶'}</span>
        </button>
        {showAi && (
          <div className="space-y-4">
            <Field label="Project Architecture">
              <textarea className={`${inputClass} min-h-[120px] resize-y`} placeholder="High-level system design..." rows={4} value={data.projectArchitecture ?? ''} onChange={(e) => update(id, { projectArchitecture: e.target.value })} />
            </Field>
            <Field label="Core Patterns">
              <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="One per line" rows={3} value={corePatterns.join('\n')} onChange={(e) => update(id, { corePatterns: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Technical Constraints">
              <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="One per line" rows={3} value={constraints.join('\n')} onChange={(e) => update(id, { constraints: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Tags">
              <input className={inputClass} placeholder="comma, separated, tags" value={tags.join(', ')} onChange={(e) => update(id, { tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Estimated Hours">
              <input type="number" className={inputClass} placeholder="Optional" value={data.estimatedHours ?? ''} onChange={(e) => update(id, { estimatedHours: e.target.value ? Number(e.target.value) : null })} />
            </Field>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Feature ──────────────────────────────────────────────

function FeatureFields({
  id,
  data,
  update,
}: {
  id: string;
  data: FeatureNodeData;
  update: (id: string, d: Record<string, unknown>) => void;
}) {
  const [showAi, setShowAi] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const acceptanceCriteria = Array.isArray(data.acceptanceCriteria) ? data.acceptanceCriteria : [];
  const dependencies = Array.isArray(data.dependencies) ? data.dependencies : [];
  const implementationSteps = Array.isArray(data.implementationSteps) ? data.implementationSteps : [];
  const codeReferences = Array.isArray(data.codeReferences) ? data.codeReferences : [];
  const relatedFiles = Array.isArray(data.relatedFiles) ? data.relatedFiles : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const result = await enhanceFeatureWithAI({
        featureName: data.featureName,
        summary: data.summary,
        problem: data.problem,
        userStory: data.userStory,
        acceptanceCriteria,
        technicalConstraints: data.technicalConstraints,
      });
      if (result.success && result.data) {
        const updates: Record<string, unknown> = {};
        // Fill main fields only if currently empty
        if (!data.summary?.trim() && result.data.summary) updates.summary = result.data.summary;
        if (!data.problem?.trim() && result.data.problem) updates.problem = result.data.problem;
        if (!data.userStory?.trim() && result.data.userStory) updates.userStory = result.data.userStory;
        if (!data.risks?.trim() && result.data.risks) updates.risks = result.data.risks;
        if (!data.metrics?.trim() && result.data.metrics) updates.metrics = result.data.metrics;
        if (acceptanceCriteria.length === 0 && result.data.acceptanceCriteria.length > 0) {
          updates.acceptanceCriteria = result.data.acceptanceCriteria;
        }
        if (dependencies.length === 0 && result.data.dependencies.length > 0) {
          updates.dependencies = result.data.dependencies;
        }
        // Always update AI-specific fields
        updates.aiContext = result.data.aiContext;
        updates.implementationSteps = result.data.implementationSteps;
        updates.codeReferences = result.data.codeReferences;
        updates.testingRequirements = result.data.testingRequirements;
        updates.relatedFiles = result.data.relatedFiles;
        updates.technicalConstraints = result.data.technicalConstraints;
        update(id, updates);
        setShowAi(true);
      } else {
        alert(`Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Field label="Feature Name">
        <input className={inputClass} placeholder="Feature name" value={data.featureName} onChange={(e) => update(id, { featureName: e.target.value })} />
      </Field>
      <Field label="Summary">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="1-2 sentence summary" rows={3} value={data.summary} onChange={(e) => update(id, { summary: e.target.value })} />
      </Field>
      <Field label="Problem">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="What pain does this solve?" rows={3} value={data.problem} onChange={(e) => update(id, { problem: e.target.value })} />
      </Field>
      <Field label="User Story">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="As a ___, I want ___ so that ___" rows={3} value={data.userStory} onChange={(e) => update(id, { userStory: e.target.value })} />
      </Field>
      <Field label="Acceptance Criteria">
        <textarea className={`${inputClass} min-h-[120px] resize-y`} placeholder="One criterion per line" rows={4} value={acceptanceCriteria.join('\n')} onChange={(e) => update(id, { acceptanceCriteria: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Priority">
          <select className={inputClass} value={data.priority} onChange={(e) => update(id, { priority: e.target.value as FeaturePriority })}>
            <option value="Must">Must Have</option>
            <option value="Should">Should Have</option>
            <option value="Nice">Nice to Have</option>
          </select>
        </Field>
        <Field label="Status">
          <select className={inputClass} value={data.status} onChange={(e) => update(id, { status: e.target.value as FeatureStatus })}>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Built">Built</option>
            <option value="Broken">Broken</option>
            <option value="Blocked">Blocked</option>
          </select>
        </Field>
        <Field label="Effort">
          <select className={inputClass} value={data.effort} onChange={(e) => update(id, { effort: e.target.value as FeatureEffort })}>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
        </Field>
      </div>

      <Field label="Dependencies">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="One dependency per line" rows={3} value={dependencies.join('\n')} onChange={(e) => update(id, { dependencies: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
      </Field>
      <Field label="Risks">
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Risks or unknowns" rows={2} value={data.risks} onChange={(e) => update(id, { risks: e.target.value })} />
      </Field>
      <Field label="Success Metrics">
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="How will we measure success?" rows={2} value={data.metrics} onChange={(e) => update(id, { metrics: e.target.value })} />
      </Field>
      <Field label="Notes">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Additional context" rows={3} value={data.notes} onChange={(e) => update(id, { notes: e.target.value })} />
      </Field>

      {/* AI Context Section */}
      <div className="border-t border-slate-700/50 pt-3">
        <div className="flex items-center justify-between mb-2">
          <button className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors" onClick={() => setShowAi(!showAi)}>
            <span className="font-medium">AI Context & Implementation</span>
            <span className="text-xs">{showAi ? '▼' : '▶'}</span>
          </button>
          <button
            className="px-3 py-1 text-xs font-medium text-violet-400 hover:text-violet-300 border border-violet-500/30 rounded-md hover:border-violet-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            onClick={handleGenerateAI}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
        {showAi && (
          <div className="space-y-4">
            <Field label="AI Context">
              <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Information for AI..." rows={3} value={data.aiContext ?? ''} onChange={(e) => update(id, { aiContext: e.target.value })} />
            </Field>
            <Field label="Implementation Steps">
              <textarea className={`${inputClass} min-h-[120px] resize-y`} placeholder="One step per line" rows={4} value={implementationSteps.join('\n')} onChange={(e) => update(id, { implementationSteps: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Code References">
              <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="One per line" rows={3} value={codeReferences.join('\n')} onChange={(e) => update(id, { codeReferences: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Related Files">
              <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="One file path per line" rows={3} value={relatedFiles.join('\n')} onChange={(e) => update(id, { relatedFiles: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Testing Requirements">
              <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Test coverage needs" rows={3} value={data.testingRequirements ?? ''} onChange={(e) => update(id, { testingRequirements: e.target.value })} />
            </Field>
            <Field label="Technical Constraints">
              <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Platform limitations, performance..." rows={2} value={data.technicalConstraints ?? ''} onChange={(e) => update(id, { technicalConstraints: e.target.value })} />
            </Field>
            <Field label="Tags">
              <input className={inputClass} placeholder="comma, separated, tags" value={tags.join(', ')} onChange={(e) => update(id, { tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Estimated Hours">
              <input type="number" className={inputClass} placeholder="Optional" value={data.estimatedHours ?? ''} onChange={(e) => update(id, { estimatedHours: e.target.value ? Number(e.target.value) : null })} />
            </Field>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────

function ScreenFields({
  id,
  data,
  update,
}: {
  id: string;
  data: ScreenNodeData;
  update: (id: string, d: Record<string, unknown>) => void;
}) {
  const [showAi, setShowAi] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const keyElements = Array.isArray(data.keyElements) ? data.keyElements : [];
  const userActions = Array.isArray(data.userActions) ? data.userActions : [];
  const states = Array.isArray(data.states) ? data.states : [];
  const dataSources = Array.isArray(data.dataSources) ? data.dataSources : [];
  const acceptanceCriteria = Array.isArray(data.acceptanceCriteria) ? data.acceptanceCriteria : [];
  const componentHierarchy = Array.isArray(data.componentHierarchy) ? data.componentHierarchy : [];
  const codeReferences = Array.isArray(data.codeReferences) ? data.codeReferences : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const result = await enhanceScreenWithAI({
        screenName: data.screenName,
        purpose: data.purpose ?? '',
        keyElements,
        userActions,
        states,
      });
      if (result.success && result.data) {
        const updates: Record<string, unknown> = {};
        // Fill main fields only if currently empty
        if (!data.purpose?.trim() && result.data.purpose) updates.purpose = result.data.purpose;
        if (!data.navigation?.trim() && result.data.navigation) updates.navigation = result.data.navigation;
        if (keyElements.length === 0 && result.data.keyElements.length > 0) {
          updates.keyElements = result.data.keyElements;
        }
        if (userActions.length === 0 && result.data.userActions.length > 0) {
          updates.userActions = result.data.userActions;
        }
        if (states.length === 0 && result.data.states.length > 0) {
          updates.states = result.data.states;
        }
        if (dataSources.length === 0 && result.data.dataSources.length > 0) {
          updates.dataSources = result.data.dataSources;
        }
        // Always update AI-specific fields
        updates.aiContext = result.data.aiContext;
        updates.componentHierarchy = result.data.componentHierarchy;
        updates.codeReferences = result.data.codeReferences;
        updates.testingRequirements = result.data.testingRequirements;
        update(id, updates);
        setShowAi(true);
      } else {
        alert(`Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to generate'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Field label="Screen Name">
        <input className={inputClass} placeholder="Screen name" value={data.screenName} onChange={(e) => update(id, { screenName: e.target.value })} />
      </Field>
      <Field label="Purpose">
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="What is this screen for?" rows={2} value={data.purpose ?? ''} onChange={(e) => update(id, { purpose: e.target.value })} />
      </Field>
      <Field label="Key Elements">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Major UI components (one per line)" rows={3} value={keyElements.join('\n')} onChange={(e) => update(id, { keyElements: e.target.value.split('\n').filter((l) => l.trim()) })} />
      </Field>
      <Field label="User Actions">
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="What can users do? (one per line)" rows={2} value={userActions.join('\n')} onChange={(e) => update(id, { userActions: e.target.value.split('\n').filter((l) => l.trim()) })} />
      </Field>
      <Field label="States">
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Empty, loading, error states (one per line)" rows={2} value={states.join('\n')} onChange={(e) => update(id, { states: e.target.value.split('\n').filter((l) => l.trim()) })} />
      </Field>
      <Field label="Navigation">
        <textarea className={`${inputClass} min-h-[70px] resize-y`} placeholder="How users get to/from this screen" rows={2} value={data.navigation ?? ''} onChange={(e) => update(id, { navigation: e.target.value })} />
      </Field>
      <Field label="Data Sources">
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="APIs, stores, data needed (one per line)" rows={2} value={dataSources.join('\n')} onChange={(e) => update(id, { dataSources: e.target.value.split('\n').filter((l) => l.trim()) })} />
      </Field>
      <Field label="Wireframe URL">
        <input className={inputClass} placeholder="Link to design/wireframe" value={data.wireframeUrl ?? ''} onChange={(e) => update(id, { wireframeUrl: e.target.value })} />
      </Field>
      <Field label="Notes">
        <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Additional context" rows={2} value={data.notes ?? ''} onChange={(e) => update(id, { notes: e.target.value })} />
      </Field>

      {/* AI Context Section */}
      <div className="border-t border-slate-700/50 pt-3">
        <div className="flex items-center justify-between mb-2">
          <button className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors" onClick={() => setShowAi(!showAi)}>
            <span className="font-medium">AI Context & Implementation</span>
            <span className="text-xs">{showAi ? '▼' : '▶'}</span>
          </button>
          <button
            className="px-3 py-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-md hover:border-emerald-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            onClick={handleGenerateAI}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
        {showAi && (
          <div className="space-y-4">
            <Field label="AI Context">
              <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Component structure, styling, state management..." rows={3} value={data.aiContext ?? ''} onChange={(e) => update(id, { aiContext: e.target.value })} />
            </Field>
            <Field label="Acceptance Criteria">
              <textarea className={`${inputClass} min-h-[120px] resize-y`} placeholder="One criterion per line" rows={4} value={acceptanceCriteria.join('\n')} onChange={(e) => update(id, { acceptanceCriteria: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Component Hierarchy">
              <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="React component breakdown (one per line)" rows={3} value={componentHierarchy.join('\n')} onChange={(e) => update(id, { componentHierarchy: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Code References">
              <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Existing components to reference (one per line)" rows={3} value={codeReferences.join('\n')} onChange={(e) => update(id, { codeReferences: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Testing Requirements">
              <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="UI/E2E test needs" rows={3} value={data.testingRequirements ?? ''} onChange={(e) => update(id, { testingRequirements: e.target.value })} />
            </Field>
            <Field label="Tags">
              <input className={inputClass} placeholder="comma, separated, tags" value={tags.join(', ')} onChange={(e) => update(id, { tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Estimated Hours">
              <input type="number" className={inputClass} placeholder="Optional" value={data.estimatedHours ?? ''} onChange={(e) => update(id, { estimatedHours: e.target.value ? Number(e.target.value) : null })} />
            </Field>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Tech Stack ───────────────────────────────────────────

function TechStackFields({
  id,
  data,
  update,
}: {
  id: string;
  data: TechStackNodeData;
  update: (id: string, d: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Field label="Category">
        <select className={inputClass} value={data.category} onChange={(e) => update(id, { category: e.target.value as TechCategory })}>
          <option value="Frontend">Frontend</option>
          <option value="Backend">Backend</option>
          <option value="Database">Database</option>
          <option value="Auth">Auth</option>
          <option value="Hosting">Hosting</option>
          <option value="Other">Other</option>
        </select>
      </Field>
      <Field label="Tool Name">
        <input className={inputClass} placeholder="Tool name" value={data.toolName} onChange={(e) => update(id, { toolName: e.target.value })} />
      </Field>
      <Field label="Notes">
        <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Notes" rows={3} value={data.notes} onChange={(e) => update(id, { notes: e.target.value })} />
      </Field>
    </>
  );
}

// ─── Prompt ───────────────────────────────────────────────

function PromptFields({
  id,
  data,
  update,
}: {
  id: string;
  data: PromptNodeData;
  update: (id: string, d: Record<string, unknown>) => void;
}) {
  return (
    <>
      <Field label="Prompt">
        <textarea className={`${inputClass} min-h-[140px] resize-y`} placeholder="Prompt text" rows={5} value={data.promptText} onChange={(e) => update(id, { promptText: e.target.value })} />
      </Field>
      <Field label="Target Tool">
        <select className={inputClass} value={data.targetTool} onChange={(e) => update(id, { targetTool: e.target.value as TargetTool })}>
          <option value="Claude">Claude</option>
          <option value="Bolt">Bolt</option>
          <option value="Cursor">Cursor</option>
          <option value="Lovable">Lovable</option>
          <option value="Replit">Replit</option>
          <option value="Other">Other</option>
        </select>
      </Field>
      <Field label="Result Notes">
        <textarea className={`${inputClass} min-h-[120px] resize-y`} placeholder="Result notes" rows={4} value={data.resultNotes} onChange={(e) => update(id, { resultNotes: e.target.value })} />
      </Field>
    </>
  );
}

// ─── Note ─────────────────────────────────────────────────

function NoteFields({
  id,
  data,
  update,
}: {
  id: string;
  data: NoteNodeData;
  update: (id: string, d: Record<string, unknown>) => void;
}) {
  const currentColorTag = data.colorTag ?? NOTE_COLOR_OPTIONS[0].value;

  return (
    <>
      <Field label="Title">
        <input className={inputClass} placeholder="Title" value={data.title} onChange={(e) => update(id, { title: e.target.value })} />
      </Field>
      <Field label="Color Tag">
        <select className={inputClass} value={currentColorTag} onChange={(e) => update(id, { colorTag: e.target.value as NoteColorTag })}>
          {NOTE_COLOR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Body">
        <textarea className={`${inputClass} min-h-[200px] resize-y`} placeholder="Body" rows={8} value={data.body} onChange={(e) => update(id, { body: e.target.value })} />
      </Field>
    </>
  );
}
