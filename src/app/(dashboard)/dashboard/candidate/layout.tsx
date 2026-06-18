import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CandidateSidebar } from "@/components/dashboard/candidate-sidebar";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { CandidateTopbar } from "@/components/dashboard/candidate-topbar";

export default async function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName, userInitials, plan } = await getDashboardSession();

  return (
    <SidebarProvider className="h-screen overflow-hidden flex bg-background">
      <CandidateSidebar />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <CandidateTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
        />
        <div className="flex-1 overflow-y-auto min-h-0 bg-background">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
