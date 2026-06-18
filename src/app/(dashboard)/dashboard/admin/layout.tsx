import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName, userInitials, role, plan } = await getDashboardSession();

  return (
    <SidebarProvider className="h-screen overflow-hidden flex bg-background">
      <AdminSidebar />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <DashboardTopbar
          userName={userName}
          userInitials={userInitials}
          plan={plan}
          role={role}
        />
        <div className="flex-1 overflow-y-auto min-h-0 bg-background">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
