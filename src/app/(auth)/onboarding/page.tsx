import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { companyTenantService } from "@/modules/company/services/company-tenant.service";
import { CompanyOnboardingFlow } from "@/modules/auth/components/company-onboarding-flow";

export const metadata = {
  title: "Configuración Inicial | K'anPro",
  description: "Completa tu nombre y registra tu primera empresa para comenzar.",
};

const DEFAULT_PLACEHOLDER_NAMES = new Set([
  "usuario k’anpro",
  "usuario k'anpro",
  "titular de empresa",
  "",
]);

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    profile?.role ||
    (user.user_metadata?.role === "company" ? "company" : "candidate");

  if (role === "candidate") {
    redirect("/dashboard/candidate");
  }

  if (role === "admin") {
    redirect("/dashboard/admin");
  }

  const userCompanies = await companyTenantService.getUserCompanies(
    user.id,
    supabase
  );

  const rawName = (profile?.full_name || "").trim();
  const hasValidName = !DEFAULT_PLACEHOLDER_NAMES.has(rawName.toLowerCase());

  if (hasValidName && userCompanies.length > 0) {
    redirect("/dashboard/company");
  }

  const initialStep: 1 | 2 = hasValidName ? 2 : 1;

  return (
    <CompanyOnboardingFlow
      initialStep={initialStep}
      initialFullName={hasValidName ? rawName : ""}
    />
  );
}
