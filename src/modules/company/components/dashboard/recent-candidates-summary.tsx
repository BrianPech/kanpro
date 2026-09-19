"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  ArrowRight,
  Search,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RecentCandidateItem } from "../../types/dashboard";

interface RecentCandidatesSummaryProps {
  candidates?: RecentCandidateItem[];
  totalApplications?: number;
}

export function RecentCandidatesSummary({
  candidates = [],
  totalApplications = 0,
}: RecentCandidatesSummaryProps) {
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("preselecc") || s.includes("entrevista")) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
        >
          {status}
        </Badge>
      );
    }
    if (s.includes("revis") || s.includes("evaluac")) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
        >
          {status}
        </Badge>
      );
    }
    if (s.includes("contratad") || s.includes("aceptad")) {
      return (
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
        >
          {status}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
      >
        {status || "Pendiente"}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Hoy";
      if (diffDays === 1) return "Ayer";
      if (diffDays < 7) return `Hace ${diffDays} días`;

      return date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Candidatos Recientes
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {candidates.length > 0
                ? "Últimas postulaciones recibidas en tus vacantes activas."
                : "Monitoreo en vivo de aspirantes a tus puestos."}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/company/applications" />}
          className="rounded-xl text-xs font-bold h-9 px-3 border-border/60 hover:bg-muted/50 flex items-center gap-1.5"
        >
          <span>Ver todos ({totalApplications})</span>
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      {candidates.length === 0 ? (
        <div className="p-6 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Search className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">
              Aún no hay postulaciones recientes
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Publica nuevas vacantes o busca talento verificado directamente en el Radar K&apos;anPro.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1">
            <Button
              size="sm"
              render={<Link href="/dashboard/company/radar" />}
              className="rounded-xl text-xs font-bold h-8 px-3 bg-primary text-primary-foreground"
            >
              Explorar Radar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
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
                <div className="p-3.5 rounded-xl border border-border/50 bg-background hover:border-primary/40 hover:shadow-xs transition-all space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 rounded-xl shrink-0 border border-border/60">
                        <AvatarImage src={cand.candidateAvatar || undefined} />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
                          {initials || "CP"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-xs font-extrabold text-foreground truncate group-hover:text-primary transition-colors">
                          {cand.candidateName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate font-medium">
                          {cand.candidateHeadline}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-col items-end gap-1 shrink-0">
                      {getStatusBadge(cand.status)}
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="size-2.5" />
                        {formatDate(cand.appliedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1 truncate max-w-[65%]">
                      <Briefcase className="size-3 shrink-0 text-primary" />
                      <span className="truncate">{cand.vacancyTitle}</span>
                    </span>

                    <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                      Ver detalle
                      <ArrowRight className="size-3" />
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
