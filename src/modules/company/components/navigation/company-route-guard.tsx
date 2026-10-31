"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, ArrowLeft, Briefcase, Sparkles } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  isCompanyRouteAllowed,
  resolveModuleFromPath,
} from "@/modules/company/config/demo-rollout";

interface CompanyRouteGuardProps {
  enabledModules?: string[];
  children: React.ReactNode;
}

export function CompanyRouteGuard({
  enabledModules,
  children,
}: CompanyRouteGuardProps) {
  const pathname = usePathname();
  const isAllowed = isCompanyRouteAllowed(pathname, enabledModules);

  if (isAllowed) {
    return <>{children}</>;
  }

  const lockedModule = resolveModuleFromPath(pathname);
  const weekLabel = lockedModule ? `Semana ${lockedModule.week}` : "Próxima Fase";

  return (
    <div className="flex flex-1 items-center justify-center p-6 min-h-[65vh]">
      <div className="max-w-md w-full rounded-3xl border border-border/60 bg-card p-8 text-center shadow-lg space-y-5">
        <div className="mx-auto size-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Lock className="size-6" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[11px] px-2.5 py-0.5"
            >
              <Sparkles className="size-3 mr-1" />
               Liberación Programada • {weekLabel}
            </Badge>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {lockedModule?.label || "Módulo en Despliegue Progresivo"}
          </h2>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Durante el programa piloto DEMO de K&apos;anPro estamos habilitando
            nuevas herramientas cada semana para acompañarte paso a paso. Este
            módulo se activará automáticamente en la{" "}
            <span className="font-semibold text-foreground">{weekLabel}</span>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/company" />}
            className="w-full sm:w-auto rounded-xl font-semibold text-xs gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Ir al Inicio</span>
          </Button>
          <Button
            size="sm"
            render={<Link href="/dashboard/company/vacancies" />}
            className="w-full sm:w-auto rounded-xl font-semibold text-xs gap-1.5 cursor-pointer"
          >
            <Briefcase className="size-3.5" />
            <span>Ir a Mis Vacantes</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
