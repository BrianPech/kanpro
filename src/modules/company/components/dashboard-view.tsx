"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CompanyDashboardData } from "../types/dashboard";

import { OperationalAlertsBanner } from "./dashboard/operational-alerts-banner";
import { QuickActionsCard } from "./dashboard/quick-actions-card";
import { WorkforceKPIGrid } from "./dashboard/workforce-kpi-grid";
import { ActiveVacanciesSummary } from "./dashboard/active-vacancies-summary";
import { RecentCandidatesSummary } from "./dashboard/recent-candidates-summary";
import { SubscriptionStatusCard } from "./dashboard/subscription-status-card";
import { ApplicationsPipelineSummary } from "./dashboard/applications-pipeline-summary";
import { IncidentsAttendanceCard } from "./dashboard/incidents-attendance-card";
import { ContractsExpirationCard } from "./dashboard/contracts-expiration-card";
import { PayrollSummaryCard } from "./dashboard/payroll-summary-card";

export function DashboardView({
  companyName = "Mi Empresa",
  kpis,
  alerts,
  expiringContracts,
  pendingIncidents,
  todayAttendance,
  payrollSummary,
  openVacanciesList,
  subscriptionSummary,
  applicationsSummary,
  recentCandidates,
}: CompanyDashboardData) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExecutiveReport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Reporte Ejecutivo descargado con éxito", {
        description:
          "Se ha generado el balance general de personal, postulaciones y suscripción.",
      });
    }, 1200);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8"
    >
      {/* Header Ejecutivo */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <Building2 className="size-4 text-primary" />
            <span>CENTRO DE OPERACIONES & TALENTO</span>
            <Badge className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border-none">
              En Vivo
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {`Panel General • ${companyName}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-semibold">
            Resumen integral de atracción, postulaciones, candidatos, suscripción y plantilla operativa.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExecutiveReport}
            disabled={isExporting}
            className="rounded-xl text-xs font-bold h-10 px-4 border-border/70 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>{isExporting ? "Generando..." : "Descargar Reporte"}</span>
          </Button>
        </div>
      </motion.div>

      {/* Alertas Operativas Importantes */}
      {alerts && alerts.length > 0 && (
        <motion.div variants={itemVariants}>
          <OperationalAlertsBanner alerts={alerts} />
        </motion.div>
      )}

      {/* 6. Acciones Rápidas */}
      <motion.div variants={itemVariants}>
        <QuickActionsCard />
      </motion.div>

      {/* 1. Cuadrícula de KPIs Útiles */}
      <motion.div variants={itemVariants}>
        <WorkforceKPIGrid kpis={kpis} />
      </motion.div>

      {/* Bloque Operativo Central de 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda Principal (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 2. Vacantes Activas & Atracción */}
          <motion.div variants={itemVariants}>
            <ActiveVacanciesSummary
              vacancies={openVacanciesList}
              totalVacancies={kpis.openVacanciesCount}
            />
          </motion.div>

          {/* 4. Candidatos Recientes */}
          <motion.div variants={itemVariants}>
            <RecentCandidatesSummary
              candidates={recentCandidates}
              totalApplications={kpis.totalApplicationsReceived}
            />
          </motion.div>

          {/* Asistencia e Incidencias Pendientes */}
          <motion.div variants={itemVariants}>
            <IncidentsAttendanceCard
              initialIncidents={pendingIncidents}
              attendanceList={todayAttendance}
            />
          </motion.div>
        </div>

        {/* Columna Derecha Secundaria (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 5. Estado de Suscripción */}
          <motion.div variants={itemVariants}>
            <SubscriptionStatusCard subscription={subscriptionSummary} />
          </motion.div>

          {/* 3. Resumen y Embudo de Postulaciones */}
          <motion.div variants={itemVariants}>
            <ApplicationsPipelineSummary summary={applicationsSummary} />
          </motion.div>

          {/* Resumen de Nómina */}
          <motion.div variants={itemVariants}>
            <PayrollSummaryCard payroll={payrollSummary} />
          </motion.div>

          {/* Contratos Próximos a Vencer */}
          <motion.div variants={itemVariants}>
            <ContractsExpirationCard initialContracts={expiringContracts} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
