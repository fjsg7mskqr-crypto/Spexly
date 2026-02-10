'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Sparkles, LogOut } from 'lucide-react';
import { signOut } from '@/lib/supabase/auth-helpers';
import { createProject, createProjectFromWizard, renameProject, deleteProject } from '@/app/actions/projects';
import { generateCanvas } from '@/lib/generateCanvas';
import { ProjectCard } from './ProjectCard';
import { ProjectWizard } from '@/components/wizard/ProjectWizard';
import type { Project } from '@/types/project';
import type { TargetTool } from '@/types/nodes';

interface DashboardLayoutProps {
  projects: Project[];
  userEmail: string;
}

export function DashboardLayout({ projects: initialProjects, userEmail }: DashboardLayoutProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleNewBlankProject = () => {
    startTransition(async () => {
      const project = await createProject();
      router.push(`/project/${project.id}`);
    });
  };

  const handleWizardComplete = (answers: Record<string, string>) => {
    startTransition(async () => {
      const features = answers.features
        ?.split(',')
        .map((f) => f.trim())
        .filter(Boolean) ?? [];
      const screens = answers.screens
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];

      const { nodes, edges } = generateCanvas({
        description: answers.description ?? '',
        targetUser: answers.targetUser ?? '',
        coreProblem: answers.coreProblem ?? '',
        features,
        screens,
        tool: (answers.tool ?? 'Claude') as TargetTool,
      });

      const name = answers.description?.slice(0, 50) || 'New Project';
      const project = await createProjectFromWizard(name, nodes, edges);
      setIsWizardOpen(false);
      router.push(`/project/${project.id}`);
    });
  };

  const handleRename = (id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    startTransition(async () => {
      await renameProject(id, name);
    });
  };

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      await deleteProject(id);
    });
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Image src="/spexly-logo-white.png" alt="Spexly" width={1349} height={603} className="h-12 w-auto" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Your Projects</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewBlankProject}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              <Plus size={16} />
              Blank Project
            </button>
            <button
              onClick={() => setIsWizardOpen(true)}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              <Sparkles size={16} />
              New with Wizard
            </button>
          </div>
        </div>

        {/* Project Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20">
            <p className="mb-2 text-lg font-medium text-slate-300">No projects yet</p>
            <p className="mb-6 text-sm text-slate-500">Create your first project to get started.</p>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              <Sparkles size={16} />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Wizard Modal */}
      <ProjectWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
      />
    </div>
  );
}
