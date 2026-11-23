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
          "--sidebar-width": "246px",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
      className="h-screen overflow-hidden flex bg-background md:bg-sidebar"
    >
      <CandidateSidebar isEmployee={isEmployee} />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background md:!bg-sidebar">
        <CandidateTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
          isEmployee={isEmployee}
        />

        {/* Marco del área de trabajo (idéntico al dashboard de empresas en md+) */}
        <div className="flex-1 min-h-0 flex flex-col md:px-3 md:pb-3 md:bg-sidebar">
          <div className="flex-1 min-h-0 flex flex-col md:rounded-[16px] md:border md:border-border bg-background overflow-hidden">
            <ScrollArea
              className="flex-1 min-h-0 w-full"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <main className="flex-1 flex flex-col px-6 pt-4 md:p-6 lg:px-8 lg:py-8 pb-32 md:pb-8 w-full">
                {children}
              </main>
            </ScrollArea>
          </div>
        </div>

        <CandidateBottomNav isEmployee={isEmployee} />
      </SidebarInset>
    </SidebarProvider>
  );
}
