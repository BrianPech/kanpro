import * as React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import {
  getCompanyVerifications,
  getCandidateVerifications,
} from "./actions";
import { VerificationWorkbenchClient } from "./verification-workbench-client";
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
  BadgeCheckIcon,
  Building2Icon,
  UserCheckIcon,
  ShieldCheckIcon,
  FileCheckIcon,
} from "lucide-react";

export default async function AdminVerificationsPage() {
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

  // 3. Fetch real verification lists from Supabase
  const [companies, candidates] = await Promise.all([
    getCompanyVerifications(),
    getCandidateVerifications(),
  ]);

  const verifiedCompaniesCount = companies.filter((c) => c.isVerified).length;
  const verifiedCandidatesCount = candidates.filter((c) => c.isVerified).length;
  const pendingCompaniesCount = companies.filter((c) => !c.isVerified).length;

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
              
              {/* Page Title & Breadcrumb Header */}
              <div className="flex flex-col gap-1 px-4 lg:px-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
                  <BadgeCheckIcon className="size-6 text-purple-600" />
                  <span>Verificación Manual de Expedientes y Documentos</span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Audite RFC, Cédulas Profesionales, registros patronales y archivos cargados por Empresas y Candidatos en K’anPro.
                </p>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card">
                
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Empresas Verificadas</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {verifiedCompaniesCount} / {companies.length}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <Building2Icon className="size-3.5 text-blue-500" />
                        Empresas
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Con Badge Verificado{" "}
                      <ShieldCheckIcon className="size-4 text-emerald-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Documentación fiscal auditada
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Candidatos Verificados</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {verifiedCandidatesCount} / {candidates.length}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <UserCheckIcon className="size-3.5 text-purple-500" />
                        Candidatos
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Expedientes validados{" "}
                      <FileCheckIcon className="size-4 text-purple-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Cédula e INE verificados
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Auditorías Pendientes</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {pendingCompaniesCount}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <ShieldCheckIcon className="size-3.5 text-amber-500" />
                        Por Revisar
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Revisión prioritaria{" "}
                      <BadgeCheckIcon className="size-4 text-amber-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Pendientes de dictamen de staff
                    </div>
                  </CardFooter>
                </Card>

              </div>

              {/* Main Interactive Verification Workbench */}
              <div className="px-4 lg:px-6">
                <VerificationWorkbenchClient
                  initialCompanies={companies}
                  initialCandidates={candidates}
                />
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
