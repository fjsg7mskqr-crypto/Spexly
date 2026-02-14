import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Keep local dev responsive; auth/header proxying can stall when external services are slow.
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  const needsAuthState =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/project') ||
    pathname === '/login' ||
    pathname === '/signup';

  let user: unknown = null;
  if (needsAuthState) {
    try {
      const authResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
      ]);
      if (authResult && typeof authResult === 'object' && 'data' in authResult) {
        const data = (authResult as { data?: { user?: unknown } }).data;
        user = data?.user ?? null;
      }
    } catch {
      user = null;
    }
  }

  // Protected routes: require auth
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/project'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authed users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Add security headers to all responses
  const headers = supabaseResponse.headers

  // Content Security Policy (CSP)
  // Restricts sources for scripts, styles, images, etc.
  const isProduction = process.env.NODE_ENV === 'production'
  const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-eval' 'unsafe-inline'"

  headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https:", // Allow images from https sources and data URIs
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io", // Allow Supabase and Upstash connections
      "frame-ancestors 'none'", // Prevent embedding in iframes
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // Strict-Transport-Security (HSTS)
  // Forces HTTPS connections
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  // X-Frame-Options
  // Prevents clickjacking attacks
  headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy
  // Limits information sent in Referer header
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy
  // Restricts browser features
  headers.set(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // Disable FLoC
    ].join(', ')
  )

  // X-DNS-Prefetch-Control
  // Controls DNS prefetching
  headers.set('X-DNS-Prefetch-Control', 'on')

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
