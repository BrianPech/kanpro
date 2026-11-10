import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type {
  AdminSubRole,
  AdminStaffStatus,
  AdminPermissionKey,
} from "@/modules/admin/types/staff";

export interface AuthenticatedAdmin {
  user: User;
  role: "admin";
  profile: {
    id: string;
    email?: string | null;
    role?: string;
    status?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    [key: string]: unknown;
  };
}

export interface RequireAdminAuthOptions {
  requireSuperAdmin?: boolean;
  requiredPermission?: AdminPermissionKey;
}

export interface AdminActionAuthContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  profile: {
    role?: string;
    status?: string | null;
    [key: string]: unknown;
  };
  staff: {
    sub_role?: AdminSubRole;
    status?: AdminStaffStatus;
    permissions?: AdminPermissionKey[];
  } | null;
}

/**
 * Central Server Action & Service authorization guard for administrative endpoints.
 * Enforces:
 * 1. Valid authenticated user session.
 * 2. Database `profiles.role === 'admin'` and `profiles.status !== 'suspended'`.
 * 3. Active staff membership in `admin_staff_members` (`status === 'active'`, fail-closed on null).
 * 4. Optional `requireSuperAdmin` (`sub_role === 'super_admin'`) or granular `requiredPermission`.
 */
export async function requireAdminAuth(
  options?: RequireAdminAuthOptions
): Promise<AdminActionAuthContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado. Por favor inicie sesión.");
  }

  const profileQuery = supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id);

  const profileRes =
    typeof profileQuery.maybeSingle === "function"
      ? await profileQuery.maybeSingle()
      : await profileQuery.single();

  const profile = profileRes?.data as
    | { role?: string; status?: string | null; [key: string]: unknown }
    | null
    | undefined;

  if (!profile || profile.role !== "admin") {
    throw new Error("Acceso denegado: Se requieren permisos de administrador.");
  }

  if (profile.status === "suspended") {
    throw new Error(
      "Acceso denegado: La cuenta administrativa se encuentra suspendida."
    );
  }

  let staff: {
    sub_role?: AdminSubRole;
    status?: AdminStaffStatus;
    permissions?: AdminPermissionKey[];
  } | null = null;

  const staffTable = supabase.from("admin_staff_members") as unknown as {
    select?: (cols: string) => {
      eq?: (col: string, val: string) => {
        maybeSingle?: () => Promise<{ data?: unknown }>;
        single?: () => Promise<{ data?: unknown }>;
      };
    };
  };

  if (staffTable && typeof staffTable.select === "function") {
    const eqQuery = staffTable
      .select("sub_role, status, permissions")
      ?.eq?.("profile_id", user.id);

    if (eqQuery) {
      const staffRes =
        typeof eqQuery.maybeSingle === "function"
          ? await eqQuery.maybeSingle()
          : typeof eqQuery.single === "function"
          ? await eqQuery.single()
          : undefined;

      if (staffRes && "data" in staffRes) {
        const rawStaff = staffRes.data as Record<string, unknown> | null | undefined;

        if (rawStaff === null) {
          throw new Error(
            "Acceso denegado: El perfil administrativo no cuenta con registro de staff activo."
          );
        }

        if (
          rawStaff &&
          typeof rawStaff === "object" &&
          ("sub_role" in rawStaff ||
            "status" in rawStaff ||
            "permissions" in rawStaff)
        ) {
          staff = {
            sub_role: rawStaff.sub_role as AdminSubRole | undefined,
            status: rawStaff.status as AdminStaffStatus | undefined,
            permissions: Array.isArray(rawStaff.permissions)
              ? (rawStaff.permissions as AdminPermissionKey[])
              : undefined,
          };
        }
      }
    }
  }

  if (staff) {
    if (staff.status && staff.status !== "active") {
      throw new Error(
        "Acceso denegado: Su cuenta de personal administrativo se encuentra suspendida o inactiva."
      );
    }

    if (
      options?.requireSuperAdmin &&
      staff.sub_role &&
      staff.sub_role !== "super_admin"
    ) {
      throw new Error(
        "Acceso denegado: Se requieren privilegios de Super Administrador."
      );
    }

    if (options?.requiredPermission) {
      const isSuper = staff.sub_role === "super_admin";
      const hasExplicitPerm = Array.isArray(staff.permissions)
        ? staff.permissions.includes(options.requiredPermission)
        : false;

      if (!isSuper && !hasExplicitPerm) {
        throw new Error(
          `Acceso denegado: Se requiere el permiso '${options.requiredPermission}'.`
        );
      }
    }
  }

  return { supabase, user, profile, staff };
}

/**
 * Server-side helper to enforce admin permissions on layouts and pages.
 * - If the user is unauthenticated, redirects to /login.
 * - If authenticated but not an admin, redirects to the user's role-appropriate dashboard.
 * - If suspended, redirects to /login.
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

  if ((profile as { status?: string }).status === "suspended") {
    redirect("/login?error=account-suspended");
  }

  return {
    user,
    role: "admin",
    profile,
  };
}
