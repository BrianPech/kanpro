import { createClient } from "@/lib/supabase/server";
import { UsersDataTable, type UserItem } from "@/modules/admin/components/users-data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Database } from "@/types/supabase";
import { TrendingUpIcon, ShieldCheckIcon, Building2Icon, UserCheckIcon } from "@/components/ui/icons";

type UserRole = Database["public"]["Enums"]["user_role"];

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Optimized query: Select only necessary indexed columns from public.profiles
  const { data: dbProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  // Map real DB profiles exclusively
  const realUsers: UserItem[] = (dbProfiles || []).map((p) => {
    const role: UserRole = p.role;
    return {
      id: p.id,
      name: p.full_name || "Usuario K’anPro",
      email: p.email || "Sin correo",
      role,
      status: "Activo",
      avatar: p.avatar_url || "",
      createdAt: p.created_at
        ? new Date(p.created_at).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Reciente",
    };
  });

  const totalUsers = realUsers.length;
  const totalCandidates = realUsers.filter((u) => u.role === "candidate").length;
  const totalCompanies = realUsers.filter((u) => u.role === "company").length;
  const totalAdmins = realUsers.filter((u) => u.role === "admin").length;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Usuarios Totales</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
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
            <div className="text-muted-foreground text-xs">
              Cuentas registradas en K’anPro
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Candidatos</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
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
            <div className="text-muted-foreground text-xs">
              Perfiles de talento activos
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Empresas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
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
            <div className="text-muted-foreground text-xs">
              Organizaciones reclutando
            </div>
          </CardFooter>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-card shadow-xs">
          <CardHeader>
            <CardDescription>Administradores</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
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
            <div className="text-muted-foreground text-xs">
              Cuentas con permiso admin
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Users Data Table */}
      <div>
        <UsersDataTable data={realUsers} />
      </div>
    </div>
  );
}
