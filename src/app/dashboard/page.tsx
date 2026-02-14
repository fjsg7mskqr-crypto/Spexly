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

  const userName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    (user.email ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');

  return <DashboardLayout projects={projects} userEmail={user.email ?? ''} userName={userName} taskSummaries={taskSummaries} />;
}
