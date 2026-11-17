"use client";

import React from "react";
import {
  Briefcase,
  Plus,
  ArrowRight,
  MapPin,
} from "@/components/ui/icons";
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
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Briefcase className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Vacantes Activas & Atracción
            </h3>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {`${totalVacancies} ofertas activas en el feed de K'anPro.`}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/company/vacancies/new" />}
        >
          <Plus data-icon="inline-start" />
          <span>Publicar</span>
        </Button>
      </div>

      {vacancies.length === 0 ? (
        <div className="p-8 text-center bg-muted/30 rounded-3xl border border-dashed border-border space-y-3">
          <p className="text-sm text-muted-foreground">
            No tienes vacantes activas en este momento.
          </p>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/company/vacancies/new" />}
          >
            Publicar primera oferta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {vacancies.map((vac) => (
            <Link
              key={vac.id}
              href={`/dashboard/company/vacancies/${vac.id}`}
              className="group block"
            >
              <div className="p-4 rounded-3xl border border-border bg-card hover:ring-1 hover:ring-primary/30 transition-all space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {vac.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-3xl bg-primary/10 text-primary border-primary/20 shrink-0"
                  >
                    {vac.applicationsCount} postulaciones
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {vac.location}
                  </span>
                  <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Ver candidatos
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {vacancies.length > 0 && (
        <div className="pt-2 border-t border-border flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/company/vacancies" />}
            className="text-primary font-semibold"
          >
            <span>Ver todas las vacantes</span>
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      )}
    </Card>
  );
}
