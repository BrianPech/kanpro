"use server";

import { requireAdminAuth } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: "admin" | "candidate" | "company") {
  const { supabase, user } = await requireAdminAuth({ requiredPermission: "manage_users" });

  if (userId === user.id && newRole !== "admin") {
    throw new Error("No puede revocar sus propios permisos de administrador.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Error al actualizar el rol: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function toggleUserStatus(userId: string, newStatus: "active" | "inactive" | "suspended") {
  const { supabase, user } = await requireAdminAuth();

  if (userId === user.id && newStatus !== "active") {
    throw new Error("No puede desactivar o suspender su propia cuenta.");
  }

  const locationNote = newStatus === "suspended" ? "SUSPENDIDO" : newStatus === "inactive" ? "INACTIVO" : null;

  const updatePayload: {
    location?: string | null;
    is_verified?: boolean;
    updated_at?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (locationNote) {
    updatePayload.location = locationNote;
  }
  if (newStatus === "suspended") {
    updatePayload.is_verified = false;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId);

  if (error) {
    throw new Error(`Error al actualizar el estado: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function updateUserProfile(userId: string, data: { fullName: string; role: "admin" | "candidate" | "company" }) {
  const { supabase } = await requireAdminAuth();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName,
      role: data.role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Error al actualizar perfil de usuario: ${error.message}`);
  }

  revalidatePath("/dashboard/admin/users");
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function getUserProfileDetails(userId: string) {
  const { supabase } = await requireAdminAuth();

  const [baseProfileRes, candidateRes, companyRes, docsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single(),
    supabase
      .from("candidate_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("company_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("profile_documents")
      .select("*")
      .eq("owner_id", userId),
  ]);

  return {
    profile: baseProfileRes.data,
    candidate: candidateRes.data,
    company: companyRes.data,
    documents: docsRes.data || [],
  };
}
