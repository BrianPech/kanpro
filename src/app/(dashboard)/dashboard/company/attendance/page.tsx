import * as React from "react";
import { getCompanyAttendanceData } from "@/modules/company/services/company-attendance";
import { AttendanceView } from "@/modules/company/components/attendance-view";

export const metadata = {
  title: "Control de Asistencia & Checador | K'anPro",
  description: "Monitoreo en tiempo real de entradas por GPS, QR, retardos y expedientes de asistencia.",
};

export default async function CompanyAttendancePage() {
  const data = await getCompanyAttendanceData();

  return (
    <AttendanceView
      initialRecords={data.records}
      initialStats={data.stats}
      branchConfig={data.branchConfig}
      companyName={data.companyName}
      workDate={data.workDate}
    />
  );
}
