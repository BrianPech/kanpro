import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { SupportDataTable } from "@/modules/admin/components/support-data-table";
import { getSupportTickets } from "@/app/(dashboard)/dashboard/admin/support/actions";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HeadphonesIcon,
  LifeBuoyIcon,
  CheckCircle2Icon,
  ClockIcon,
  TrendingUpIcon,
} from "lucide-react";

export default async function AdminSupportPage() {
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

  // 3. Fetch real ticket data
  const tickets = await getSupportTickets();

  const openTickets = tickets.filter((t) => t.status === "abierto").length;
  const inProgressTickets = tickets.filter((t) => t.status === "en_proceso").length;
  const resolvedTickets = tickets.filter((t) => t.status === "resuelto" || t.status === "cerrado").length;
  const totalTickets = tickets.length;

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Page Header */}
              <div className="flex flex-col gap-1 px-4 lg:px-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
                  <HeadphonesIcon className="size-6 text-purple-500" />
                  Portal de Soporte Técnico y Asistencia K’anPro
                </h1>
                <p className="text-xs text-muted-foreground">
                  Atienda incidencias de usuarios, envíe notificaciones directas, acredite créditos a empresas e inspeccione perfiles con la Caja de Herramientas de Asistencia.
                </p>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Tickets Abiertos</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {openTickets}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <LifeBuoyIcon className="size-3.5 text-amber-500" />
                        Pendientes
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Atención requerida{" "}
                      <TrendingUpIcon className="size-4 text-amber-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Incidencias recibidas sin asignar
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>En Atención</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {inProgressTickets}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <HeadphonesIcon className="size-3.5 text-purple-500" />
                        En Proceso
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Agente Asignado{" "}
                      <HeadphonesIcon className="size-4 text-purple-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Tickets en seguimiento activo
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Tiempo de Respuesta</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      &lt; 15m
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <ClockIcon className="size-3.5 text-blue-500" />
                        SLA Objetivo
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Respuesta Exprés{" "}
                      <ClockIcon className="size-4 text-blue-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Promedio de primera atención
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Incidencias Resueltas</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {resolvedTickets}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <CheckCircle2Icon className="size-3.5 text-green-500" />
                        Completados
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      De {totalTickets} tickets totales{" "}
                      <CheckCircle2Icon className="size-4 text-green-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Casos solucionados favorablemente
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Support Data Table */}
              <div className="px-4 lg:px-6">
                <SupportDataTable initialData={tickets} />
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
