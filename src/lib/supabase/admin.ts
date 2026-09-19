import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Creates an administrative Supabase client using the Service Role Key.
 *
 * Security Invariants:
 * 1. Restricted to server-only environments (enforced by "server-only").
 * 2. Operates without session persistence, cookie binding, or token auto-refresh.
 * 3. Never leaks SUPABASE_SERVICE_ROLE_KEY to client components, logs, or error messages.
 * 4. Bypasses RLS to execute authorized backend administrative operations.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Admin Client Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
