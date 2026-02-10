'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { generateCanvas } from '@/lib/generateCanvas';
import { StepIndicator } from './StepIndicator';
import { WizardStep } from './WizardStep';
import type { TargetTool } from '@/types/nodes';

interface ProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WizardAnswers {
  description: string;
  targetUser: string;
  coreProblem: string;
  features: string;
  screens: string;
  tool: TargetTool;
}

const QUESTIONS = [
  { key: 'description' as const, question: 'What does your app do?', placeholder: 'Brief description of your app...', type: 'textarea' as const },
  { key: 'targetUser' as const, question: 'Who is it for?', placeholder: 'e.g., Freelance designers, college students...', type: 'input' as const },
  { key: 'coreProblem' as const, question: 'What problem does it solve?', placeholder: 'The core problem your app addresses...', type: 'textarea' as const },
  { key: 'features' as const, question: 'What are the main features?', placeholder: 'e.g., User auth, Dashboard, Settings, Notifications', type: 'textarea' as const },
  { key: 'screens' as const, question: 'What screens/pages does it need?', placeholder: 'e.g., Home, Login, Profile, Dashboard', type: 'textarea' as const },
  { key: 'tool' as const, question: 'Which vibe coding tool will you use?', placeholder: '', type: 'select' as const },
];

const TOTAL_STEPS = QUESTIONS.length;

export function ProjectWizard({ isOpen, onClose }: ProjectWizardProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({
    description: '',
    targetUser: '',
    coreProblem: '',
    features: '',
    screens: '',
    tool: 'Claude',
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const nodes = useCanvasStore((s) => s.nodes);
  const setNodesAndEdges = useCanvasStore((s) => s.setNodesAndEdges);

  const currentQuestion = QUESTIONS[step];
  const isLastStep = step === TOTAL_STEPS - 1;

  function updateAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
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
    const input = {
      description: answers.description,
      targetUser: answers.targetUser,
      coreProblem: answers.coreProblem,
      features: answers.features.split(',').map((s) => s.trim()),
      screens: answers.screens.split(',').map((s) => s.trim()),
      tool: answers.tool,
    };

    const { nodes: newNodes, edges: newEdges } = generateCanvas(input);
    setNodesAndEdges(newNodes, newEdges);
    handleClose();
  }

  function handleClose() {
    setStep(0);
    setAnswers({
      description: '',
      targetUser: '',
      coreProblem: '',
      features: '',
      screens: '',
      tool: 'Claude',
    });
    setShowConfirm(false);
    onClose();
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
              : `Step ${step + 1} of ${TOTAL_STEPS}`}
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

              <div className="mt-5">
                <WizardStep
                  question={currentQuestion.question}
                  placeholder={currentQuestion.placeholder}
                  type={currentQuestion.type}
                  value={answers[currentQuestion.key]}
                  onChange={updateAnswer}
                />
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className="rounded-lg border border-slate-600/50 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-400"
                >
                  {isLastStep ? 'Generate' : 'Next'}
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
