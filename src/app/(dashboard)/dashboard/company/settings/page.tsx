import { CompanySettingsView } from "@/modules/company/components/settings-view";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CompanySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch company details, vacancies, and invoices concurrently via Promise.all
  const [profileRes, vacanciesRes, invoicesRes] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("vacancies")
      .select("id, is_active")
      .eq("company_id", user.id),
    supabase
      .from("company_invoices")
      .select("*")
      .eq("company_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  const profile = profileRes.data;
  const vacancies = vacanciesRes.data;
  const invoices = invoicesRes.data;

  // If there are vacancies, recruitment is paused if ALL vacancies are inactive.
  // If there are no vacancies, we default to active (false).
  const hasVacancies = vacancies && vacancies.length > 0;
  const hasActiveVacancies = vacancies && vacancies.some((v: { is_active: boolean }) => v.is_active);
  const initialPauseState = hasVacancies ? !hasActiveVacancies : false;

  const p = profile;
  const defaultProfile = {
    id: user.id,
    company_name: p?.company_name || "Mi Empresa",
    credits_available: p?.credits_available ?? 0,
    contact_channel: (p as { contact_channel?: string } | null)?.contact_channel || "whatsapp",
    logo_url: p?.logo_url || null,
    description: p?.description || null,
    phone: p?.contact_phone || null,
    company_size: p?.company_size || null,
    industry: p?.industry || null,
    website_or_linkedin: p?.website_url || null,
    whatsapp_number: p?.contact_phone || "",
    subscription_plan: p?.subscription_plan || "basic",
    subscription_status: p?.subscription_status || "active",
    subscription_period_end: p?.subscription_period_end || null,
    featured_vacancies_allowance: p?.featured_vacancies_allowance ?? 0,
    featured_vacancies_used: p?.featured_vacancies_used ?? 0,
    rfc: p?.rfc || null,
    legal_name: p?.legal_name || null,
    entity_type: p?.entity_type || null,
    fiscal_address: p?.fiscal_address || null,
    corporate_email: p?.corporate_email || user.email || null,
    verification_status: p?.verification_status || null,
  };

  return (
    <CompanySettingsView
      user={{ id: user.id, email: user.email || "" }}
      initialProfile={defaultProfile}
      initialPauseState={initialPauseState}
      initialInvoices={invoices || []}
    />
  );
}
