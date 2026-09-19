"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Revalidates the cache for the vacancies dashboard page.
 */
export async function revalidateVacancies() {
  revalidatePath("/dashboard/company/vacancies")
  revalidatePath("/dashboard/candidate/discovery")
  revalidatePath("/")
}

/**
 * Clones/duplicates an existing vacancy for the company.
 */
export async function cloneVacancyAction(vacancyId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicia sesión para continuar.")
  }

  // 1. Fetch source vacancy
  const { data: source, error: fetchError } = await supabase
    .from("vacancies")
    .select("*")
    .eq("id", vacancyId)
    .eq("company_id", user.id)
    .single()

  if (fetchError || !source) {
    throw new Error("No se encontró la vacante origen para duplicar.")
  }

  // 2. Prepare cloned vacancy payload
  const clonedData: any = {
    title: `${source.title} (Copia)`,
    description: source.description,
    requirements: source.requirements,
    category: source.category,
    employment_type: source.employment_type,
    shift_schedule: source.shift_schedule || "Matutino (Mañana)",
    positions_available: source.positions_available || 1,
    modality: source.modality || "Presencial",
    salary_min: source.salary_min,
    salary_max: source.salary_max,
    currency: source.currency || "MXN",
    payment_frequency: source.payment_frequency || "quincenal",
    location: source.location,
    zone: source.zone,
    experience_required: source.experience_required || "Sin experiencia previa",
    education_level: source.education_level || "Indistinto",
    benefits: source.benefits || [],
    skills: source.skills || [],
    tags: source.tags || source.skills || [],
    contact_phone: source.contact_phone || null,
    contact_email: source.contact_email || null,
    preferred_contact_method: source.preferred_contact_method || "whatsapp",
    company_id: user.id,
    recruiter_id: user.id,
    is_active: false,
    status: "Borrador",
  }

  const { data: inserted, error: insertError } = await supabase
    .from("vacancies")
    .insert(clonedData)
    .select("id, title")
    .single()

  if (insertError) {
    console.error("Error cloning vacancy:", insertError)
    throw new Error("No se pudo duplicar la vacante.")
  }

  revalidatePath("/dashboard/company/vacancies")
  revalidatePath("/dashboard/company")

  return { success: true, newVacancyId: inserted.id, title: inserted.title }
}
