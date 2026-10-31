"use server";

import { requireAdminAuth } from "@/lib/auth/require-admin";
import { revalidatePath } from "next/cache";

export async function toggleProfileVerification(profileId: string, isValidated: boolean) {
  const { supabase } = await requireAdminAuth({ requiredPermission: "verify_documents" });

  // Perform the update securely using RLS-governed database client
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ is_verified: isValidated })
    .eq("id", profileId);

  if (updateErr) {
    throw new Error(`Error al actualizar la verificación: ${updateErr.message}`);
  }

  // Revalidate cache to sync data immediately
  revalidatePath("/dashboard/admin");

  return { success: true };
}

// Export toggleCandidateVerification for backwards compatibility with tests
export const toggleCandidateVerification = toggleProfileVerification;
