"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowUpRight,
} from "@/components/ui/icons";

interface SectionCardsProps {
  metrics?: {
    totalCandidates: number;
    totalCompanies: number;
    pendingVerifications: number;
    activeVacancies: number;
    totalApplications: number;
  };
}

export function SectionCards({ metrics }: SectionCardsProps) {
  const candidates = metrics?.totalCandidates ?? 0;
  const companies = metrics?.totalCompanies ?? 0;
  const verifications = metrics?.pendingVerifications ?? 0;
  const vacancies = metrics?.activeVacancies ?? 0;
  const applications = metrics?.totalApplications ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 px-4 lg:px-6">
      {/* 1. Candidatos Registrados */}
      <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Candidatos
          </span>
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="size-4" />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {candidates.toLocaleString()}
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Perfiles y talento registrado
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium text-[11px]">Sureste de México</span>
          <Link
            href="/dashboard/admin/users"
            className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
          >
            <span>Ver todos</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </Card>

      {/* 2. Empresas & Verificaciones */}
      <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Empresas
          </span>
          <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Building2 className="size-4" />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {companies.toLocaleString()}
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Cuentas corporativas
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
          {verifications > 0 ? (
            <Link
              href="/dashboard/admin/verifications"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full"
            >
              <Clock className="size-3" />
              <span>{verifications} por verificar</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3" />
              <span>Al día</span>
            </span>
          )}
          <Link
            href="/dashboard/admin/verifications"
            className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
          >
            <span>Expedientes</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </Card>

      {/* 3. Vacantes Activas */}
      <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Ofertas Activas
          </span>
          <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Briefcase className="size-4" />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {vacancies.toLocaleString()}
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Oportunidades publicadas
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium text-[11px]">En el feed público</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <TrendingUp className="size-3" />
            <span>En vivo</span>
          </span>
        </div>
      </Card>

      {/* 4. Postulaciones Totales */}
      <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-border transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Postulaciones
          </span>
          <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="size-4" />
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {applications.toLocaleString()}
          </h3>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Conexiones de empleo
          </p>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium text-[11px]">Total acumulado</span>
          <Link
            href="/dashboard/admin/reports"
            className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
          >
            <span>Métricas</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
