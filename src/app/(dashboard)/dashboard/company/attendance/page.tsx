import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAttendanceData } from "@/modules/company/services/company-attendance";
import { AttendanceView } from "@/modules/company/components/attendance-view";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Control de Asistencia & Checador",
  description: "Monitoreo en tiempo real de entradas por GPS, QR, retardos y expedientes de asistencia.",
};

interface CompanyAttendancePageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function CompanyAttendancePage({ searchParams }: CompanyAttendancePageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const targetDate = resolvedParams?.date;

  const [{ activeCompanyId }, supabase] = await Promise.all([
    getDashboardSession(),
    createClient(),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetCompanyId = activeCompanyId || user?.id || "";
  const data = await getCompanyAttendanceData(supabase, targetCompanyId, targetDate);

  return (
    <AttendanceView
      companyId={data.companyId || targetCompanyId}
      initialRecords={data.records}
      initialStats={data.stats}
      branchConfig={data.branchConfig}
      companyName={data.companyName}
      workDate={data.workDate}
      employees={data.employees}
    />
  );
}
