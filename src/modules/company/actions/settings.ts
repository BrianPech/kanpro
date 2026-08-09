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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.")
  }

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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.")
  }

  const { error } = await supabase
    .from("company_profiles")
    .update({ contact_channel: channel } as any)
    .eq("id", companyId)

  if (error) {
    console.error("Error updating contact channel:", error)
    throw new Error("No se pudo actualizar el canal de contacto preferido.")
  }

  revalidatePath("/dashboard/company/settings")

  return { success: true }
}

/**
 * Updates the subscription plan for a company and generates a billing invoice record.
 * 
 * @param companyId The ID of the company
 * @param plan 'basic' | 'pro' | 'enterprise'
 */
export async function updateSubscriptionPlan(companyId: string, plan: "basic" | "pro" | "enterprise") {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("No autorizado. Inicie sesión para continuar.")
  }

  // Determine allowance & price based on plan
  let featuredAllowance = 0
  let planPrice = 0
  let planName = "Plan Básico"

  if (plan === "pro") {
    featuredAllowance = 3
    planPrice = 1499.00
    planName = "Plan PRO Mensual"
  } else if (plan === "enterprise") {
    featuredAllowance = 10
    planPrice = 3999.00
    planName = "Plan Corporativo Mensual"
  }

  const periodEnd = new Date()
  periodEnd.setDate(periodEnd.getDate() + 30)

  const { error: updateErr } = await supabase
    .from("company_profiles")
    .update({
      subscription_plan: plan,
      subscription_status: "active",
      subscription_period_end: periodEnd.toISOString(),
      featured_vacancies_allowance: featuredAllowance,
      updated_at: new Date().toISOString()
    } as any)
    .eq("id", companyId)

  if (updateErr) {
    console.error("Error updating subscription plan:", updateErr)
    throw new Error("No se pudo actualizar el plan de suscripción.")
  }

  // Create invoice record in DB if price > 0
  if (planPrice > 0) {
    await supabase.from("company_invoices").insert({
      company_id: companyId,
      plan_name: planName,
      amount: planPrice,
      currency: "MXN",
      status: "paid",
      payment_method: "Tarjeta / Suscripción Activa"
    })
  }

  revalidatePath("/dashboard/company/settings")
  revalidatePath("/dashboard/company")
  revalidatePath("/dashboard/company/vacancies")

  return { success: true }
}

/**
 * Fetches billing invoices for a company.
 * 
 * @param companyId The ID of the company
 */
export async function getCompanyInvoices(companyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("company_invoices")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching company invoices:", error)
    return []
  }

  return data || []
}


