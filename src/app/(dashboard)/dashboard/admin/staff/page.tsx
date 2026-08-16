import { StaffDataTable } from "@/modules/admin/components/staff-data-table";
import { getAdminStaffMembers } from "@/app/(dashboard)/dashboard/admin/staff/actions";
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
  // Fetch real staff data from database
  const staffMembers = await getAdminStaffMembers();

  const totalStaff = staffMembers.length;
  const totalSuperAdmins = staffMembers.filter((s) => s.subRole === "super_admin").length;
  const activeStaff = staffMembers.filter((s) => s.status === "active").length;
  const totalPermissionsAssigned = staffMembers.reduce(
    (acc, curr) => acc + (curr.permissions?.length || 0),
    0
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Page Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
          <ShieldCheckIcon className="size-6 text-purple-500" />
          Gestión de Administradores y Personal K’anPro
        </h1>
        <p className="text-xs text-muted-foreground">
          Administre el equipo interno, otorgue o revoque permisos granulares y dé de alta a nuevo personal técnico y operativo.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Personal Registrado</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
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
            <div className="text-muted-foreground text-xs">
              Cuentas administrativas activas
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Super Administradores</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
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
            <div className="text-muted-foreground text-xs">
              Gestión global del sistema
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Personal Activo</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
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
            <div className="text-muted-foreground text-xs">
              Con acceso al panel admin
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Permisos Concedidos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
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
            <div className="text-muted-foreground text-xs">
              Reglas de acceso aplicadas
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Staff Interactive Table */}
      <div>
        <StaffDataTable initialData={staffMembers} />
      </div>
    </div>
  );
}
