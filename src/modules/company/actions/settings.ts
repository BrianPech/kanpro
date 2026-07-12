"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Toggles recruitment status (is_active) for all vacancies belonging to a company.
 * 
 * @param companyId The ID of the company
 * @param pause True to pause recruitment (deactivate vacancies), false to resume
 */
export async function toggleGlobalRecruitment(companyId: string, pause: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("vacancies")
    .update({ is_active: !pause })
    .eq("company_id", companyId)

  if (error) {
    console.error("Error toggling global recruitment:", error)
    throw new Error("No se pudo actualizar el estado de reclutamiento.")
  }

  // Revalidate relevant pages so candidate feeds and dashboard are updated
  revalidatePath("/dashboard/company/settings")
  revalidatePath("/discovery")
  revalidatePath("/dashboard/company/vacancies")
  revalidatePath("/")

  return { success: true }
}

/**
 * Updates the preferred contact channel for a company profile.
 * 
 * @param companyId The ID of the company profile
 * @param channel The contact channel ('whatsapp' | 'phone' | 'inbox')
 */
export async function updateContactChannel(companyId: string, channel: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("company_profiles")
    .update({ contact_channel: channel })
    .eq("id", companyId)

  if (error) {
    console.error("Error updating contact channel:", error)
    throw new Error("No se pudo actualizar el canal de contacto preferido.")
  }

  revalidatePath("/dashboard/company/settings")

  return { success: true }
}
