import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    const createMock = (): any => {
      const mock: any = () => {
        throw new Error("Supabase client URL or Anon Key is missing.")
      }
      return new Proxy(mock, {
        get(_, prop) {
          if (prop === 'then') return undefined
          return createMock()
        }
      })
    }
    return createMock()
  }

  return createBrowserClient<Database>(url, anonKey)
}
