import * as React from "react";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

import { Badge } from "@/components/ui/badge";
import { AdminPlatformStats } from "@/modules/admin/components/admin-platform-stats";
import { AdminProfilesManager } from "./profiles-manager";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // 1. Authenticate user securely on the server
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch user details to enforce admin permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  // 3. Query candidates and companies from real Supabase tables
  const [candidatesResult, companyProfilesResult] = await Promise.all([
    supabase
      .from("candidate_profiles")
      .select("id, skills, is_verified, profiles(full_name, location, avatar_url)"),
    supabase
      .from("company_profiles")
      .select("id, company_name, logo_url, fiscal_address, is_verified")
  ]);

  const candidates = (candidatesResult.data || []).map((c: any) => {
    const baseProf = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
    return {
      id: c.id,
      full_name: baseProf?.full_name || "Candidato",
      role: "candidate" as const,
      location: baseProf?.location || "",
      skills: Array.isArray(c.skills) ? c.skills : String(c.skills || "").split(",").filter(Boolean),
      is_validated: !!c.is_verified,
      avatar_url: baseProf?.avatar_url || null,
    };
  });

  const companies = (companyProfilesResult.data || []).map((c: any) => ({
    id: c.id,
    company_name: c.company_name || "Empresa",
    logo_url: c.logo_url || null,
    location: c.fiscal_address || "",
    is_validated: !!c.is_verified,
    role: "company" as const
  }));

  return (
    <div className="flex-grow min-h-screen bg-[#fafafa] dark:bg-zinc-950/20 px-4 md:px-10 lg:px-12 py-10 space-y-10 max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
      
      {/* Page Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-border/10">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Badge variant="outline" className="px-2.5 py-1 rounded-md border-primary/20 bg-primary/5 text-primary text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
              Consola de Administración Central
            </Badge>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none flex items-center gap-2">
            Consola de Auditoría
          </h2>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xl">
            Control de calidad, sello de verificación y aprobación de perfiles de candidatos y empresas.
          </p>
        </div>
      </section>

      {/* Metric Cards */}
      <AdminPlatformStats />

      {/* Profiles Directory Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-zinc-400 shrink-0" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight uppercase tracking-wider text-[11px] text-zinc-400">
            Directorio de Perfiles & Aprobaciones
          </h3>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-border/10 rounded-2xl p-6 shadow-none">
          <AdminProfilesManager initialCandidates={candidates} initialCompanies={companies} />
        </div>
      </section>

    </div>
  );
}
