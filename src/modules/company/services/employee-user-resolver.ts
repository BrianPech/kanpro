import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Resuelve el usuario (profiles.id) de un colaborador: vínculo directo o por correo.
 */
export async function resolveEmployeeUserId(
  supabase: SupabaseClient<Database>,
  employee: { employee_id?: string | null; email?: string | null }
): Promise<string | null> {
  if (employee.employee_id) {
    return employee.employee_id;
  }
  if (!employee.email) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", employee.email)
    .maybeSingle();

  return profile?.id ?? null;
}
