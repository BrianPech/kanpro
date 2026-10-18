import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CandidateSidebar } from "@/modules/candidate/components/navigation/candidate-sidebar";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { CandidateTopbar } from "@/modules/candidate/components/navigation/candidate-topbar";
import { CandidateBottomNav } from "@/modules/candidate/components/navigation/candidate-bottom-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName, userInitials, plan } = await getDashboardSession();
  const isEmployee = plan.startsWith("Empleado");

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
      className="h-screen overflow-hidden flex bg-sidebar"
    >
      <CandidateSidebar variant="inset" isEmployee={isEmployee} />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <CandidateTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
        />
        <ScrollArea className="flex-1 min-h-0 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
          <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </ScrollArea>
        <CandidateBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
