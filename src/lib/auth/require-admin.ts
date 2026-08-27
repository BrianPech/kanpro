import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface AuthenticatedAdmin {
  user: User;
  role: "admin";
  profile: {
    id: string;
    email?: string | null;
    role?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    [key: string]: unknown;
  };
}

/**
 * Server-side helper to enforce admin permissions.
 * - If the user is unauthenticated, redirects to /login.
 * - If authenticated but not an admin, redirects to the user's role-appropriate dashboard.
 * - Prevents infinite redirect loops with auth proxies/middleware.
 */
export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Strict enforcement: profile MUST exist in database and have role === 'admin'
  if (!profile || profile.role !== "admin") {
    const fallbackRole = profile?.role === "company" ? "company" : "candidate";
    redirect(
      fallbackRole === "company"
        ? "/dashboard/company"
        : "/dashboard/candidate/discovery"
    );
  }

  return {
    user,
    role: "admin",
    profile,
  };
}
