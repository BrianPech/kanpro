import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/modules/auth/types/auth.types";
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
    [key: string]: any;
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

  const effectiveRole = (profile?.role ||
    user.user_metadata?.role ||
    "candidate") as UserRole;

  if (effectiveRole !== "admin") {
    redirect(
      effectiveRole === "company"
        ? "/dashboard/company"
        : "/dashboard/candidate/discovery"
    );
  }

  return {
    user,
    role: "admin",
    profile: profile || {
      id: user.id,
      email: user.email,
      role: "admin",
      full_name: user.user_metadata?.full_name || "Admin",
    },
  };
}
