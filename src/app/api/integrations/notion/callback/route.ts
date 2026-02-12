import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { NotionOAuth } from '@/lib/integrations/notion';
import { BaseIntegration } from '@/lib/integrations/base';

/**
 * Notion OAuth callback handler.
 * Exchanges authorization code for access token and saves to database.
 *
 * Flow:
 * 1. User clicks "Connect Notion" → redirects to Notion OAuth
 * 2. User authorizes → Notion redirects here with code
 * 3. We exchange code for token → save to integrations table
 * 4. Redirect back to dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings/integrations?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=missing_code', request.url)
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // Exchange code for token
    const oauth = new NotionOAuth();
    const auth = await oauth.exchangeCodeForToken(code);

    // Save to database
    await BaseIntegration.saveForUser('notion', user.id, auth);

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?success=notion_connected', request.url)
    );
  } catch (error) {
    console.error('Notion OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'oauth_failed'
        )}`,
        request.url
      )
    );
  }
}
