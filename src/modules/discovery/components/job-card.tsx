"use client";

import * as React from "react";
import { MapPin, Clock, Sparkles, Star, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatSalary(min: number, max: number) {
  const f = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toLocaleString()}`;
  return `${f(min)} – ${f(max)}`;
}

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

interface JobCardProps {
  job: Job;
  onViewDetails: (job: Job) => void;
  candidateSkills: string[];
  isAlreadyApplied: boolean;
}

export function JobCard({
  job,
  onViewDetails,
  candidateSkills = [],
  isAlreadyApplied = false,
}: JobCardProps) {
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem(`bookmark_${job.id}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsBookmarked(!!saved);
  }, [job.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    if (nextState) {
      localStorage.setItem(`bookmark_${job.id}`, "true");
    } else {
      localStorage.removeItem(`bookmark_${job.id}`);
    }
  };

  const candidateSkillsLower = React.useMemo(() => {
    return candidateSkills.map((s) => s.toLowerCase().trim());
  }, [candidateSkills]);

  // Calculate Match Score based on candidate skills vs job requirements
  const matchScore = React.useMemo(() => {
    if (job.skills && job.skills.length > 0 && candidateSkillsLower.length > 0) {
      const jobSkills = job.skills;
      
      const matching = jobSkills.filter((vs: string) =>
        candidateSkillsLower.some((cs: string) => cs.includes(vs.toLowerCase().trim()) || vs.toLowerCase().trim().includes(cs))
      );
      const computed = Math.round((matching.length / jobSkills.length) * 100);
      return Math.max(50, Math.min(100, computed));
    }
    return 70; // default baseline
  }, [job.skills, candidateSkillsLower]);

  return (
    <div
      onClick={() => onViewDetails(job)}
      className={cn(
        "group flex flex-col rounded-[24px] border bg-card text-card-foreground p-6 md:p-8 transition-all duration-300 ease-out hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 cursor-pointer relative overflow-hidden",
        job.featured
          ? "border-primary/20 bg-primary/[0.01]"
          : "border-border/60",
      )}
    >
      {/* Top Section: Logo, Company Name & Bookmark */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold shadow-xs border border-border/40",
              job.featured
                ? "bg-primary text-primary-foreground border-primary/20"
                : "bg-muted text-primary",
            )}
          >
            {job.logoUrl ? (
              <img src={job.logoUrl} alt={job.company} className="w-full h-full object-cover rounded-xl" />
            ) : (
              job.companyLogo
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{job.company}</p>
            <h3 className="mt-1 text-base md:text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors duration-200">
              {job.title}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleBookmark}
          className={cn(
            "mt-1 p-2 rounded-full hover:bg-muted/70 transition-all shrink-0 duration-300",
            isBookmarked ? "text-amber-500 scale-110" : "text-muted-foreground/60 hover:text-foreground"
          )}
        >
          <Star className="size-4.5 fill-current" />
        </button>
      </div>

      {/* Middle Section: Location, Salary, Posted Date */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground/90">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5 text-muted-foreground/75" />
          {job.location}
        </span>
        <span>·</span>
        <span className="font-bold text-foreground">
          {job.salaryFormatted || formatSalary(job.salaryMin, job.salaryMax)}
        </span>
        <span>·</span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground/70">
          <Clock className="size-3.5" />
          {job.postedAt}
        </span>
      </div>

      {/* Badges / Tech tags */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {/* IA Match Indicator Badge */}
        <Badge
          variant="secondary"
          className={cn(
            "h-7 rounded-lg border-0 px-2.5 text-[11px] font-bold gap-1 shadow-xs",
            matchScore >= 75
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}
        >
          <Sparkles className="size-3 shrink-0" />
          {matchScore}% Match
        </Badge>

        {job.skills.slice(0, 3).map((skill: string) => {
          const isMatched = candidateSkillsLower.some(
            (cs: string) => cs.includes(skill.toLowerCase().trim()) || skill.toLowerCase().trim().includes(cs)
          );
          return (
            <Badge
              key={skill}
              variant="secondary"
              className={cn(
                "h-7 rounded-lg border-0 px-2.5 text-[11px] font-semibold transition-all duration-200",
                isMatched
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {skill}
            </Badge>
          );
        })}
        {job.skills.length > 3 && (
          <Badge
            variant="secondary"
            className="h-7 rounded-lg border-0 bg-muted px-2 text-[10px] font-semibold text-muted-foreground/80"
          >
            +{job.skills.length - 3}
          </Badge>
        )}
      </div>

      {/* Footer Section: Details Button & Applied Status */}
      <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between gap-4">
        <Button 
          type="button"
          onClick={() => onViewDetails(job)}
          className={cn(
            "h-9 rounded-full px-5 text-xs font-bold transition-all shadow-xs",
            isAlreadyApplied 
              ? "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-none"
              : "bg-primary text-primary-foreground hover:bg-primary/95"
          )}
        >
          {isAlreadyApplied ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle className="size-3.5" />
              Postulado
            </span>
          ) : (
            "Ver Detalles"
          )}
        </Button>
        <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wide">
          {job.type}
        </span>
      </div>

      {/* Subtle indicator bar for applied jobs */}
      {isAlreadyApplied && (
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500"></div>
      )}
    </div>
  );
}
