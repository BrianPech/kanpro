import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Building03Icon,
  SecurityCheckIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  UsersDataTable,
  type AccountSegment,
  type UserItem,
} from "@/modules/admin/components/users-data-table";
import { SUB_ROLE_LABELS, type AdminSubRole } from "@/modules/admin/types/staff";
import type { Database } from "@/types/supabase";

type UserRole = Database["public"]["Enums"]["user_role"];

export const metadata = {
  title: "Directorio de Usuarios | K'anPro Admin",
  description:
    "Gestión segmentada de dueños de empresa, candidatos, empleados activos y administradores.",
};

function normalizeStatus(raw?: string | null): "Activo" | "Suspendido" | "Inactivo" {
  const value = (raw || "active").toLowerCase().trim();
  if (value === "suspended" || value === "suspendido") return "Suspendido";
  if (value === "inactive" || value === "inactivo") return "Inactivo";
  return "Activo";
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const adminClient = createAdminClient();

  const [profilesRes, companiesRes, employeesRes, staffRes] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, full_name, email, role, status, is_verified, avatar_url, created_at")
      .order("created_at", { ascending: false }),
    adminClient
      .from("company_profiles")
      .select("id, owner_id, company_name, verification_status, subscription_plan"),
    adminClient
      .from("company_employees")
      .select("employee_id, company_id, job_title, status")
      .eq("status", "active"),
    adminClient
      .from("admin_staff_members")
      .select("profile_id, sub_role, department"),
  ]);

  const companyById = new Map<
    string,
    { id: string; companyName: string; plan: string; verified: boolean }
  >();
  const companyByOwnerId = new Map<
    string,
    { id: string; companyName: string; plan: string; verified: boolean }
  >();

  for (const c of companiesRes.data || []) {
    const info = {
      id: c.id,
      companyName: c.company_name || "Empresa sin nombre",
      plan: c.subscription_plan || "Plan gratuito",
      verified: c.verification_status === "approved",
    };
    companyById.set(c.id, info);
    if (c.owner_id) {
      companyByOwnerId.set(c.owner_id, info);
    }
  }

  const activeEmploymentByUserId = new Map<
    string,
    { companyName: string; jobTitle: string }
  >();
  for (const emp of employeesRes.data || []) {
    if (!emp.employee_id || activeEmploymentByUserId.has(emp.employee_id)) continue;
    const employer = emp.company_id ? companyById.get(emp.company_id) : undefined;
    activeEmploymentByUserId.set(emp.employee_id, {
      companyName: employer?.companyName || "Empresa registrada",
      jobTitle: emp.job_title || "Colaborador activo",
    });
  }

  const staffByProfileId = new Map<
    string,
    { subRoleLabel: string; department: string }
  >();
  for (const s of staffRes.data || []) {
    const subRoleKey = s.sub_role as AdminSubRole;
    const subRoleLabel =
      SUB_ROLE_LABELS[subRoleKey]?.label || "Administrador";
    staffByProfileId.set(s.profile_id, {
      subRoleLabel,
      department: s.department || "Plataforma",
    });
  }

  const users: UserItem[] = (profilesRes.data || []).map((p) => {
    const role: UserRole = p.role;
    const ownedCompany =
      role === "company"
        ? companyById.get(p.id) || companyByOwnerId.get(p.id)
        : undefined;
    const employment =
      role === "candidate" ? activeEmploymentByUserId.get(p.id) : undefined;
    const staffInfo = role === "admin" ? staffByProfileId.get(p.id) : undefined;

    let segment: AccountSegment = "candidate";
    let contextTitle = "Bolsa de empleo";
    let contextSubtitle = p.is_verified ? "Identidad verificada" : "Sin verificar";
    let companyId: string | undefined;

    if (role === "admin") {
      segment = "admin";
      contextTitle = staffInfo?.subRoleLabel || "Administrador";
      contextSubtitle = staffInfo?.department || "Equipo interno K'anPro";
    } else if (role === "company") {
      segment = "owner";
      contextTitle = ownedCompany?.companyName || "Cuenta sin perfil de empresa";
      contextSubtitle = ownedCompany?.plan || "Sin configurar";
      companyId = ownedCompany?.id || p.id;
    } else if (employment) {
      segment = "employee";
      contextTitle = employment.companyName;
      contextSubtitle = employment.jobTitle;
    }

    const isVerified =
      role === "company"
        ? Boolean(ownedCompany?.verified || p.is_verified)
        : Boolean(p.is_verified);

    return {
      id: p.id,
      name: p.full_name || "Usuario K'anPro",
      email: p.email || "Sin correo",
      role,
      segment,
      status: normalizeStatus(p.status),
      isVerified,
      contextTitle,
      contextSubtitle,
      companyId,
      avatar: p.avatar_url || "",
      createdAt: p.created_at
        ? new Date(p.created_at).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Reciente",
    };
  });

  const ownersCount = users.filter((u) => u.segment === "owner").length;
  const verifiedOwnersCount = users.filter(
    (u) => u.segment === "owner" && u.isVerified
  ).length;
  const candidatesCount = users.filter((u) => u.segment === "candidate").length;
  const employeesCount = users.filter((u) => u.segment === "employee").length;
  const adminsCount = users.filter((u) => u.segment === "admin").length;

  const kpiCards = [
    {
      label: "Dueños de empresa",
      value: ownersCount,
      subtitle: `${verifiedOwnersCount} con sello verificado`,
      icon: Building03Icon,
      href: "/dashboard/admin/verifications",
    },
    {
      label: "Candidatos",
      value: candidatesCount,
      subtitle: "Buscadores en bolsa de empleo",
      icon: UserGroupIcon,
      href: null,
    },
    {
      label: "Empleados activos",
      value: employeesCount,
      subtitle: "Vinculados a una empresa",
      icon: Briefcase01Icon,
      href: null,
    },
    {
      label: "Staff administrador",
      value: adminsCount,
      subtitle: "Equipo interno de plataforma",
      icon: SecurityCheckIcon,
      href: "/dashboard/admin/staff",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 w-full pb-4">
      {/* Encabezado compacto */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[24px] sm:text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
            Directorio de usuarios
          </h1>
          <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
            Segmentación por tipo de cuenta: dueños de negocio, candidatos, empleados activos y equipo administrativo.
          </p>
        </div>

        <Link
          href="/dashboard/admin/staff"
          className="h-[36px] px-3 rounded-[8px] bg-card border border-control-border text-[13px] font-semibold text-foreground inline-flex items-center justify-center gap-1.5 hover:bg-accent transition-colors self-start sm:self-auto"
        >
          <span>Gestionar staff admin</span>
          <span>→</span>
        </Link>
      </div>

      {/* KPIs compactos */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map((card) => {
          const content = (
            <>
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
              <span className="text-[22px] sm:text-[24px] font-bold leading-[28px] text-foreground tabular-nums">
                {card.value.toLocaleString("es-MX")}
              </span>
              <span className="text-[11.5px] leading-[15px] text-muted-foreground truncate">
                {card.subtitle}
              </span>
            </>
          );

          return card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className="bg-card border border-border rounded-[14px] px-3.5 py-3 flex flex-col gap-1.5 hover:border-control-border transition-colors"
            >
              {content}
            </Link>
          ) : (
            <div
              key={card.label}
              className="bg-card border border-border rounded-[14px] px-3.5 py-3 flex flex-col gap-1.5"
            >
              {content}
            </div>
          );
        })}
      </div>

      {/* Tabla segmentada compacta */}
      <UsersDataTable data={users} />
    </div>
  );
}
