"use client";

import React from "react";
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  Clock,
  SlidersHorizontal,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubscriptionSummary } from "../../types/dashboard";
import { CompanySettingsModal } from "../company-settings-dialog";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";

interface SubscriptionStatusCardProps {
  subscription?: SubscriptionSummary;
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusCardProps) {
  const fallbackPlan = SUBSCRIPTION_PLANS.basic;
  const plan = subscription || {
    planName: fallbackPlan.name,
    planKey: fallbackPlan.id,
    status: "active",
    periodEnd: null,
    daysRemaining: null,
    creditsAvailable: fallbackPlan.creditsAllowance,
    featuredVacanciesAllowance: fallbackPlan.featuredVacanciesAllowance,
    featuredVacanciesUsed: 0,
    verificationStatus: null,
  };

  const vacanciesPercent = Math.min(
    100,
    Math.round(
      ((plan.featuredVacanciesUsed || 0) /
        Math.max(1, plan.featuredVacanciesAllowance || 3)) *
        100
    )
  );

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6 space-y-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-5 dark:opacity-10">
        <CreditCard className="size-32 -mr-8 -mt-8 text-primary" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border relative z-10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground">
                Estado de Suscripción
              </h3>
              <Badge
                variant="outline"
                className="text-xs font-semibold px-2.5 py-0.5 rounded-3xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 gap-1.5"
              >
                <Sparkles className="size-3 text-amber-500" />
                Acceso Anticipado • Periodo de Pruebas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {plan.planName} • Fase Beta Gratuita
            </p>
          </div>
        </div>

        {plan.verificationStatus === "approved" && (
          <Badge
            variant="outline"
            className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-3xl flex items-center gap-1.5 shrink-0"
          >
            <ShieldCheck className="size-3.5" />
            <span className="hidden sm:inline">Verificada SAT</span>
          </Badge>
        )}
      </div>

      {/* Quotas & Resource Metrics */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        {/* Metric 1: Vacantes Destacadas */}
        <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Destacadas K&apos;anPro</span>
            <span className="text-foreground font-bold">
              {plan.featuredVacanciesUsed}/{plan.featuredVacanciesAllowance}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${vacanciesPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            {plan.featuredVacanciesAllowance - plan.featuredVacanciesUsed} vacantes disponibles
          </p>
        </div>

        {/* Metric 2: Créditos de Contacto Directo */}
        <div className="p-4 rounded-3xl bg-card border border-border space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Créditos Radar</span>
            <span className="text-primary font-mono font-bold">
              {plan.creditsAvailable}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (plan.creditsAvailable / 20) * 100)}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Contacto directo inmediato
          </p>
        </div>
      </div>

      {/* Footer Info & Modal CTA */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-3 relative z-10 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Clock className="size-3.5 text-muted-foreground" />
          <span>Periodo de pruebas gratuito activo sin cargos</span>
        </div>

        <CompanySettingsModal
          trigger={
            <Button
              variant="outline"
              size="sm"
            >
              <SlidersHorizontal data-icon="inline-start" />
              <span>Gestionar Plan</span>
            </Button>
          }
        />
      </div>
    </Card>
  );
}
