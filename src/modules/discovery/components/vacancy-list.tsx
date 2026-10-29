"use client";

import * as React from "react";
import { VacancyCard } from "./vacancy-card";
import { Sparkles, RotateCcw } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Job } from "../types";

interface VacancyListProps {
  jobs: Job[];
  selectedJob: Job | null;
  onSelectJob: (job: Job) => void;
  candidateSkills?: string[];
  appliedIds?: string[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  loading?: boolean;
}

export function VacancyList({
  jobs,
  selectedJob,
  onSelectJob,
  candidateSkills = [],
  appliedIds = [],
  onClearFilters,
  hasActiveFilters = false,
  loading = false,
}: VacancyListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 5,
  });

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
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto pr-2 -mr-2 scroll-smooth scrollbar-thin relative"
      >
        {loading ? (
          /* Premium Skeleton Loader Cards */
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col rounded-2xl border border-border/40 bg-white/40 dark:bg-zinc-900/40 p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-neutral-200 dark:bg-zinc-850 shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3 bg-neutral-200 dark:bg-zinc-800 rounded-sm w-[30%]" />
                    <div className="h-4.5 bg-neutral-200 dark:bg-zinc-800 rounded-sm w-[80%]" />
                  </div>
                </div>
                <div className="h-3.5 bg-neutral-200 dark:bg-zinc-800 rounded-sm w-[55%]" />
                <div className="pt-3 border-t border-border/20 flex items-center justify-between">
                  <div className="h-6 bg-neutral-200 dark:bg-zinc-800 rounded-md w-24" />
                  <div className="h-3.5 bg-neutral-200 dark:bg-zinc-800 rounded-sm w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const job = jobs[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: "16px",
                  }}
                >
                  <VacancyCard
                    job={job}
                    isSelected={selectedJob?.id === job.id}
                    onSelect={onSelectJob}
                    candidateSkills={candidateSkills}
                    isAlreadyApplied={appliedIds.includes(job.id)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white/50 dark:bg-zinc-900/30 border border-dashed border-border/80 rounded-2xl py-12 px-6 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-[#5c7c9b]">
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
                  className="text-xs font-bold text-[#494fdf] mt-2 p-0 h-auto"
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
