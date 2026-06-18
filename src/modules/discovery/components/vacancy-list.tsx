"use client";

import * as React from "react";
import { VacancyCard } from "./vacancy-card";
import { Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  logoUrl: string | null;
  location: string;
  salaryMin: number;
  salaryMax: number;
  salaryFormatted: string;
  type: string;
  category: string;
  experience: string;
  skills: string[];
  postedAt: string;
  featured: boolean;
  description: string;
  benefits: string[];
  isFromDb: boolean;
  companyPhone: string | null;
}

interface VacancyListProps {
  jobs: Job[];
  selectedJob: Job | null;
  onSelectJob: (job: Job) => void;
  candidateSkills?: string[];
  appliedIds?: string[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export function VacancyList({
  jobs,
  selectedJob,
  onSelectJob,
  candidateSkills = [],
  appliedIds = [],
  onClearFilters,
  hasActiveFilters = false,
}: VacancyListProps) {
  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* List Header Info (Sticky) */}
      <div className="flex items-center justify-between px-1 pb-4 shrink-0">
        <h3 className="font-bold text-xs text-foreground uppercase tracking-widest flex items-center gap-1.5 select-none">
          Vacantes Locales
          <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md font-extrabold uppercase tracking-wide">
            <Sparkles className="size-2.5" />
            IA Match
          </span>
        </h3>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest select-none">
          {jobs.length} Puestos
        </p>
      </div>

      {/* Scrollable Feed */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 pb-8 scroll-smooth scrollbar-thin">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <VacancyCard
              key={job.id}
              job={job}
              isSelected={selectedJob?.id === job.id}
              onSelect={onSelectJob}
              candidateSkills={candidateSkills}
              isAlreadyApplied={appliedIds.includes(job.id)}
            />
          ))
        ) : (
          <div className="bg-white/50 dark:bg-zinc-900/30 border border-dashed border-border/80 rounded-2xl py-12 px-6 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <RotateCcw className="size-4 animate-spin-once" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">
                No hay vacantes coincidentes
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">
                Prueba borrando tu búsqueda o cambiando los filtros del explorador.
              </p>
              {hasActiveFilters && onClearFilters && (
                <Button
                  onClick={onClearFilters}
                  variant="link"
                  className="text-xs font-bold text-primary mt-2 p-0 h-auto"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
