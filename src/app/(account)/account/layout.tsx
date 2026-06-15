import * as React from "react";
import { HelpCircle, Grid } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName, userInitials, role } = await getDashboardSession();

  return (
    <SidebarProvider className="h-screen overflow-hidden flex bg-background font-sans select-none">
      {/* Sidebar with structural header and footer */}
      <AccountSidebar role={role} />

      {/* Main content wrapper */}
      <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Right Header containing top-right actions only */}
        <header className="h-16 px-8 flex items-center justify-end bg-transparent shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
              <Grid className="h-5 w-5" />
            </Button>
            <Link href="/account" className="focus:outline-none">
              <Avatar className="h-9 w-9 cursor-pointer border border-border/20 hover:ring-2 hover:ring-primary/10 transition-all">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Scrollable Main Content area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 lg:px-16">
          <div className="max-w-[960px] mx-auto w-full">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
