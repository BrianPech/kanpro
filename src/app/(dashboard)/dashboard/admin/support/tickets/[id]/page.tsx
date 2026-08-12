import * as React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { getSupportTicketById } from "@/app/(dashboard)/dashboard/admin/support/actions";
import { TicketWorkbenchClient } from "./ticket-workbench-client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminTicketDetailPage({ params }: TicketPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Authenticate user securely on the server
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 2. Fetch admin user profile to verify permissions
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!adminProfile || adminProfile.role !== "admin") {
    redirect("/login");
  }

  // 3. Fetch ticket data
  const ticket = await getSupportTicketById(id);

  if (!ticket) {
    redirect("/dashboard/admin/support");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col h-[calc(100vh-var(--header-height))] overflow-hidden">
          {/* Top Breadcrumb Header Bar */}
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border/30 bg-card shrink-0">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5">
                <Link href="/dashboard/admin/support">
                  <ArrowLeftIcon className="size-3.5" />
                  <span>Volver a Soporte</span>
                </Link>
              </Button>
              <div className="h-4 w-px bg-border/40" />
              <span className="text-xs text-muted-foreground font-medium">
                Atención de Ticket <strong className="text-foreground font-semibold">{ticket.ticketNumber}</strong>
              </span>
            </div>
          </div>

          {/* Dedicated Full Page Workbench */}
          <div className="flex-1 overflow-hidden">
            <TicketWorkbenchClient ticket={ticket} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
