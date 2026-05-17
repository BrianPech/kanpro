import * as React from "react";
import Link from "next/link";
import { Bell, Search, Settings } from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Button } from "@/components/ui/button";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

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
        <header className="sticky top-0 z-40 flex h-[80px] shrink-0 items-center gap-4 px-6 md:px-10 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
            <div className="hidden md:flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-full h-10 px-4 max-w-[240px] w-full border border-border/50">
              <Search className="w-4 h-4" />
              <span className="text-[14px]">Buscar...</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Bell className="w-5 h-5" />
            </Button>

            <Link href="/dashboard/settings" passHref>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </Link>

            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity ml-2">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[14px] font-semibold text-foreground leading-tight tracking-tight">
                  {userName}
                </span>
                <span className="text-[12px] text-muted-foreground leading-tight mt-0.5">
                  {plan}
                </span>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-foreground to-muted-foreground flex items-center justify-center text-background text-[14px] font-bold shadow-sm">
                {userInitials}
              </div>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
