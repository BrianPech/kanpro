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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    (request.nextUrl.pathname === '/dashboard' ||
      request.nextUrl.pathname.startsWith('/dashboard/'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Always read authorization from the database. `user_metadata` belongs to
  // the user and must never be trusted for access-control decisions.
  let role: UserRole | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role || null
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Protect company routes
  if (request.nextUrl.pathname.startsWith('/dashboard/company') && role !== 'company' && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Protect candidate routes
  if (request.nextUrl.pathname.startsWith('/dashboard/candidate') && role !== 'candidate' && role !== 'admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname === '/dashboard') {
    const url = request.nextUrl.clone()
    if (role === 'admin') {
      url.pathname = '/dashboard/admin'
    } else if (role === 'company') {
      url.pathname = '/dashboard/company'
    } else {
      url.pathname = '/dashboard/candidate'
    }

    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
