"use client";

import React from "react";
import {
  Briefcase,
  Plus,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CompanyDashboardData } from "../../types/dashboard";

interface ActiveVacanciesSummaryProps {
  vacancies: CompanyDashboardData["openVacanciesList"];
  totalVacancies: number;
}

export function ActiveVacanciesSummary({
  vacancies,
  totalVacancies,
}: ActiveVacanciesSummaryProps) {
  return (
    <Card className="rounded-2xl border border-border/40 bg-card p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Briefcase className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              Vacantes Activas & Atracción
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              {`${totalVacancies} ofertas activas en el feed de K'anPro.`}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          render={<Link href="/dashboard/company/vacancies/new" />}
          className="rounded-xl text-xs font-bold h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
        >
          <Plus className="size-3.5" />
          <span>Publicar</span>
        </Button>
      </div>

      {vacancies.length === 0 ? (
        <div className="p-6 text-center bg-muted/20 rounded-xl border border-dashed border-border/60 space-y-3">
          <p className="text-xs text-muted-foreground">
            No tienes vacantes activas en este momento.
          </p>
          <Button
            size="sm"
            render={<Link href="/dashboard/company/vacancies/new" />}
            className="rounded-xl text-xs font-bold h-8 px-4 bg-primary text-primary-foreground"
          >
            Publicar primera oferta
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {vacancies.map((vac) => (
            <Link
              key={vac.id}
              href={`/dashboard/company/vacancies/${vac.id}`}
              className="group block"
            >
              <div className="p-3.5 rounded-xl border border-border/50 bg-background hover:border-primary/40 hover:shadow-xs transition-all space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-foreground truncate group-hover:text-primary transition-colors">
                    {vac.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border-transparent shrink-0"
                  >
                    {vac.applicationsCount} postulaciones
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {vac.location}
                  </span>
                  <span className="text-primary font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Ver candidatos
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/dashboard/company/vacancies" />}
          className="w-full rounded-xl text-xs font-bold h-9 border-border/60"
        >
          Ver todas las vacantes publicadas
        </Button>
      </div>
    </Card>
  );
}
