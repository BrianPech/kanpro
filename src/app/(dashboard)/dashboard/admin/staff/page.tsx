import { requireAdmin } from "@/lib/auth/require-admin";

import { AppSidebar } from "@/modules/admin/components/app-sidebar";
import { SiteHeader } from "@/modules/admin/components/site-header";
import { StaffDataTable } from "@/modules/admin/components/staff-data-table";
import { getAdminStaffMembers } from "@/app/(dashboard)/dashboard/admin/staff/actions";
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
  ShieldCheckIcon,
  UserCheckIcon,
  KeyRoundIcon,
  UsersIcon,
  TrendingUpIcon,
} from "lucide-react";

export default async function AdminStaffPage() {
  await requireAdmin();

  // 3. Fetch real staff data from database
  const staffMembers = await getAdminStaffMembers();

  const totalStaff = staffMembers.length;
  const totalSuperAdmins = staffMembers.filter((s) => s.subRole === "super_admin").length;
  const activeStaff = staffMembers.filter((s) => s.status === "active").length;
  const totalPermissionsAssigned = staffMembers.reduce(
    (acc, curr) => acc + (curr.permissions?.length || 0),
    0
  );

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
                  <ShieldCheckIcon className="size-6 text-purple-500" />
                  Gestión de Administradores y Personal K’anPro
                </h1>
                <p className="text-xs text-muted-foreground">
                  Administre el equipo interno, otorgue o revoque permisos granulares y dé de alta a nuevo personal técnico y operativo.
                </p>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Personal Registrado</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {totalStaff}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <UsersIcon className="size-3.5 text-purple-500" />
                        Equipo K’anPro
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Control Interno{" "}
                      <TrendingUpIcon className="size-4 text-purple-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Cuentas administrativas activas
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Super Administradores</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {totalSuperAdmins}
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
                      Dirección General{" "}
                      <ShieldCheckIcon className="size-4 text-purple-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Gestión global del sistema
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Personal Activo</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {activeStaff}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <UserCheckIcon className="size-3.5 text-green-500" />
                        Operativo
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Estado Activo{" "}
                      <UserCheckIcon className="size-4 text-green-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Con acceso al panel admin
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader>
                    <CardDescription>Permisos Concedidos</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                      {totalPermissionsAssigned}
                    </CardTitle>
                    <CardAction>
                      <Badge variant="outline">
                        <KeyRoundIcon className="size-3.5 text-blue-500" />
                        Granulares
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Seguridad y Control{" "}
                      <KeyRoundIcon className="size-4 text-blue-500" />
                    </div>
                    <div className="text-muted-foreground">
                      Reglas de acceso aplicadas
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Staff Interactive Table */}
              <div className="px-4 lg:px-6">
                <StaffDataTable initialData={staffMembers} />
              </div>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
