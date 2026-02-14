import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProjects } from '@/app/actions/projects';
import { getProjectTaskSummaries } from '@/app/actions/tasks';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const projects = await getProjects();
  const taskSummaries = await getProjectTaskSummaries(projects.map((project) => project.id));

  return <DashboardLayout projects={projects} userEmail={user.email ?? ''} taskSummaries={taskSummaries} />;
}
