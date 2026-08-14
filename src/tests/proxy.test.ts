import { describe, test, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}))

describe('updateSession proxy protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  })

  test('Redirects unauthenticated user from /dashboard to /login?redirectTo=%2Fdashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost:3000/dashboard')

    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirectTo=%2Fdashboard')
  })

  test('Redirects unauthenticated user from /dashboard/admin/settings to /login?redirectTo=%2Fdashboard%2Fadmin%2Fsettings', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost:3000/dashboard/admin/settings')

    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/login?redirectTo=%2Fdashboard%2Fadmin%2Fsettings'
    )
  })

  test('Passes through exempt routes (/verify-email and /reset-password) for unauthenticated user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const reqVerify = new NextRequest('http://localhost:3000/verify-email?token=123')
    const resVerify = await updateSession(reqVerify)
    expect(resVerify.status).toBe(200)

    const reqReset = new NextRequest('http://localhost:3000/reset-password')
    const resReset = await updateSession(reqReset)
    expect(resReset.status).toBe(200)
  })

  test('Redirects logged in user from public auth pages (/login, /register, /forgot-password) to role dashboard', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: 'company' } }),
        }),
      }),
    })

    const reqLogin = new NextRequest('http://localhost:3000/login')
    const resLogin = await updateSession(reqLogin)

    expect(resLogin.status).toBe(307)
    expect(resLogin.headers.get('location')).toBe('http://localhost:3000/dashboard/company')
  })

  test('Enforces role-based access for candidate attempting /dashboard/admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-cand' } } })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: 'candidate' } }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost:3000/dashboard/admin/users')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard/candidate')
  })

  test('Allows admin user to access /dashboard/company/jobs', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-admin' } } })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: 'admin' } }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost:3000/dashboard/company/jobs')
    const res = await updateSession(req)

    expect(res.status).toBe(200)
  })

  test('Redirects logged in user on /dashboard to /dashboard/${role}', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-admin' } } })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: 'admin' } }),
        }),
      }),
    })

    const req = new NextRequest('http://localhost:3000/dashboard')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/dashboard/admin')
  })
})
