"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Briefcase,
  ArrowRight,
  Clock,
} from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyStatusBadge, StatusType } from "../shared/company-status-badge";
import { CompanyDashboardData } from "../../types/dashboard";

interface RecentCandidatesSummaryProps {
  candidates: CompanyDashboardData["recentCandidates"];
  totalApplications: number;
}

export function RecentCandidatesSummary({
  candidates = [],
  totalApplications,
}: RecentCandidatesSummaryProps) {
  const getStatusBadge = (status: string) => {
    const map: Record<string, { type: StatusType; label: string }> = {
      nuevo: { type: "info", label: "Nuevo" },
      en_revision: { type: "warning", label: "En Revisión" },
      preseleccionado: { type: "info", label: "Preseleccionado" },
      entrevista: { type: "info", label: "Entrevista" },
      contratado: { type: "success", label: "Contratado" },
      descartado: { type: "destructive", label: "Descartado" },
    };

    const config = map[status.toLowerCase()] || {
      type: "neutral" as StatusType,
      label: status,
    };
    return <CompanyStatusBadge status={config.type} label={config.label} />;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Candidatos Recientes
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {candidates.length > 0
                ? "Últimas postulaciones recibidas en tus vacantes activas."
                : "Monitoreo en vivo de aspirantes a tus puestos."}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/company/applications" />}
        >
          <span>Ver todos ({totalApplications})</span>
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      {candidates.length === 0 ? (
        <div className="p-8 text-center bg-muted/20 rounded-3xl border border-dashed border-border space-y-3">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Search className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              Aún no hay postulaciones recientes
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Publica nuevas vacantes o busca talento verificado directamente en el Radar K&apos;anPro.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/dashboard/company/radar" />}
            >
              Explorar Radar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((cand) => {
            const initials = cand.candidateName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <Link
                key={cand.id}
                href="/dashboard/company/applications"
                className="group block"
              >
                <div className="p-4 rounded-3xl border border-border bg-card hover:ring-1 hover:ring-primary/30 transition-all space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 rounded-2xl shrink-0 border border-border">
                        <AvatarImage src={cand.candidateAvatar || undefined} />
                        <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-xs">
                          {initials || "CP"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {cand.candidateName}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate font-medium">
                          {cand.candidateHeadline}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {getStatusBadge(cand.status)}
                      <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDate(cand.appliedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5 truncate max-w-[65%]">
                      <Briefcase className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{cand.vacancyTitle}</span>
                    </span>

                    <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                      Ver detalle
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
