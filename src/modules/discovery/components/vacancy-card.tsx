"use client";

import * as React from "react";
import { MapPin, Clock, Sparkles, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

interface VacancyCardProps {
  job: Job;
  isSelected: boolean;
  onSelect: (job: Job) => void;
  candidateSkills?: string[];
  isAlreadyApplied?: boolean;
}

export function VacancyCard({
  job,
  isSelected,
  onSelect,
  candidateSkills = [],
  isAlreadyApplied = false,
}: VacancyCardProps) {
  const candidateSkillsLower = React.useMemo(() => {
    return candidateSkills.map((s) => s.toLowerCase().trim());
  }, [candidateSkills]);

  // Calculate Match Score based on candidate skills vs job requirements
  const matchScore = React.useMemo(() => {
    if (job.skills && job.skills.length > 0 && candidateSkillsLower.length > 0) {
      const matching = job.skills.filter((vs: string) =>
        candidateSkillsLower.some(
          (cs: string) =>
            cs.includes(vs.toLowerCase().trim()) ||
            vs.toLowerCase().trim().includes(cs)
        )
      );
      const computed = Math.round((matching.length / job.skills.length) * 100);
      return Math.max(50, Math.min(100, computed));
    }
    return 70; // default baseline
  }, [job.skills, candidateSkillsLower]);

  return (
    <div
      onClick={() => onSelect(job)}
      className={cn(
        "group relative flex flex-col rounded-2xl border p-5 transition-all duration-300 ease-out cursor-pointer overflow-hidden",
        isSelected
          ? "border-indigo-500/50 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.02] shadow-xs"
          : "border-border/40 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md hover:border-border/80 hover:bg-white/90 dark:hover:bg-zinc-900/60 hover:shadow-xs hover:-translate-y-0.5"
      )}
    >
      {/* Selection Left Accent Bar */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-indigo-500 rounded-l-2xl"></div>
      )}

      {/* Applied Left Accent Bar (overrides selection color in layout) */}
      {isAlreadyApplied && !isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500 rounded-l-2xl"></div>
      )}

      {/* Top Header: Company and Title */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 dark:bg-zinc-800 text-sm font-extrabold border border-border/40 text-primary uppercase select-none">
          {job.logoUrl ? (
            <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" />
          ) : (
            job.companyLogo || job.company.substring(0, 2)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">
              {job.company}
            </span>
            {isAlreadyApplied && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                <CheckCircle className="size-3" />
                Postulado
              </span>
            )}
          </div>
          <h3 className="mt-0.5 text-sm md:text-base font-bold leading-snug text-foreground group-hover:text-primary transition-colors duration-200 truncate">
            {job.title}
          </h3>
        </div>
      </div>

      {/* Meta Info: Location and Type */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground/80 font-medium">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3 text-muted-foreground/60" />
          {job.location}
        </span>
        <span className="text-muted-foreground/30">•</span>
        <span className="font-bold text-foreground/95 bg-muted/65 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md text-[10px]">
          {job.type}
        </span>
        <span className="text-muted-foreground/30">•</span>
        <span className="inline-flex items-center gap-1 text-muted-foreground/60">
          <Clock className="size-3" />
          {job.postedAt}
        </span>
      </div>

      {/* Bottom info: Skills match indicator */}
      <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between gap-4">
        {/* IA match score indicator */}
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className={cn(
              "h-6 rounded-lg border-none px-2 text-[10px] font-bold gap-1 shadow-none",
              matchScore >= 75
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            <Sparkles className="size-3" />
            {matchScore}% Match
          </Badge>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest animate-pulse">
            Activa
          </span>
        )}
      </div>
    </div>
  );
}
