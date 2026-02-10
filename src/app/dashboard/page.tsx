import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getProjects } from '@/app/actions/projects';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const projects = await getProjects();

  return <DashboardLayout projects={projects} userEmail={user.email ?? ''} />;
}
