import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/modules/company/components/navigation/company-sidebar";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { CompanyTopbar } from "@/modules/company/components/navigation/company-topbar";
import { CompanyBottomNav } from "@/modules/company/components/navigation/company-bottom-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName, userInitials, role, plan } = await getDashboardSession();

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
      <CompanySidebar variant="inset" />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <CompanyTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
          role={role}
        />
        <ScrollArea className="flex-1 min-h-0 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
          <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 pb-20 md:pb-8 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </ScrollArea>
        <CompanyBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
