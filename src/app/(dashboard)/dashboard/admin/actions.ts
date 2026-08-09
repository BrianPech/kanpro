"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleProfileVerification(profileId: string, isValidated: boolean) {
  const supabase = await createClient();

  // 1. Get current authenticated user session securely on the server
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autenticado");
  }

  // 2. Strictly check database profile to ensure user role is 'admin'
  const { data: currentUserProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileErr || !currentUserProfile || currentUserProfile.role !== "admin") {
    throw new Error("Acceso denegado: Se requieren permisos de administrador.");
  }

  // 3. Perform the update securely using RLS-governed database client
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ is_verified: isValidated })
    .eq("id", profileId);

  if (updateErr) {
    throw new Error(`Error al actualizar la verificación: ${updateErr.message}`);
  }

  // 4. Revalidate cache to sync data immediately
  revalidatePath("/dashboard/admin");

  return { success: true };
}

// Export toggleCandidateVerification for backwards compatibility with tests
export const toggleCandidateVerification = toggleProfileVerification;
