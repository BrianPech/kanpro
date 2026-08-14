"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AdminSubRole, AdminStaffStatus, AdminPermissionKey, AdminStaffItem } from "@/modules/admin/types/staff";

async function requireAdminAuth() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado. Por favor inicie sesión.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error("Acceso denegado: Se requieren permisos de administrador.");
  }

  return { supabase, user };
}

export async function getAdminStaffMembers(): Promise<AdminStaffItem[]> {
  const { supabase } = await requireAdminAuth();

  // Fetch admin profiles
  const { data: adminProfiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, full_name, email, whatsapp_number, avatar_url, role, created_at, updated_at")
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  if (profileErr) {
    console.error("Error fetching admin profiles:", profileErr);
    return [];
  }

  // Fetch staff metadata table
  const { data: staffMembers } = await supabase
    .from("admin_staff_members")
    .select("*");

  const staffMap = new Map((staffMembers || []).map((s) => [s.profile_id, s]));

  return (adminProfiles || []).map((p) => {
    const s = staffMap.get(p.id);
    return {
      id: s?.id || p.id,
      profileId: p.id,
      name: p.full_name || "Administrador K'anPro",
      email: p.email,
      whatsappNumber: p.whatsapp_number || "",
      subRole: (s?.sub_role as AdminSubRole) || "super_admin",
      department: s?.department || "Dirección General",
      permissions: (s?.permissions as AdminPermissionKey[]) || [
        "manage_users",
        "manage_companies",
        "verify_documents",
        "manage_vacancies",
        "analytics_access",
        "system_settings",
      ],
      status: (s?.status as AdminStaffStatus) || "active",
      notes: s?.notes || "Personal registrado",
      avatar: p.avatar_url || "",
      createdAt: p.created_at
        ? new Date(p.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Reciente",
      updatedAt: s?.updated_at || p.updated_at,
    };
  });
}

export async function createAdminStaffMember(formData: {
  name: string;
  email: string;
  password?: string;
  whatsappNumber: string;
  subRole: AdminSubRole;
  department: string;
  permissions: AdminPermissionKey[];
  notes?: string;
}) {
  const { supabase } = await requireAdminAuth();

  const cleanEmail = formData.email.trim().toLowerCase();

  // Check if profile exists with this email
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("email", cleanEmail)
    .maybeSingle();

  let targetProfileId: string;

  if (existingProfile) {
    targetProfileId = existingProfile.id;
    // Upgrade profile to admin
    await supabase
      .from("profiles")
      .update({
        role: "admin",
        full_name: formData.name,
        whatsapp_number: formData.whatsappNumber,
      })
      .eq("id", targetProfileId);
  } else {
    // Attempt Auth SignUp if password provided, or generate UUID profile
    if (formData.password && formData.password.trim().length >= 6) {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: formData.password.trim(),
        options: {
          data: {
            full_name: formData.name,
            role: "admin",
          },
        },
      });

      if (authErr) {
        // Fallback to direct profile creation if auth signup returns existing session or error
        targetProfileId = crypto.randomUUID();
      } else {
        targetProfileId = authData.user?.id || crypto.randomUUID();
      }
    } else {
      targetProfileId = crypto.randomUUID();
    }

    const { error: insertProfileErr } = await supabase.from("profiles").upsert(
      {
        id: targetProfileId,
        email: cleanEmail,
        full_name: formData.name,
        whatsapp_number: formData.whatsappNumber,
        role: "admin",
        is_verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (insertProfileErr) {
      throw new Error(`Error al crear el perfil de administrador: ${insertProfileErr.message}`);
    }
  }

  // Insert or Upsert into admin_staff_members
  const { error: staffErr } = await supabase
    .from("admin_staff_members")
    .upsert(
      {
        profile_id: targetProfileId,
        sub_role: formData.subRole,
        department: formData.department,
        permissions: formData.permissions,
        status: "active",
        notes: formData.notes || "Nuevo alta de personal",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );

  if (staffErr) {
    throw new Error(`Error al asignar metadata administrativa: ${staffErr.message}`);
  }

  revalidatePath("/dashboard/admin/staff");
  return { success: true, profileId: targetProfileId };
}

export async function updateAdminStaffMember(
  profileId: string,
  formData: {
    name: string;
    email: string;
    whatsappNumber: string;
    subRole: AdminSubRole;
    department: string;
    permissions: AdminPermissionKey[];
    status: AdminStaffStatus;
    notes?: string;
  }
) {
  const { supabase } = await requireAdminAuth();

  // Update profile basic info
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      full_name: formData.name,
      email: formData.email,
      whatsapp_number: formData.whatsappNumber,
    })
    .eq("id", profileId);

  if (profileErr) {
    throw new Error(`Error al actualizar el perfil: ${profileErr.message}`);
  }

  // Update admin staff metadata
  const { error: staffErr } = await supabase
    .from("admin_staff_members")
    .upsert(
      {
        profile_id: profileId,
        sub_role: formData.subRole,
        department: formData.department,
        permissions: formData.permissions,
        status: formData.status,
        notes: formData.notes || "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );

  if (staffErr) {
    throw new Error(`Error al actualizar permisos y estado: ${staffErr.message}`);
  }

  revalidatePath("/dashboard/admin/staff");
  return { success: true };
}

export async function toggleAdminStaffStatus(profileId: string, status: AdminStaffStatus) {
  const { supabase } = await requireAdminAuth();

  const { error } = await supabase
    .from("admin_staff_members")
    .upsert(
      {
        profile_id: profileId,
        status: status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );

  if (error) {
    throw new Error(`Error al cambiar el estado: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/staff");
  return { success: true };
}

export async function deleteAdminStaffMember(profileId: string) {
  const { supabase, user } = await requireAdminAuth();

  if (user.id === profileId) {
    throw new Error("No puede dar de baja su propio usuario administrador.");
  }

  // Remove from admin_staff_members
  await supabase.from("admin_staff_members").delete().eq("profile_id", profileId);

  // Downgrade profile role to candidate to revoke admin permissions safely
  const { error } = await supabase
    .from("profiles")
    .update({ role: "candidate" })
    .eq("id", profileId);

  if (error) {
    throw new Error(`Error al dar de baja el acceso administrativo: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/staff");
  return { success: true };
}
