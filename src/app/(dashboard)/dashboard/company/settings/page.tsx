import { CompanySettingsView } from "@/modules/company/components/settings-view";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CompanySettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the company profile details
  const { data: profile } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Fetch vacancies to determine the initial global pause status
  const { data: vacancies } = await supabase
    .from("vacancies")
    .select("id, is_active")
    .eq("company_id", user.id);

  // Fetch company billing invoices
  const { data: invoices } = await supabase
    .from("company_invoices")
    .select("*")
    .eq("company_id", user.id)
    .order("created_at", { ascending: false });

  // If there are vacancies, recruitment is paused if ALL vacancies are inactive.
  // If there are no vacancies, we default to active (false).
  const hasVacancies = vacancies && vacancies.length > 0;
  const hasActiveVacancies = vacancies && vacancies.some((v: { is_active: boolean }) => v.is_active);
  const initialPauseState = hasVacancies ? !hasActiveVacancies : false;

  const defaultProfile = {
    id: user.id,
    company_name: profile?.company_name || "Mi Empresa",
    credits_available: profile?.credits_available ?? 3,
    contact_channel: profile?.contact_channel || "whatsapp",
    logo_url: profile?.logo_url || null,
    description: profile?.description || null,
    phone: profile?.contact_phone || null,
    company_size: profile?.company_size || null,
    industry: profile?.industry || null,
    website_or_linkedin: profile?.website_url || null,
    whatsapp_number: profile?.contact_phone || "",
    subscription_plan: profile?.subscription_plan || "basic",
    subscription_status: profile?.subscription_status || "active",
    subscription_period_end: profile?.subscription_period_end || null,
    featured_vacancies_allowance: profile?.featured_vacancies_allowance ?? 0,
    featured_vacancies_used: profile?.featured_vacancies_used ?? 0,
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
