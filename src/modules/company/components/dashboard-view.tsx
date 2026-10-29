"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { CompanyPageHeader } from "./shared/company-page-header";
import { OperationalAlertsBanner } from "./dashboard/operational-alerts-banner";
import { WorkforceKPIGrid } from "./dashboard/workforce-kpi-grid";
import { QuickActionsCard } from "./dashboard/quick-actions-card";
import { ActiveVacanciesSummary } from "./dashboard/active-vacancies-summary";
import { ApplicationsPipelineSummary } from "./dashboard/applications-pipeline-summary";
import { RecentCandidatesSummary } from "./dashboard/recent-candidates-summary";
import { ContractsExpirationCard } from "./dashboard/contracts-expiration-card";
import { IncidentsAttendanceCard } from "./dashboard/incidents-attendance-card";
import { PayrollSummaryCard } from "./dashboard/payroll-summary-card";
import { SubscriptionStatusCard } from "./dashboard/subscription-status-card";
import type { CompanyDashboardData } from "../types/dashboard";

export function DashboardView({
  companyName = "Mi Empresa",
  kpis,
  alerts = [],
  openVacanciesList = [],
  applicationsSummary,
  recentCandidates = [],
  payrollSummary,
  subscriptionSummary,
}: CompanyDashboardData) {
  return (
    <div className="w-full space-y-6 sm:space-y-8 font-sans">
      {/* 1. Header unificado con tokens del tema */}
      <CompanyPageHeader
        title={`Panel de ${companyName}`}
        description="Resumen operativo en tiempo real de plantilla, talento, contratos e incidencias."
      >
        <Button
          render={<Link href="/dashboard/company/vacancies/new" />}
          className="gap-2 cursor-pointer font-medium"
        >
          <Plus data-icon="inline-start" />
          <span>Nueva Vacante</span>
        </Button>
      </CompanyPageHeader>

      {/* 2. Alertas Operativas Críticas */}
      {alerts && alerts.length > 0 && (
        <OperationalAlertsBanner alerts={alerts} />
      )}

      {/* 3. Grid de KPIs principales */}
      {kpis && <WorkforceKPIGrid kpis={kpis} />}

      {/* 4. Acciones Rápidas */}
      <QuickActionsCard />

      {/* 5. Pipeline y Vacantes Activas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveVacanciesSummary
          vacancies={openVacanciesList}
          totalVacancies={kpis?.openVacanciesCount || openVacanciesList.length}
        />
        <ApplicationsPipelineSummary summary={applicationsSummary} />
      </div>

      {/* 6. Candidatos Recientes & Vencimientos de Contratos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentCandidatesSummary
          candidates={recentCandidates}
          totalApplications={applicationsSummary?.total || kpis?.totalApplicationsReceived || 0}
        />
        <ContractsExpirationCard />
      </div>

      {/* 7. Asistencia & Nómina */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncidentsAttendanceCard />
        <PayrollSummaryCard payroll={payrollSummary} />
      </div>

      {/* 8. Estado de Suscripción */}
      {subscriptionSummary && (
        <SubscriptionStatusCard subscription={subscriptionSummary} />
      )}
    </div>
  );
}
