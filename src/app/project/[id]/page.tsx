import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProject } from '@/app/actions/projects';
import { ProjectCanvas } from './ProjectCanvas';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const project = await getProject(id);

  if (!project) {
    redirect('/dashboard');
  }

  return <ProjectCanvas project={project} />;
}
