'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * DEV ONLY: Upgrade current user to Pro tier
 * Remove this file before production!
 */
export async function upgradeCurrentUserToPro() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not logged in' };
  }

  // NOTE: The profiles table hasn't been created in Supabase yet.
  // getUserTier() already returns 'pro' for all users, so this is a no-op.
  // Once the profiles table is created, re-enable the upsert below.
  return {
    success: true,
    message: `User ${user.email} is already Pro (all users default to Pro until tier system is set up).`,
    userId: user.id
  };
}
