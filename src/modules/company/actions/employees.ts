"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Updates the employment start date for a hired candidate.
 */
export async function updateEmployeeStartDate(applicationId: string, startDate: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicia sesión para continuar.")
  }

  const { error } = await (supabase.from as any)("applications")
    .update({
      notes: startDate ? `Inicio de labores: ${startDate}` : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", applicationId)

  if (error) {
    console.error("Error updating start date:", error)
    throw new Error("No se pudo actualizar la fecha de inicio.")
  }

  revalidatePath("/dashboard/company/employees")

  return { success: true }
}

/**
 * Terminates / archives an employee relationship with a documented reason.
 */
export async function terminateEmployee(
  applicationId: string,
  reason: string,
  notes?: string
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicia sesión para continuar.")
  }

  const { error } = await (supabase.from as any)("applications")
    .update({
      status: "Baja",
      notes: `Motivo de baja: ${reason}. ${notes ? `Detalles: ${notes}` : ""}`.trim(),
      updated_at: new Date().toISOString()
    })
    .eq("id", applicationId)

  if (error) {
    console.error("Error terminating employee:", error)
    throw new Error("No se pudo registrar la baja del colaborador.")
  }

  revalidatePath("/dashboard/company/employees")

  return { success: true }
}

/**
 * Reactivates a terminated employee back to active Hired status.
 */
export async function reactivateEmployee(applicationId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicia sesión para continuar.")
  }

  const { error } = await (supabase.from as any)("applications")
    .update({
      status: "Contratado",
      updated_at: new Date().toISOString()
    })
    .eq("id", applicationId)

  if (error) {
    console.error("Error reactivating employee:", error)
    throw new Error("No se pudo reactivar al colaborador.")
  }

  revalidatePath("/dashboard/company/employees")

  return { success: true }
}
