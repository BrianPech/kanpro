import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  CheckmarkBadge01Icon,
  CustomerService01Icon,
  SecurityCheckIcon,
  Settings01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { ChartAreaInteractive } from "@/modules/admin/components/chart-area-interactive";
import { DataTable } from "@/modules/admin/components/data-table";
import { SectionCards } from "@/modules/admin/components/section-cards";
import { getAdminDashboardMetrics } from "@/modules/admin/services/admin-analytics";

export const metadata = {
  title: "Panel Central de Administración | K'anPro",
  description: "Monitoreo y gestión de la plataforma K'anPro en el sureste de México.",
};

const QUICK_ACTIONS = [
  {
    label: "Expedientes",
    href: "/dashboard/admin/verifications",
    icon: CheckmarkBadge01Icon,
  },
  {
    label: "Moderación",
    href: "/dashboard/admin/reports",
    icon: Alert02Icon,
  },
  {
    label: "Soporte",
    href: "/dashboard/admin/support",
    icon: CustomerService01Icon,
  },
  {
    label: "Usuarios",
    href: "/dashboard/admin/users",
    icon: UserGroupIcon,
  },
  {
    label: "Staff",
    href: "/dashboard/admin/staff",
    icon: SecurityCheckIcon,
  },
  {
    label: "Fases DEMO",
    href: "/dashboard/admin/settings",
    icon: Settings01Icon,
  },
] as const;

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboardMetrics();

  const attentionRows = [
    {
      label: "Verificaciones pendientes",
      subtitle: "Expedientes fiscales por dictaminar",
      count: metrics.pendingVerifications,
      href: "/dashboard/admin/verifications",
    },
    {
      label: "Reportes por moderar",
      subtitle: "Alertas de vacantes o cuentas",
      count: metrics.pendingReports,
      href: "/dashboard/admin/reports",
    },
    {
      label: "Tickets abiertos",
      subtitle: "Solicitudes de soporte activas",
      count: metrics.openTickets,
      href: "/dashboard/admin/support",
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 w-full pb-4">
      {/* Encabezado compacto */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[24px] sm:text-[28px] font-bold leading-[1.2] tracking-tight text-foreground">
            Panel de Administración
          </h1>
          <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
            Monitoreo y operación de K&apos;anPro · {formatLongDate(new Date())}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/admin/settings"
            className="h-[36px] px-3 rounded-[8px] bg-card border border-control-border text-[13px] font-semibold text-foreground inline-flex items-center justify-center hover:bg-accent transition-colors"
          >
            Configuración
          </Link>
          <Link
            href="/dashboard/admin/verifications"
            className="h-[36px] px-3 rounded-[8px] bg-primary text-primary-foreground text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <span>Revisar expedientes</span>
            {metrics.pendingVerifications > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-[11px] font-bold tabular-nums leading-none">
                {metrics.pendingVerifications}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* KPIs principales */}
      <SectionCards metrics={metrics} />

      {/* Gráfica + Atención requerida y accesos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        <div className="lg:col-span-8">
          <ChartAreaInteractive data={metrics.timeSeriesData} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-3.5">
          {/* Atención requerida */}
          <section className="bg-card border border-border rounded-[14px] p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold leading-[20px] text-foreground">
                Atención requerida
              </h2>
              <Link
                href="/dashboard/admin/support"
                className="text-[12px] font-medium text-link hover:underline shrink-0"
              >
                Soporte →
              </Link>
            </div>

            <div className="flex flex-col">
              {attentionRows.map((row, index) => (
                <div key={row.label}>
                  {index > 0 && <div className="h-px bg-border" />}
                  <Link
                    href={row.href}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-1 last:pb-0.5 group"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] font-medium text-foreground group-hover:text-link transition-colors truncate">
                        {row.label}
                      </span>
                      <span className="text-[11.5px] text-muted-foreground truncate">
                        {row.subtitle}
                      </span>
                    </div>
                    <span
                      className={`text-[14px] font-bold tabular-nums shrink-0 ${
                        row.count > 0 ? "text-warning-foreground" : "text-foreground"
                      }`}
                    >
                      {row.count}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Accesos rápidos */}
          <section className="bg-card border border-border rounded-[14px] p-3.5 flex flex-col gap-2.5">
            <h2 className="text-[15px] font-semibold leading-[20px] text-foreground">
              Accesos rápidos
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="h-[34px] px-2.5 rounded-[8px] bg-card border border-control-border text-[12.5px] font-semibold text-foreground inline-flex items-center gap-1.5 hover:bg-accent transition-colors min-w-0"
                >
                  <HugeiconsIcon
                    icon={action.icon}
                    size={15}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="truncate">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bandeja compacta de actividad reciente */}
      <DataTable data={metrics.operationsFeed} />
    </div>
  );
}
