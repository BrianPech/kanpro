import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const createMock = (): ReturnType<typeof createServerClient<Database>> => {
      const mock = () => {
        throw new Error("Supabase client URL or Anon Key is missing.")
      }
      return new Proxy(mock, {
        get(_, prop) {
          if (prop === 'then') return undefined
          return createMock()
        }
      }) as unknown as ReturnType<typeof createServerClient<Database>>
    }
    return createMock()
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have a proxy refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
