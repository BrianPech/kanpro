import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { createMockSupabaseClient } from './mock-client'

export function createClient() {
  if (
    process.env.NODE_ENV !== 'production' &&
    ((typeof document !== 'undefined' && document.cookie.includes('e2e-mock-role=company')) ||
      process.env.NEXT_PUBLIC_E2E_MOCK_AUTH === 'true')
  ) {
    return createMockSupabaseClient() as unknown as ReturnType<typeof createBrowserClient<Database>>
  }

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (typeof window !== 'undefined' && url) {
    try {
      const parsedUrl = new URL(url)
      // When developing locally and browsing from a mobile phone or another device on the LAN:
      // If the configured Supabase URL points to loopback (127.0.0.1 or localhost)
      // and the browser is browsing via a local LAN IP (e.g. 192.168.1.91),
      // dynamically point to the host machine's IP so client-side API requests succeed.
      if (
        (parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === 'localhost') &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        parsedUrl.hostname = window.location.hostname
        url = parsedUrl.origin
      }
    } catch {
      // ignore
    }
  }

  if (!url || !anonKey) {
    const createMock = (): ReturnType<typeof createBrowserClient<Database>> => {
      const mock = () => {
        throw new Error("Supabase client URL or Anon Key is missing.")
      }
      return new Proxy(mock, {
        get(_, prop) {
          if (prop === 'then') return undefined
          return createMock()
        }
      }) as unknown as ReturnType<typeof createBrowserClient<Database>>
    }
    return createMock()
  }

  return createBrowserClient<Database>(url, anonKey)
}
