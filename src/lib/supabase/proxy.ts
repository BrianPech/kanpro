import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserRole } from '@/modules/auth/types/auth.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Defensive Check: Avoid throwing a 500 error if environment variables are not set (e.g. in Vercel)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables are missing! Bypassing session update.");
    return supabaseResponse;
  }

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

  // Helper to construct redirect responses while preserving updated cookies
  const redirectWithCookies = (url: URL | string) => {
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Safe pass-through routes to avoid infinite redirect loops
  const isExemptRoute =
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback')

  if (isExemptRoute) {
    return supabaseResponse
  }

  // 1. Unauthenticated users trying to access protected or candidate/company routes
  const isProtectedRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/account' ||
    pathname.startsWith('/account/') ||
    pathname === '/candidate' ||
    pathname.startsWith('/candidate/') ||
    pathname === '/company' ||
    pathname.startsWith('/company/')

  if (!user) {
    if (isProtectedRoute) {
      const redirectTarget = pathname + request.nextUrl.search
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', redirectTarget)
      return redirectWithCookies(url)
    }

    return supabaseResponse
  }

  // 2. Authenticated users: fetch role strictly from database profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Strict role resolution: only allow 'admin' if verified in database profile
  let role: UserRole = 'candidate'
  if (profile?.role) {
    role = profile.role as UserRole
  } else {
    // If profile is not yet created, only allow 'company' from metadata, never 'admin'
    const metaRole = user.user_metadata?.role
    if (metaRole === 'company') {
      role = 'company'
    }
  }

  const roleDashboard =
    role === 'admin'
      ? '/dashboard/admin'
      : role === 'company'
      ? '/dashboard/company'
      : '/dashboard/candidate'

  // 3. Authenticated users trying to access public auth pages
  const isPublicAuthPage =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/register' ||
    pathname.startsWith('/register/') ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/forgot-password/')

  if (isPublicAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = roleDashboard
    url.search = ''
    return redirectWithCookies(url)
  }

  // 4. Redirect legacy /account routes to the active role's dashboard settings
  if (pathname === '/account' || pathname.startsWith('/account/')) {
    const url = request.nextUrl.clone()
    url.pathname = `${roleDashboard}/settings`
    url.search = ''
    return redirectWithCookies(url)
  }

  // 5. Role-based access control for dashboard routes
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const url = request.nextUrl.clone()
    url.pathname = roleDashboard
    return redirectWithCookies(url)
  }

  if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = roleDashboard
    return redirectWithCookies(url)
  }

  if (
    pathname.startsWith('/dashboard/company') &&
    role !== 'company' &&
    role !== 'admin'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = roleDashboard
    return redirectWithCookies(url)
  }

  if (
    pathname.startsWith('/dashboard/candidate') &&
    role !== 'candidate' &&
    role !== 'admin'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = roleDashboard
    return redirectWithCookies(url)
  }

  return supabaseResponse
}
