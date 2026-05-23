import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export default async function DashboardShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName, userInitials, role, plan } = await getDashboardSession();

  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset>
        <DashboardTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
          role={role}
        />
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
