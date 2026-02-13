import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DEV ONLY: GET /api/dev-upgrade
 * Upgrades the currently logged-in user to Pro tier.
 * Remove before production!
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Not logged in. Please log in first at /login' },
      { status: 401 }
    );
  }

  // NOTE: The profiles table hasn't been created in Supabase yet.
  // getUserTier() already returns 'pro' for all users, so this is a no-op.
  return NextResponse.json({
    success: true,
    message: `User ${user.email} is already Pro (all users default to Pro until tier system is set up).`,
    userId: user.id,
    tier: 'pro',
  });
}
