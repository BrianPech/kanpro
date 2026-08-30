"use client";

import React from "react";
import Link from "next/link";
import {
  Inbox,
  Clock,
  Eye,
  Star,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplicationsSummary } from "../../types/dashboard";
import { cn } from "@/lib/utils";

interface ApplicationsPipelineSummaryProps {
  summary?: ApplicationsSummary;
}

export function ApplicationsPipelineSummary({
  summary = {
    total: 0,
    pending: 0,
    inReview: 0,
    shortlisted: 0,
    hired: 0,
    rejected: 0,
  },
}: ApplicationsPipelineSummaryProps) {
  const total = Math.max(1, summary.total);
  const pendingPct = Math.round((summary.pending / total) * 100);
  const inReviewPct = Math.round((summary.inReview / total) * 100);
  const shortlistedPct = Math.round((summary.shortlisted / total) * 100);
  const hiredPct = Math.round((summary.hired / total) * 100);
  const rejectedPct = Math.round((summary.rejected / total) * 100);

  const STAGES = [
    {
      label: "Nuevas / Pendientes",
      count: summary.pending,
      pct: pendingPct,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      bgLight: "bg-amber-500/10",
      icon: Clock,
    },
    {
      label: "En Revisión",
      count: summary.inReview,
      pct: inReviewPct,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgLight: "bg-blue-500/10",
      icon: Eye,
    },
    {
      label: "Preseleccionados",
      count: summary.shortlisted,
      pct: shortlistedPct,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgLight: "bg-emerald-500/10",
      icon: Star,
    },
    {
      label: "Contratados",
      count: summary.hired,
      pct: hiredPct,
      color: "bg-primary",
      textColor: "text-primary",
      bgLight: "bg-primary/10",
      icon: CheckCircle2,
    },
  ];

  return (
    <Card className="rounded-2xl border border-border/40 bg-card p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Inbox className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                Embudo de Postulaciones
              </h3>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.2 rounded-full"
              >
                {summary.total} Totales
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">
              Estado de candidatos en proceso
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/company/applications" />}
          className="rounded-xl text-[11px] font-bold h-7 px-2.5 border-border/60 hover:bg-muted/50 flex items-center gap-1"
        >
          <span>Abrir Bandeja</span>
          <ArrowRight className="size-3" />
        </Button>
      </div>

      {/* Visual Pipeline Bar */}
      {summary.total > 0 ? (
        <div className="space-y-2">
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden flex">
            {summary.pending > 0 && (
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${pendingPct}%` }}
                title={`Pendientes: ${summary.pending}`}
              />
            )}
            {summary.inReview > 0 && (
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${inReviewPct}%` }}
                title={`En Revisión: ${summary.inReview}`}
              />
            )}
            {summary.shortlisted > 0 && (
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${shortlistedPct}%` }}
                title={`Preseleccionados: ${summary.shortlisted}`}
              />
            )}
            {summary.hired > 0 && (
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${hiredPct}%` }}
                title={`Contratados: ${summary.hired}`}
              />
            )}
            {summary.rejected > 0 && (
              <div
                className="bg-muted-foreground/30 h-full transition-all duration-300"
                style={{ width: `${rejectedPct}%` }}
                title={`Descartados: ${summary.rejected}`}
              />
            )}
          </div>

          {/* Grid Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {STAGES.map((stage) => {
              const Icon = stage.icon;
              return (
                <div
                  key={stage.label}
                  className="p-2.5 rounded-xl border border-border/40 bg-background/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        "size-6 rounded-lg flex items-center justify-center shrink-0",
                        stage.bgLight,
                        stage.textColor
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-semibold truncate">
                      {stage.label}
                    </span>
                  </div>
                  <span className={cn("text-xs font-bold font-mono", stage.textColor)}>
                    {stage.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-4 px-3 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
          <p className="text-xs text-muted-foreground font-medium">
            Aún no hay postulaciones registradas en el pipeline.
          </p>
        </div>
      )}
    </Card>
  );
}
