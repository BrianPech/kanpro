import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { getCompanyDashboardData } from "@/modules/company/services/company-dashboard";
import { getCompanyIncidentsAction } from "@/modules/company/actions/incidents";
import { IncidentsView } from "@/modules/company/components/incidents-view";

export default async function CompanyIncidentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [incidentsRes, employeesRes, dashboardData] = await Promise.all([
    getCompanyIncidentsAction(),
    user
      ? supabase
          .from("company_employees")
          .select("id, full_name, job_title, department")
          .eq("company_id", user.id)
          .eq("status", "active")
          .order("full_name", { ascending: true })
      : Promise.resolve({ data: [] }),
    getCompanyDashboardData(),
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
    />
  );
}
