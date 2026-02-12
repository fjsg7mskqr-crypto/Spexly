import { createClient } from '@/lib/supabase/server';
import { logError } from '@/lib/errors';
import { isValidConfirmationToken } from '@/lib/waitlist/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || !isValidConfirmationToken(token)) {
      return Response.json({ ok: false, error: 'Invalid confirmation token' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('confirm_waitlist_email', {
      token_input: token,
    });

    if (error) {
      logError(error, { action: 'waitlist.confirm.rpc' });
      return Response.json({ ok: false, error: 'Unable to confirm email' }, { status: 500 });
    }

    if (!data) {
      return Response.json(
        { ok: false, error: 'Confirmation link is invalid or expired' },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, status: 'confirmed' });
  } catch (error) {
    logError(error, { action: 'waitlist.confirm.get' });
    return Response.json({ ok: false, error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
