import { StaffDataTable } from "@/modules/admin/components/staff-data-table";
import { getAdminStaffMembers } from "@/app/(dashboard)/dashboard/admin/staff/actions";
import { Card } from "@/components/ui/card";
import {
  ShieldCheck,
  UserCheck,
  KeyRound,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Administradores y Staff | K'anPro Admin",
  description: "Gestión de equipo interno, control de roles y permisos granulares en K'anPro.",
};

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
    <div className="flex flex-1 flex-col gap-6 pb-8 animate-in fade-in duration-200">
      
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Personal Registrado
            </span>
            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {totalStaff}
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Equipo interno K'anPro
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Super Admins
            </span>
            <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {totalSuperAdmins}
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Acceso directivo global
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Personal Activo
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {activeStaff} <span className="text-xs text-muted-foreground font-sans">/ {totalStaff}</span>
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Con sesión operativa activa
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Permisos Asignados
            </span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <KeyRound className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
              {totalPermissionsAssigned}
            </h3>
            <p className="text-[11px] font-semibold text-muted-foreground">
              Reglas de acceso granulares
            </p>
          </div>
        </Card>
      </div>

      {/* Staff Interactive Table */}
      <StaffDataTable initialData={staffMembers} />
    </div>
  );
}
