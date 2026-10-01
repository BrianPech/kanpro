import * as React from "react";
import { createClient } from "@/lib/supabase/server";
import { getCompanyAttendanceData } from "@/modules/company/services/company-attendance";
import { AttendanceView } from "@/modules/company/components/attendance-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Control de Asistencia & Checador | K'anPro",
  description: "Monitoreo en tiempo real de entradas por GPS, QR, retardos y expedientes de asistencia.",
};

interface CompanyAttendancePageProps {
  searchParams?: Promise<{ date?: string }>;
}

export default async function CompanyAttendancePage({ searchParams }: CompanyAttendancePageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const targetDate = resolvedParams?.date;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await getCompanyAttendanceData(supabase, user?.id || "", targetDate);

  return (
    <AttendanceView
      initialRecords={data.records}
      initialStats={data.stats}
      branchConfig={data.branchConfig}
      companyName={data.companyName}
      workDate={data.workDate}
      employees={data.employees}
    />
  );
}
