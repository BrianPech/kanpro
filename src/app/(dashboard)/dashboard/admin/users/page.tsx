import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { UsersDataTable, type UserItem } from "@/modules/admin/components/users-data-table";
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
import { TrendingUpIcon, UsersIcon, ShieldCheckIcon, Building2Icon, UserCheckIcon } from "lucide-react";

export default async function AdminUsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  // 3. Optimized query: Select only necessary indexed columns from public.profiles
  const { data: dbProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  // 4. Map real DB profiles exclusively
  const realUsers: UserItem[] = (dbProfiles || []).map((p) => ({
    id: p.id,
    name: p.full_name || "Usuario K’anPro",
    email: p.email || "Sin correo",
    role: (p.role as "admin" | "candidate" | "company") || "candidate",
    status: "Activo",
    avatar: p.avatar_url || "",
    createdAt: p.created_at
      ? new Date(p.created_at).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Reciente",
  }));

  const totalUsers = realUsers.length;
  const totalCandidates = realUsers.filter((u) => u.role === "candidate").length;
  const totalCompanies = realUsers.filter((u) => u.role === "company").length;
  const totalAdmins = realUsers.filter((u) => u.role === "admin").length;

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
              
              {/* KPI Summary Cards matching Index SectionCards design */}
              <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Usuarios Totales</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {totalUsers}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <TrendingUpIcon />
                        +100%
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Plataforma activa{" "}
                      <TrendingUpIcon className="size-4 text-green-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Cuentas registradas en K’anPro
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Candidatos</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {totalCandidates}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <TrendingUpIcon />
                        +12.5%
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Buscadores de empleo{" "}
                      <UserCheckIcon className="size-4 text-blue-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Perfiles de talento activos
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Empresas</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {totalCompanies}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <TrendingUpIcon />
                        +5.0%
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Empleadores registrados{" "}
                      <Building2Icon className="size-4 text-amber-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Organizaciones reclutando
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Administradores</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {totalAdmins}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <ShieldCheckIcon className="size-3.5 text-purple-500" />
                        Acceso Total
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Gestión del sistema{" "}
                      <ShieldCheckIcon className="size-4 text-purple-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Cuentas con permiso admin
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Users Data Table */}
              <div className="px-4 lg:px-6">
                <UsersDataTable data={realUsers} />
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
