"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  await requireAdminAuth();
  const supabaseAdmin = createAdminClient();

  // Fetch admin profiles
  const { data: adminProfiles, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, whatsapp_number, avatar_url, role, created_at, updated_at")
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  if (profileErr) {
    console.error("Error fetching admin profiles:", profileErr);
    return [];
  }

  // Fetch staff metadata table
  const { data: staffMembers } = await supabaseAdmin
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
  await requireAdminAuth();

  const cleanEmail = formData.email.trim().toLowerCase();
  const cleanName = formData.name.trim();
  const cleanPhone = formData.whatsappNumber?.trim() || "";
  const cleanPassword = formData.password?.trim();

  if (!cleanEmail || !cleanName) {
    throw new Error("Nombre y correo electrónico institucional son requeridos.");
  }

  const supabaseAdmin = createAdminClient();

  // Check if profile exists with this email
  const { data: existingProfile, error: profileCheckErr } = await supabaseAdmin
    .from("profiles")
    .select("id, role, email")
    .eq("email", cleanEmail)
    .maybeSingle();

  if (profileCheckErr) {
    throw new Error(`Error al verificar existencia del usuario: ${profileCheckErr.message}`);
  }

  if (existingProfile) {
    // If existing user has role 'candidate' or 'company', reject explicitly
    if (existingProfile.role === "candidate" || existingProfile.role === "company") {
      throw new Error(
        "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."
      );
    }

    // If existing user is already an admin, update profile info and staff metadata
    if (existingProfile.role === "admin") {
      const targetProfileId = existingProfile.id;

      const { error: updateProfileErr } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: cleanName,
          whatsapp_number: cleanPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetProfileId);

      if (updateProfileErr) {
        throw new Error(`Error al actualizar el perfil de administrador: ${updateProfileErr.message}`);
      }

      const { error: staffErr } = await supabaseAdmin
        .from("admin_staff_members")
        .upsert(
          {
            profile_id: targetProfileId,
            sub_role: formData.subRole,
            department: formData.department,
            permissions: formData.permissions,
            status: "active",
            notes: formData.notes || "Actualización de personal administrativo",
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

    throw new Error(
      "Este correo ya está registrado como candidato o empresa. Para otorgar acceso administrativo, utilice un flujo explícito de promoción."
    );
  }

  // New user creation: password is required and must be at least 6 characters
  if (!cleanPassword || cleanPassword.length < 6) {
    throw new Error("La contraseña para el nuevo administrador debe tener al menos 6 caracteres.");
  }

  // Create user in Supabase Auth via Admin API
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: cleanEmail,
    password: cleanPassword,
    email_confirm: true,
    user_metadata: {
      full_name: cleanName,
      whatsapp_number: cleanPhone,
    },
  });

  if (authErr || !authData?.user) {
    throw new Error(`Error al registrar credenciales de administrador: ${authErr?.message || "Desconocido"}`);
  }

  const targetProfileId = authData.user.id;

  // Transactional promotion with compensatory rollback
  try {
    // Explicitly promote profile to admin role
    const { error: insertProfileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: targetProfileId,
          email: cleanEmail,
          full_name: cleanName,
          whatsapp_number: cleanPhone,
          role: "admin",
          is_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (insertProfileErr) {
      throw new Error(`Error al crear el perfil de administrador: ${insertProfileErr.message}`);
    }

    // Insert or Upsert into admin_staff_members
    const { error: staffErr } = await supabaseAdmin
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
  } catch (operationErr) {
    // Compensatory Rollback: clean up auth user if created during this operation
    try {
      await supabaseAdmin.auth.admin.deleteUser(targetProfileId);
    } catch (rollbackErr) {
      console.error(`Error en rollback compensatorio eliminando usuario ${targetProfileId}:`, rollbackErr);
    }
    throw operationErr;
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
  await requireAdminAuth();
  const supabaseAdmin = createAdminClient();

  // Update profile basic info
  const { error: profileErr } = await supabaseAdmin
    .from("profiles")
    .update({
      full_name: formData.name,
      email: formData.email,
      whatsapp_number: formData.whatsappNumber,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (profileErr) {
    throw new Error(`Error al actualizar el perfil: ${profileErr.message}`);
  }

  // Update admin staff metadata
  const { error: staffErr } = await supabaseAdmin
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
  await requireAdminAuth();
  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin
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
  const { user } = await requireAdminAuth();

  if (user.id === profileId) {
    throw new Error("No puede dar de baja su propio usuario administrador.");
  }

  const supabaseAdmin = createAdminClient();

  // Remove from admin_staff_members
  await supabaseAdmin.from("admin_staff_members").delete().eq("profile_id", profileId);

  // Downgrade profile role to candidate to revoke admin permissions safely
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role: "candidate" })
    .eq("id", profileId);

  if (error) {
    throw new Error(`Error al dar de baja el acceso administrativo: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/staff");
  return { success: true };
}
