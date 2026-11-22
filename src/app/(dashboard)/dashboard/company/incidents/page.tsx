import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { getCompanyIncidentsAction } from "@/modules/company/actions/incidents";
import { IncidentsView } from "@/modules/company/components/incidents-view";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

export default async function CompanyIncidentsPage() {
  const [{ activeCompanyId }, supabase] = await Promise.all([
    getDashboardSession(),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetCompanyId = activeCompanyId || user?.id;

  const [incidentsRes, employeesRes, dashboardData, profileRes] = await Promise.all([
    getCompanyIncidentsAction(),
    targetCompanyId
      ? supabase
          .from("company_employees")
          .select("id, full_name, job_title, department")
          .eq("company_id", targetCompanyId)
          .eq("status", "active")
          .order("full_name", { ascending: true })
      : Promise.resolve({ data: [] }),
    getCompanyDashboardData(targetCompanyId),
    targetCompanyId
      ? supabase
          .from("company_profiles")
          .select("payroll_impact_config")
          .eq("id", targetCompanyId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const employees = (employeesRes.data || []).map((e) => ({
    id: e.id,
    fullName: e.full_name || "Sin nombre",
    jobTitle: e.job_title,
    department: e.department,
  }));

  return (
    <IncidentsView
      initialIncidents={incidentsRes.incidents || []}
      employees={employees}
      kpis={dashboardData.kpis}
      payrollImpactConfig={profileRes.data?.payroll_impact_config ?? null}
    />
  );
}
