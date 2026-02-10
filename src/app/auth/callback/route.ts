import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Whitelist of allowed redirect paths after authentication
 * Only relative paths starting with '/' are allowed to prevent open redirect attacks
 */
const ALLOWED_REDIRECT_PATHS = [
  '/dashboard',
  '/canvas',
  '/projects',
  '/settings',
  '/profile',
  '/',
]

/**
 * Validates and sanitizes redirect URLs to prevent open redirect vulnerabilities
 * @param path - The redirect path from the query parameter
 * @returns A safe redirect path
 */
function validateRedirectPath(path: string | null): string {
  // Default to dashboard if no path provided
  if (!path) {
    return '/dashboard'
  }

  // Security: Only allow relative paths starting with '/'
  // This prevents redirects to external domains like https://evil.com
  if (!path.startsWith('/')) {
    console.warn('[Security] Blocked redirect to external URL:', path)
    return '/dashboard'
  }

  // Security: Block paths that could be used for open redirect
  // Examples: //evil.com, /\evil.com, /%2F%2Fevil.com
  if (path.startsWith('//') || path.includes('\\') || path.includes('%2F%2F')) {
    console.warn('[Security] Blocked suspicious redirect path:', path)
    return '/dashboard'
  }

  // Extract the base path (before query params or hash)
  const basePath = path.split('?')[0].split('#')[0]

  // Check if the base path is in our whitelist or is a subpath of an allowed path
  const isAllowed = ALLOWED_REDIRECT_PATHS.some((allowedPath) => {
    return basePath === allowedPath || basePath.startsWith(`${allowedPath}/`)
  })

  if (!isAllowed) {
    console.warn('[Security] Redirect path not in whitelist:', path)
    return '/dashboard'
  }

  // Path is valid and safe
  return path
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next')
  const originHost = new URL(origin).host

  const allowedHosts = [
    originHost,
    ...(process.env.NEXT_PUBLIC_APP_HOSTS?.split(',').map((host) => host.trim()).filter(Boolean) || []),
  ]

  // Validate the redirect path to prevent open redirect attacks
  const next = validateRedirectPath(nextParam)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost && allowedHosts.includes(forwardedHost)) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
