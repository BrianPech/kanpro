"use client";

import React from "react";
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubscriptionSummary } from "../../types/dashboard";
import { CompanySettingsModal } from "../company-settings-dialog";
import { cn } from "@/lib/utils";

interface SubscriptionStatusCardProps {
  subscription?: SubscriptionSummary;
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusCardProps) {
  const plan = subscription || {
    planName: "Plan Fundador Pro",
    planKey: "pro",
    status: "active",
    periodEnd: null,
    daysRemaining: 30,
    creditsAvailable: 10,
    featuredVacanciesAllowance: 3,
    featuredVacanciesUsed: 1,
    verificationStatus: "approved",
  };

  const isActive = plan.status === "active" || plan.status === "trialing" || plan.status === "ACTIVO";
  const vacanciesPercent = Math.min(
    100,
    Math.round(
      ((plan.featuredVacanciesUsed || 0) /
        Math.max(1, plan.featuredVacanciesAllowance || 3)) *
        100
    )
  );

  return (
    <Card className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 space-y-4 shadow-xs relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5 dark:opacity-10">
        <CreditCard className="size-32 -mr-8 -mt-8 text-primary" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                Estado de Suscripción
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-extrabold px-2 py-0.2 rounded-full border-none",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                )}
              >
                {isActive ? "Activo" : "Por Renovar"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              {plan.planName}
            </p>
          </div>
        </div>

        {plan.verificationStatus === "approved" && (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
          >
            <ShieldCheck className="size-3" />
            <span className="hidden sm:inline">Verificada SAT</span>
          </Badge>
        )}
      </div>

      {/* Quotas & Resource Metrics */}
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        {/* Metric 1: Vacantes Destacadas */}
        <div className="p-3 rounded-xl bg-background/80 border border-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span>Destacadas K&apos;anPro</span>
            <span className="text-foreground">
              {plan.featuredVacanciesUsed}/{plan.featuredVacanciesAllowance}
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${vacanciesPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {plan.featuredVacanciesAllowance - plan.featuredVacanciesUsed} vacantes disponibles
          </p>
        </div>

        {/* Metric 2: Créditos de Contacto Directo */}
        <div className="p-3 rounded-xl bg-background/80 border border-border/50 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span>Créditos Radar</span>
            <span className="text-primary font-mono font-extrabold">
              {plan.creditsAvailable}
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (plan.creditsAvailable / 20) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Contacto inmediato
          </p>
        </div>
      </div>

      {/* Footer Info & Modal CTA */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 relative z-10 flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
          <Clock className="size-3 text-muted-foreground" />
          <span>
            {plan.daysRemaining !== null
              ? `Vigencia: ${plan.daysRemaining} días restantes`
              : "Renovación mensual automática"}
          </span>
        </div>

        <CompanySettingsModal
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-[11px] font-bold h-7 px-2.5 border-border/60 bg-background/60 hover:bg-background flex items-center gap-1 text-primary cursor-pointer shadow-none"
            >
              <SlidersHorizontal className="size-3" />
              <span>Gestionar Plan</span>
            </Button>
          }
        />
      </div>
    </Card>
  );
}
