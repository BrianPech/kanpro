import * as React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { NewStaffFormClient } from "./new-staff-form-client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, UserPlusIcon } from "lucide-react";

export default async function AdminNewStaffPage() {
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
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6 bg-muted/10 min-h-[calc(100vh-var(--header-height))] overflow-y-auto">
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-4 border-b border-border/30 pb-4">
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold gap-1.5 rounded-xl border-border/40">
                <Link href="/dashboard/admin/staff">
                  <ArrowLeftIcon className="size-4" />
                  <span>Volver a Administradores</span>
                </Link>
              </Button>
              <div className="h-5 w-px bg-border/40" />
              <div className="flex flex-col">
                <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <UserPlusIcon className="size-5 text-purple-600" />
                  <span>Dar de Alta a Nuevo Personal / Administrador</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Complete la información general y asigne los permisos necesarios para el nuevo miembro del equipo K’anPro.
                </p>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <NewStaffFormClient />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
