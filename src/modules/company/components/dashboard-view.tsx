"use client";

import React, { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Briefcase01Icon,
  Calendar03Icon,
  InboxIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import type { CompanyDashboardData } from "../types/dashboard";
import { CompanyDashboardTour } from "./dashboard/company-dashboard-tour";

const QUICK_ACTIONS = [
  { label: "Registrar empleado", href: "/dashboard/company/employees?action=new" },
  { label: "Ver asistencia", href: "/dashboard/company/attendance" },
  { label: "Generar contrato", href: "/dashboard/company/contracts" },
  { label: "Preparar nómina", href: "/dashboard/company/payroll" },
  { label: "Matriz 9-Box", href: "/dashboard/company/evaluations" },
] as const;

const PAYROLL_STATUS_LABELS: Record<CompanyDashboardData["payrollSummary"]["status"], string> = {
  preparacion: "En preparación",
  calculada: "Calculada",
  pagada: "Pagada",
};

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function formatRelativeDay(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / 86_400_000);

  if (diffDays <= 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return formatShortDate(value);
}

function buildAttentionMessage(data: CompanyDashboardData): string {
  const { expiringContractsCount, pendingIncidentsCount } = data.kpis;
  const parts: string[] = [];

  if (expiringContractsCount > 0) {
    parts.push(
      `${expiringContractsCount} ${expiringContractsCount === 1 ? "contrato próximo" : "contratos próximos"} a vencer`,
    );
  }
  if (pendingIncidentsCount > 0) {
    parts.push(
      `${pendingIncidentsCount} ${pendingIncidentsCount === 1 ? "incidencia" : "incidencias"} por revisar`,
    );
  }

  if (parts.length > 0) {
    return `${parts.join(" y ")}.`;
  }

  return data.alerts[0]?.description || data.alerts[0]?.title || "Revisa los elementos operativos pendientes.";
}

function SectionCardHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[18px] font-semibold leading-[24px] text-foreground">{title}</h2>
      <Link
        href={href}
        className="text-[13px] font-medium text-link hover:underline shrink-0"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

export function DashboardView(props: CompanyDashboardData) {
  const {
    companyName = "Mi Empresa",
    kpis,
    alerts = [],
    openVacanciesList = [],
    applicationsSummary,
    recentCandidates = [],
    expiringContracts = [],
    todayAttendance = [],
    payrollSummary,
    subscriptionSummary,
  } = props;

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isTourManual, setIsTourManual] = useState(false);

  const todayAttendanceCount = todayAttendance.filter(
    (item) => item.status === "presente" || item.status === "retardo" || Boolean(item.checkInTime),
  ).length;

  const showAttentionBanner =
    kpis.expiringContractsCount > 0 || kpis.pendingIncidentsCount > 0 || alerts.length > 0;

  const stageItems = [
    { label: "Nuevas", count: applicationsSummary?.pending ?? 0 },
    { label: "En revisión", count: applicationsSummary?.inReview ?? 0 },
    { label: "Entrevista", count: applicationsSummary?.shortlisted ?? 0 },
    { label: "Contratadas", count: applicationsSummary?.hired ?? 0 },
  ];
  const maxStageCount = Math.max(1, ...stageItems.map((item) => item.count));

  const subStatus = subscriptionSummary?.status ?? "free";
  const isActiveSubscription = subStatus === "active" || subStatus === "trialing";
  const subscriptionStatusLabel =
    subStatus === "active"
      ? "Activa"
      : subStatus === "trialing"
        ? "Periodo de prueba"
        : subStatus === "past_due"
          ? "Pago pendiente"
          : "Plan gratuito";

  const kpiCards = [
    {
      label: "Plantilla activa",
      value: kpis.activeEmployees,
      subtitle: "Personas activas",
      icon: UserGroupIcon,
      href: "/dashboard/company/employees",
    },
    {
      label: "Asistencia de hoy",
      value: todayAttendanceCount,
      subtitle: `De ${kpis.activeEmployees} personas`,
      icon: Calendar03Icon,
      href: "/dashboard/company/attendance",
    },
    {
      label: "Vacantes abiertas",
      value: kpis.openVacanciesCount,
      subtitle: "En reclutamiento",
      icon: Briefcase01Icon,
      href: "/dashboard/company/vacancies",
    },
    {
      label: "Postulaciones",
      value: kpis.totalApplicationsReceived,
      subtitle: "Recibidas en total",
      icon: InboxIcon,
      href: "/dashboard/company/applications",
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Título y acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] sm:text-[36px] font-bold leading-[1.2] sm:leading-[50px] tracking-tight text-foreground">
            Panel de {companyName}
          </h1>
          <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
            Resumen de personal y operación · {formatLongDate(new Date())}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsTourManual(true);
              setIsTourOpen(true);
            }}
            className="h-[44px] px-3 rounded-[8px] bg-card border border-control-border text-[14px] font-semibold text-foreground inline-flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
          >
            Guía del panel
          </button>
          <Link
            href="/dashboard/company/vacancies/new"
            className="h-[44px] px-3 rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            + Nueva vacante
          </Link>
        </div>
      </div>

      {/* Pendientes de atención */}
      {showAttentionBanner && (
        <div className="bg-warning rounded-[12px] p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="size-8 shrink-0 flex items-center justify-center text-warning-foreground">
              <HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={1.8} />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[15px] font-semibold leading-[20px] text-warning-foreground">
                Pendientes de atención
              </p>
              <p className="text-[13px] leading-[18px] text-warning-foreground/90">
                {buildAttentionMessage(props)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Link
              href="/dashboard/company/contracts"
              className="h-[44px] px-3 rounded-[8px] bg-card border border-control-border text-[14px] font-semibold text-foreground inline-flex items-center justify-center hover:bg-accent transition-colors"
            >
              Ver contratos
            </Link>
            <Link
              href="/dashboard/company/incidents"
              className="h-[44px] px-3 rounded-[8px] bg-card border border-control-border text-[14px] font-semibold text-foreground inline-flex items-center justify-center hover:bg-accent transition-colors"
            >
              Ver incidencias
            </Link>
          </div>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-2 hover:border-control-border transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] font-medium leading-[18px] text-muted-foreground">
                {card.label}
              </span>
              <span className="size-[34px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={card.icon} size={18} strokeWidth={1.8} />
              </span>
            </div>
            <span className="text-[28px] font-bold leading-[34px] text-foreground tabular-nums">
              {card.value}
            </span>
            <span className="text-[12px] leading-[16px] text-muted-foreground">
              {card.subtitle}
            </span>
          </Link>
        ))}
      </div>

      {/* Operación y talento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Columna izquierda */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Contratos por vencer */}
          <section className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-3">
            <SectionCardHeader
              title="Contratos por vencer"
              href="/dashboard/company/contracts"
              linkLabel="Ver contratos"
            />
            {expiringContracts.length > 0 ? (
              <div className="flex flex-col">
                {expiringContracts.slice(0, 3).map((contract, index) => (
                  <React.Fragment key={contract.id}>
                    {index > 0 && <div className="h-px bg-border" />}
                    <div className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[14px] font-medium text-foreground truncate">
                          {contract.employeeName}
                        </span>
                        <span className="text-[12px] text-muted-foreground truncate">
                          {contract.jobTitle || contract.department} · {formatShortDate(contract.endDate)}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-warning-foreground shrink-0">
                        {contract.daysRemaining <= 0
                          ? "Vence hoy"
                          : `En ${contract.daysRemaining} ${contract.daysRemaining === 1 ? "día" : "días"}`}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-1">
                No hay contratos próximos a vencer.
              </p>
            )}
          </section>

          {/* Asistencia e incidencias */}
          <section className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-3">
            <SectionCardHeader
              title="Asistencia e incidencias"
              href="/dashboard/company/attendance"
              linkLabel="Ver asistencia"
            />
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-3 py-3 pt-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-foreground">
                    Marcajes registrados
                  </span>
                  <span className="text-[12px] text-muted-foreground">Asistencia de hoy</span>
                </div>
                <span className="text-[15px] font-bold text-foreground tabular-nums">
                  {todayAttendanceCount}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between gap-3 py-3 pb-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-medium text-foreground">
                    Incidencias por revisar
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    Solicitudes en seguimiento
                  </span>
                </div>
                <span className="text-[15px] font-bold text-warning-foreground tabular-nums">
                  {kpis.pendingIncidentsCount}
                </span>
              </div>
            </div>
          </section>

          {/* Nómina */}
          <section className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-3">
            <SectionCardHeader
              title="Nómina"
              href="/dashboard/company/payroll"
              linkLabel="Ver nómina"
            />
            <div className="flex items-center justify-between gap-3 py-1">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[14px] font-medium text-foreground truncate">
                  {payrollSummary.periodName || "Periodo actual"}
                </span>
                <span className="text-[12px] text-muted-foreground truncate">
                  {payrollSummary.periodDates ||
                    (payrollSummary.cutoffDate
                      ? `Corte: ${formatShortDate(payrollSummary.cutoffDate)}`
                      : "Sin periodo configurado")}
                </span>
              </div>
              <span className="text-[13px] font-semibold text-link shrink-0">
                {PAYROLL_STATUS_LABELS[payrollSummary.status]}
              </span>
            </div>
          </section>
        </div>

        {/* Columna derecha */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Postulaciones por etapa */}
          <section className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-3">
            <SectionCardHeader
              title="Postulaciones por etapa"
              href="/dashboard/company/applications"
              linkLabel="Ver bandeja"
            />
            <div className="flex flex-col gap-3">
              {stageItems.map((stage) => {
                const widthPercent =
                  stage.count > 0 ? Math.max(6, Math.round((stage.count / maxStageCount) * 100)) : 0;
                return (
                  <div key={stage.label} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-foreground">{stage.label}</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {stage.count}
                      </span>
                    </div>
                    <div className="h-[6px] w-full rounded-[8px] bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-[8px] bg-[#009689] dark:bg-[#00bba7] transition-all"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Vacantes activas */}
          <section className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-3">
            <SectionCardHeader
              title="Vacantes activas"
              href="/dashboard/company/vacancies"
              linkLabel="Ver vacantes"
            />
            {openVacanciesList.length > 0 ? (
              <div className="flex flex-col">
                {openVacanciesList.slice(0, 3).map((vacancy, index) => (
                  <React.Fragment key={vacancy.id}>
                    {index > 0 && <div className="h-px bg-border" />}
                    <div className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[14px] font-medium text-foreground truncate">
                          {vacancy.title}
                        </span>
                        <span className="text-[12px] text-muted-foreground truncate">
                          {vacancy.location || "Remoto"} · {vacancy.category || "General"}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-foreground shrink-0 tabular-nums">
                        {vacancy.applicationsCount}{" "}
                        {vacancy.applicationsCount === 1 ? "perfil" : "perfiles"}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-1">
                No hay vacantes abiertas actualmente.
              </p>
            )}
          </section>

          {/* Candidaturas recientes */}
          <section className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-3">
            <SectionCardHeader
              title="Candidaturas recientes"
              href="/dashboard/company/applications"
              linkLabel="Ver todas"
            />
            {recentCandidates.length > 0 ? (
              <div className="flex flex-col">
                {recentCandidates.slice(0, 3).map((candidate, index) => (
                  <React.Fragment key={candidate.id}>
                    {index > 0 && <div className="h-px bg-border" />}
                    <div className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[14px] font-medium text-foreground truncate">
                          {candidate.candidateName}
                        </span>
                        <span className="text-[12px] text-muted-foreground truncate">
                          {candidate.vacancyTitle}
                        </span>
                      </div>
                      <span className="text-[12px] text-muted-foreground shrink-0">
                        {formatRelativeDay(candidate.appliedAt)}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-1">
                Aún no hay postulaciones recientes.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Acciones rápidas */}
      <section className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[24px] text-foreground">
          Acciones rápidas
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="h-[40px] px-3.5 rounded-[8px] bg-card border border-control-border text-[13px] font-semibold text-foreground inline-flex items-center justify-center hover:bg-accent transition-colors"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Suscripción */}
      <div className="bg-muted rounded-[8px] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-semibold text-foreground">
            Suscripción empresarial
          </span>
          <span
            className={`text-[13px] font-semibold ${
              isActiveSubscription ? "text-success-foreground" : "text-warning-foreground"
            }`}
          >
            {subscriptionStatusLabel}
          </span>
        </div>
        {subscriptionSummary?.planName && (
          <span className="text-[12px] text-muted-foreground">
            {subscriptionSummary.planName}
          </span>
        )}
      </div>

      <CompanyDashboardTour
        open={isTourOpen}
        setOpen={(open: boolean) => {
          setIsTourOpen(open);
          if (!open) setIsTourManual(false);
        }}
        ignoreDismissal={isTourManual}
      />
    </div>
  );
}
