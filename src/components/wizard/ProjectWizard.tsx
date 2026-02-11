'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { generateCanvas } from '@/lib/generateCanvas';
import { DEFAULT_TEMPLATE_ID, TEMPLATE_OPTIONS, getTemplateById, type TemplateId } from '@/lib/templates';
import { enhanceWizardAnswers, type WizardEnhanceOutput } from '@/app/actions/wizardEnhance';
import { StepIndicator } from './StepIndicator';
import { WizardStep } from './WizardStep';
import type { TargetTool } from '@/types/nodes';
import { formatErrorForClient } from '@/lib/errors';

interface ProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (answers: Record<string, string>) => void;
}

interface WizardAnswers {
  appName: string;
  templateId: TemplateId;
  description: string;
  targetUser: string;
  coreProblem: string;
  features: string;
  screens: string;
  tool: TargetTool;
}

const QUESTIONS = [
  { key: 'templateId' as const, question: 'Choose a starting template', placeholder: '', type: 'template' as const },
  { key: 'appName' as const, question: 'What should we call the app?', placeholder: 'e.g., Spexly, HabitSpark...', type: 'input' as const },
  { key: 'description' as const, question: 'What does your app do?', placeholder: 'Brief description of your app...', type: 'textarea' as const },
  { key: 'targetUser' as const, question: 'Who is it for?', placeholder: 'e.g., Freelance designers, college students...', type: 'input' as const },
  { key: 'coreProblem' as const, question: 'What problem does it solve?', placeholder: 'The core problem your app addresses...', type: 'textarea' as const },
  { key: 'features' as const, question: 'What are the main features?', placeholder: 'e.g., User auth, Dashboard, Settings, Notifications', type: 'textarea' as const },
  { key: 'screens' as const, question: 'What screens/pages does it need?', placeholder: 'e.g., Home, Login, Profile, Dashboard', type: 'textarea' as const },
  { key: 'tool' as const, question: 'Which vibe coding tool will you use?', placeholder: '', type: 'select' as const },
];

const TOTAL_STEPS = QUESTIONS.length;

export function ProjectWizard({ isOpen, onClose, onComplete }: ProjectWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({
    appName: '',
    templateId: DEFAULT_TEMPLATE_ID,
    description: '',
    targetUser: '',
    coreProblem: '',
    features: '',
    screens: '',
    tool: 'Claude',
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [enhancedData, setEnhancedData] = useState<WizardEnhanceOutput | null>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const setNodesAndEdges = useCanvasStore((s) => s.setNodesAndEdges);

  const isLastStep = step === TOTAL_STEPS - 1;

  function updateAnswer(key: keyof WizardAnswers, value: string) {
    if (key === 'templateId') {
      const template = getTemplateById(value as TemplateId);
      setAnswers((prev) => ({
        ...prev,
        templateId: value as TemplateId,
        features: template ? template.features.join(', ') : '',
        screens: template ? template.screens.join(', ') : '',
      }));
      return;
    }

    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleNext() {
    if (isLastStep) {
      if (nodes.length > 0) {
        setShowConfirm(true);
      } else {
        handleGenerate();
      }
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (showConfirm) {
      setShowConfirm(false);
    } else if (step > 0) {
      setStep((s) => s - 1);
    }
  }

  function handleGenerate() {
    const template = getTemplateById(answers.templateId);

    if (onComplete) {
      // Dashboard flow: pass answers back to parent
      onComplete({
        ...(answers as unknown as Record<string, string>),
        templateId: answers.templateId,
      });
      handleClose();
      return;
    }

    // Canvas flow: generate directly into store
    const parseList = (value: string) =>
      value
        .split(/[\n,;]/)
        .map((s) => s.trim())
        .filter(Boolean);

    const input = {
      appName: enhancedData?.idea.appName || answers.appName,
      description: enhancedData?.idea.description || answers.description,
      targetUser: enhancedData?.idea.targetUser || answers.targetUser,
      coreProblem: enhancedData?.idea.coreProblem || answers.coreProblem,
      features: parseList(answers.features),
      screens: parseList(answers.screens),
      featuresDetailed: enhancedData?.features,
      screensDetailed: enhancedData?.screens,
      tool: answers.tool,
      techStack: enhancedData?.techStack?.length ? enhancedData.techStack : template?.techStack ?? [],
      prompts: enhancedData?.prompts?.length ? enhancedData.prompts : template?.promptPack ?? [],
    };

    const { nodes: newNodes, edges: newEdges } = generateCanvas(input);
    setNodesAndEdges(newNodes, newEdges);
    handleClose();
  }

  function handleClose() {
    setStep(0);
    setAnswers({
      appName: '',
      templateId: DEFAULT_TEMPLATE_ID,
      description: '',
      targetUser: '',
      coreProblem: '',
      features: '',
      screens: '',
      tool: 'Claude',
    });
    setShowConfirm(false);
    setEnhancing(false);
    setEnhanceError(null);
    setEnhancedData(null);
    onClose();
  }

  async function handleEnhance() {
    if (enhancing) return;
    setEnhanceError(null);
    setEnhancing(true);

    try {
      const template = getTemplateById(answers.templateId);
      const parseList = (value: string) =>
        value
          .split(/[\n,;]/)
          .map((s) => s.trim())
          .filter(Boolean);

      const result = await enhanceWizardAnswers({
        appName: answers.appName,
        description: answers.description,
        targetUser: answers.targetUser,
        coreProblem: answers.coreProblem,
        features: parseList(answers.features),
        screens: parseList(answers.screens),
        tool: answers.tool,
        templateName: template?.label,
        templateFeatures: template?.features ?? [],
        templateScreens: template?.screens ?? [],
        templateTechStack: template?.techStack ?? [],
        templatePrompts: template?.promptPack ?? [],
      });

      setEnhancedData(result);
      setAnswers((prev) => ({
        ...prev,
        appName: result.idea.appName || prev.appName,
        description: result.idea.description || prev.description,
        targetUser: result.idea.targetUser || prev.targetUser,
        coreProblem: result.idea.coreProblem || prev.coreProblem,
        features: result.features.length
          ? result.features.map((feature) => feature.featureName).join(', ')
          : prev.features,
        screens: result.screens.length
          ? result.screens.map((screen) => screen.screenName).join(', ')
          : prev.screens,
        tool: result.prompts[0]?.targetTool ?? prev.tool,
      }));
    } catch (error) {
      setEnhanceError(formatErrorForClient(error));
    } finally {
      setEnhancing(false);
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
          {/* Close button */}
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors">
              <X size={16} />
            </button>
          </Dialog.Close>

          {/* Title */}
          <Dialog.Title className="mb-1 text-lg font-semibold text-slate-100">
            {showConfirm ? 'Replace existing canvas?' : 'New Project'}
          </Dialog.Title>
          <Dialog.Description className="mb-5 text-sm text-slate-400">
            {showConfirm
              ? 'Your canvas has existing nodes. Generating a new project will replace them. You can undo this action.'
              : `Answer each step below. Current step: ${step + 1} of ${TOTAL_STEPS}`}
          </Dialog.Description>

          {showConfirm ? (
            /* Confirmation view */
            <div className="flex justify-end gap-3">
              <button
                onClick={handleBack}
                className="rounded-lg border border-slate-600/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-400"
              >
                Replace & Generate
              </button>
            </div>
          ) : (
            /* Step view */
            <>
              <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

              <div className="mt-5 max-h-[60vh] space-y-4 overflow-y-auto pr-2">
                {QUESTIONS.map((q, index) => (
                  <WizardStep
                    key={q.key}
                    question={q.question}
                    placeholder={q.placeholder}
                    type={q.type}
                    value={answers[q.key]}
                    onChange={(value) => updateAnswer(q.key, value)}
                    templateOptions={q.key === 'templateId' ? TEMPLATE_OPTIONS : undefined}
                    isActive={index === step}
                    onSelect={() => setStep(index)}
                  />
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className="rounded-lg border border-slate-600/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleEnhance}
                    disabled={enhancing}
                    className="rounded-lg border border-violet-500/50 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enhancing ? 'Enhancing…' : 'Enhance with AI'}
                  </button>
                  <button
                    onClick={handleNext}
                    className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-400"
                  >
                    {isLastStep ? 'Generate' : 'Next'}
                  </button>
                </div>
              </div>
              {enhanceError ? (
                <p className="mt-3 text-xs text-rose-300">{enhanceError}</p>
              ) : enhancedData ? (
                <p className="mt-3 text-xs text-emerald-300">AI enhancement applied. Review the fields before generating.</p>
              ) : null}
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
