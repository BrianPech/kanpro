import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  SecurityCheckIcon,
  Settings01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { StaffDataTable } from "@/modules/admin/components/staff-data-table";
import { getAdminStaffMembers } from "@/app/(dashboard)/dashboard/admin/staff/actions";

export const metadata = {
  title: "Administradores y Staff | K'anPro Admin",
  description:
    "Gestión de equipo interno, control de roles y permisos granulares en K'anPro.",
};

export default async function AdminStaffPage() {
  const staffMembers = await getAdminStaffMembers();

  const totalStaff = staffMembers.length;
  const totalSuperAdmins = staffMembers.filter(
    (s) => s.subRole === "super_admin"
  ).length;
  const activeStaff = staffMembers.filter((s) => s.status === "active").length;
  const totalPermissionsAssigned = staffMembers.reduce(
    (acc, curr) => acc + (curr.permissions?.length || 0),
    0
  );

  const kpiCards = [
    {
      label: "Personal registrado",
      value: `${totalStaff}`,
      totalSuffix: "",
      subtitle: "Equipo interno K'anPro",
      icon: UserGroupIcon,
    },
    {
      label: "Super admins",
      value: `${totalSuperAdmins}`,
      totalSuffix: "",
      subtitle: "Acceso directivo global",
      icon: SecurityCheckIcon,
    },
    {
      label: "Personal activo",
      value: `${activeStaff}`,
      totalSuffix: `/ ${totalStaff}`,
      subtitle: "Con sesión operativa",
      icon: CheckmarkBadge01Icon,
    },
    {
      label: "Permisos asignados",
      value: `${totalPermissionsAssigned}`,
      totalSuffix: "",
      subtitle: "Reglas granulares activas",
      icon: Settings01Icon,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 w-full pb-4">
      {/* Encabezado compacto */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[24px] sm:text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
            Administradores y staff
          </h1>
          <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
            Control de equipo interno, sub-roles administrativos y permisos granulares de acceso.
          </p>
        </div>

        <Link
          href="/dashboard/admin/staff/new"
          className="h-[36px] px-3 rounded-[8px] bg-primary text-primary-foreground text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <span>+ Nuevo staff</span>
        </Link>
      </div>

      {/* KPIs compactos */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="bg-card border border-border rounded-[14px] px-3.5 py-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium leading-[16px] text-muted-foreground truncate">
                {card.label}
              </span>
              <span className="size-[30px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <HugeiconsIcon
                  icon={card.icon}
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[22px] sm:text-[24px] font-bold leading-[28px] text-foreground tabular-nums">
                {card.value}
              </span>
              {card.totalSuffix && (
                <span className="text-[12px] font-medium text-muted-foreground tabular-nums">
                  {card.totalSuffix}
                </span>
              )}
            </div>
            <span className="text-[11.5px] leading-[15px] text-muted-foreground truncate">
              {card.subtitle}
            </span>
          </div>
        ))}
      </div>

      {/* Tabla compacta */}
      <StaffDataTable initialData={staffMembers} />
    </div>
  );
}
