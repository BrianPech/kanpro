import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CompanySidebar } from "@/components/dashboard/company-sidebar";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { CompanyBottomNav } from "@/components/dashboard/company-bottom-nav";

export default async function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName, userInitials, role, plan } = await getDashboardSession();

  return (
    <SidebarProvider className="h-screen overflow-hidden flex bg-background">
      <CompanySidebar />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <DashboardTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
          role={role}
        />
        <main className="flex-1 overflow-y-auto min-h-0 bg-background pb-16 md:pb-0">{children}</main>
        <CompanyBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
