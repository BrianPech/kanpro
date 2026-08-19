"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Bookmark, 
  RotateCw, 
  CheckCircle2, 
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { CandidateDashboardData } from "@/modules/candidate/services/candidate-dashboard";

export interface CandidateDashboardViewProps {
  initialData: CandidateDashboardData;
}

export function CandidateDashboardView({
  initialData,
}: CandidateDashboardViewProps) {
  const supabase = createClient();
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const featuredVacancies = initialData?.featuredVacancies || [];
  const nearbyVacancies = initialData?.nearbyVacancies || [];

  // Load saved vacancies for the authenticated candidate on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSavedVacancies() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: savedData, error } = await supabase
          .from("saved_vacancies")
          .select("vacancy_id")
          .eq("candidate_id", user.id);

        if (error) {
          console.error("Error loading saved vacancies:", error);
          return;
        }

        if (savedData && isMounted) {
          setSavedJobIds(new Set(savedData.map((r: any) => r.vacancy_id)));
        }
      } catch (err) {
        console.error("Error fetching saved job ids:", err);
      }
    }

    loadSavedVacancies();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const toggleBookmark = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Inicia sesión para guardar vacantes");
        return;
      }

      const isCurrentlySaved = savedJobIds.has(id);

      // Optimistic update
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });

      if (isCurrentlySaved) {
        const { error } = await supabase
          .from("saved_vacancies")
          .delete()
          .eq("candidate_id", user.id)
          .eq("vacancy_id", id);

        if (error) {
          console.error("Error removing saved vacancy:", error);
          setSavedJobIds((prev) => new Set(prev).add(id));
          toast.error("Error al remover de guardados");
          return;
        }

        toast.info("Empleo removido de guardados");
      } else {
        const { error } = await supabase
          .from("saved_vacancies")
          .insert({
            candidate_id: user.id,
            vacancy_id: id,
          });

        if (error) {
          console.error("Error saving vacancy:", error);
          setSavedJobIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.error("Error al guardar el empleo");
          return;
        }

        toast.success("Empleo guardado en favoritos");
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast.error("Error al actualizar la lista de guardados");
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Featured Section (Vacantes Destacadas) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Vacantes destacadas
          </h2>
          <Link 
            href="/dashboard/candidate/discovery" 
            className="text-xs font-bold text-primary hover:underline transition-colors py-1"
          >
            Explorar todas &gt;
          </Link>
        </div>

        {/* Featured Content (Carousel or Empty Card) */}
        {featuredVacancies.length > 0 ? (
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 snap-x hide-scrollbar">
            {featuredVacancies.map((job) => (
              <Card 
                key={job.id}
                onClick={() => window.location.href = `/dashboard/candidate/discovery?jobId=${job.id}`}
                className="w-[295px] sm:w-[320px] shrink-0 bg-card text-card-foreground border border-border rounded-3xl p-6 flex flex-col justify-between h-[200px] sm:h-[210px] shadow-xs cursor-pointer hover:border-primary/40 transition-all snap-start"
              >
                {/* Top Row: Company logo/icon, details and bookmark icon */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-11 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0 font-bold text-sm overflow-hidden border border-border">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover rounded-xl" />
                      ) : (
                        <Briefcase className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{job.companyName}</h4>
                      <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">{job.location}</p>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                    aria-label="Guardar vacante"
                    className="text-muted-foreground hover:text-amber-500 p-1 shrink-0 transition-colors cursor-pointer rounded-lg hover:bg-muted"
                  >
                    <Bookmark className={`size-5 ${savedJobIds.has(job.id) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                  </button>
                </div>

                {/* Central Body: Job title */}
                <h3 className="text-base font-bold text-foreground tracking-tight line-clamp-2">
                  {job.title}
                </h3>

                {/* Bottom Footer: employment type and formatted salary */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span className="font-semibold text-foreground">{job.employmentType}</span>
                  <span>•</span>
                  <span className="font-bold text-primary truncate">{job.formattedSalary}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty Featured Card */
          <Card className="w-full bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[160px] shadow-xs">
            <p className="text-sm font-medium text-muted-foreground text-center">
              No hay vacantes destacadas en este momento.
            </p>
          </Card>
        )}
      </section>

      {/* 2. Nearby Section (Empleos Cerca de Ti) */}
      <section className="space-y-4 pt-2">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Empleos cerca de ti
        </h2>

        {nearbyVacancies.length > 0 ? (
          <div className="space-y-3">
            {nearbyVacancies.map((job) => (
              <Card 
                key={job.id}
                onClick={() => window.location.href = `/dashboard/candidate/discovery?jobId=${job.id}`}
                className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xs hover:border-primary/40 transition-all cursor-pointer"
              >
                {/* Left: Company Icon container */}
                <div className="size-12 rounded-xl bg-muted text-foreground flex items-center justify-center shrink-0 font-bold text-sm overflow-hidden border border-border">
                  {job.companyLogo ? (
                    <img src={job.companyLogo} alt={job.companyName} className="size-full object-cover rounded-xl" />
                  ) : (
                    <Briefcase className="size-5 text-muted-foreground" />
                  )}
                </div>

                {/* Center: Job Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-bold text-foreground truncate">{job.title}</h4>
                  <p className="text-xs text-muted-foreground font-medium truncate mt-0.5">
                    {job.companyName} • {job.employmentType}
                  </p>
                </div>

                {/* Right: Bookmark and Salary */}
                <div className="flex flex-col items-end justify-center shrink-0 gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                    aria-label="Guardar vacante"
                    className="p-1 text-muted-foreground hover:text-amber-500 transition-colors cursor-pointer rounded-lg hover:bg-muted"
                  >
                    <Bookmark className={`size-4.5 ${savedJobIds.has(job.id) ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                  </button>
                  <span className="text-xs sm:text-sm font-bold text-foreground">{job.formattedSalary}</span>
                </div>
              </Card>
            ))}

            {/* End of list indicator */}
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-1.5">
              <CheckCircle2 className="size-5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                Has visto todas las vacantes disponibles
              </span>
            </div>
          </div>
        ) : (
          /* Empty Nearby Card */
          <Card className="w-full bg-card border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
            <h3 className="text-base font-bold text-foreground mb-1">
              No se encontraron empleos activos cerca
            </h3>
            <p className="text-xs text-muted-foreground text-center max-w-sm leading-relaxed mb-4">
              Vuelve a consultar más tarde o explora en el buscador.
            </p>

            <Button 
              variant="outline"
              onClick={handleRefresh}
              className="rounded-full px-5 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RotateCw className="size-3.5" />
              Actualizar
            </Button>
          </Card>
        )}
      </section>

    </div>
  );
}
