import * as React from "react";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
      className="h-screen overflow-hidden flex bg-sidebar"
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        <SiteHeader />
        <ScrollArea className="flex-1 min-h-0 w-full" style={{ WebkitOverflowScrolling: "touch" }}>
          <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
