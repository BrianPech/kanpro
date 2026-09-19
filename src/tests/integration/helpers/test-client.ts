import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

// Support both new sb_secret format and classic JWT service role key
export const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

/**
 * Asserts that a real Supabase instance is running and reachable.
 * Throws a descriptive error if unavailable — NEVER silently skips.
 */
export async function ensureLiveSupabase(): Promise<void> {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `REAL SUPABASE TEST ENVIRONMENT UNAVAILABLE: Integration tests require a live Supabase instance at ${supabaseUrl}. Ensure local stack is started with 'npx supabase start'. Details: ${msg}`
    );
  }
}

/**
 * Returns an administrative client with Service Role privileges.
 * Used ONLY for test setup, seeding, and cascade teardown.
 */
export function getAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Returns an unauthenticated client with public / anonymous privileges.
 */
export function createAnonClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Signs in with credentials against real Supabase Auth and returns an
 * authenticated client that strictly operates under PostgreSQL RLS as that user.
 */
export async function createAuthenticatedClient(
  email: string,
  password = "TestPassword123!"
): Promise<{ client: SupabaseClient; userId: string }> {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(
      `Failed to authenticate real test user [${email}]: ${error?.message || "No user returned"}`
    );
  }

  return { client, userId: data.user.id };
}

/**
 * Creates a real company user in Supabase Auth, triggering handle_new_user()
 * which creates the corresponding profiles and company_profiles records in PostgreSQL.
 */
export async function createTestCompanyUser({
  email,
  password = "TestPassword123!",
  companyName,
}: {
  email: string;
  password?: string;
  companyName: string;
}): Promise<{ id: string; email: string; companyName: string }> {
  const admin = getAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "company",
      company_name: companyName,
      full_name: companyName,
      rfc: "XAXX010101000",
      industry: "Hotelería y Turismo",
      fiscal_address: "Cancún, Quintana Roo",
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create real test company user: ${error?.message}`);
  }

  return {
    id: data.user.id,
    email,
    companyName,
  };
}

/**
 * Creates a real candidate user in Supabase Auth, triggering handle_new_user()
 * which creates the corresponding profiles and candidate_profiles records.
 */
export async function createTestCandidateUser({
  email,
  password = "TestPassword123!",
  fullName,
}: {
  email: string;
  password?: string;
  fullName: string;
}): Promise<{ id: string; email: string; fullName: string }> {
  const admin = getAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "candidate",
      full_name: fullName,
      birth_date: "1995-05-15",
      whatsapp_number: "9981234567",
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create real test candidate user: ${error?.message}`);
  }

  return {
    id: data.user.id,
    email,
    fullName,
  };
}

/**
 * Cleans up created test users from Supabase Auth.
 * PostgreSQL foreign key cascades automatically clean up profiles, company_profiles,
 * employee_invitations, company_employees, and notifications.
 */
export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  if (!userIds || userIds.length === 0) return;

  const admin = getAdminClient();
  for (const id of userIds) {
    try {
      await admin.auth.admin.deleteUser(id);
    } catch (err) {
      console.warn(`[cleanupTestUsers] Error deleting test user ${id}:`, err);
    }
  }
}

/**
 * Helper to generate a unique test email address with timestamp and random suffix.
 */
export function generateTestEmail(prefix = "test"): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${ts}-${rand}@kanpro-test.local`;
}
