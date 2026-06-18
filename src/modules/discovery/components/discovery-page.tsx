"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SearchFilters } from "./search-filters";
import { VacancyList } from "./vacancy-list";
import { VacancyDetail } from "./vacancy-detail";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useVacanciesFeed } from "@/modules/candidate/hooks/use-vacancies-feed";
import type { Job } from "../types";

interface DiscoveryPageProps {
  showNav?: boolean;
  dbJobs?: Job[];
  candidateSkills?: string[];
  appliedVacancyIds?: string[];
  candidateId?: string;
}

export function DiscoveryPage({
  showNav = true,
  dbJobs = [],
  candidateSkills = [],
  appliedVacancyIds = [],
  candidateId = "",
}: DiscoveryPageProps) {
  // Local state to keep track of applications submitted in the current session
  const [prevAppliedVacancyIds, setPrevAppliedVacancyIds] = React.useState<string[]>(appliedVacancyIds);
  const [appliedIds, setAppliedIds] = React.useState<string[]>(appliedVacancyIds);

  // Synchronize state during render instead of inside useEffect
  if (appliedVacancyIds !== prevAppliedVacancyIds) {
    setPrevAppliedVacancyIds(appliedVacancyIds);
    setAppliedIds(appliedVacancyIds);
  }

  const handleApplySuccess = (jobId: string) => {
    setAppliedIds((prev) => [...prev, jobId]);
  };

  // State for Active Job Details
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // Media Query State for mobile detection
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Use the custom debounced vacancies hook
  const {
    search,
    setSearch,
    location,
    setLocation,
    category,
    setCategory,
    modality,
    setModality,
    jobs: filteredJobs,
    loading,
    handleClearFilters,
    hasActiveFilters,
  } = useVacanciesFeed(dbJobs);

  // Unique categories compiled dynamically from the initial full list of vacancies
  const categories = React.useMemo(() => {
    const cats = dbJobs.map((j) => j.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [dbJobs]);

  // Auto-select first job on desktop when list changes or loads
  React.useEffect(() => {
    if (!isMobile && filteredJobs.length > 0) {
      const exists = filteredJobs.some((j) => j.id === selectedJob?.id);
      if (!exists) {
        setSelectedJob(filteredJobs[0]);
      }
    } else if (filteredJobs.length === 0) {
      setSelectedJob(null);
    }
  }, [filteredJobs, isMobile, selectedJob?.id]);

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    if (isMobile) {
      setIsSheetOpen(true);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-[#fafafc] dark:bg-zinc-950/20 w-full overflow-hidden select-none",
        showNav ? "h-screen pt-4" : "h-full min-h-[calc(100vh-80px)] md:h-[calc(100vh-80px)]"
      )}
    >
      {/* Top Fixed Area: Filters & Searchbar */}
      <div className="shrink-0 p-4 md:p-6 pb-2">
        <SearchFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          modality={modality}
          onModalityChange={setModality}
          location={location}
          onLocationChange={setLocation}
          categories={categories}
        />
      </div>

      {/* Main Split-View Content Area */}
      <div className="flex-1 flex gap-6 overflow-hidden p-4 md:p-6 pt-0 min-h-0">
        {/* Panel Izquierdo: Listado Scrollable (40% de ancho en escritorio / 100% en móvil) */}
        <div className="w-full md:w-[40%] flex flex-col h-full overflow-hidden shrink-0">
          <VacancyList
            jobs={filteredJobs}
            selectedJob={selectedJob}
            onSelectJob={handleSelectJob}
            candidateSkills={candidateSkills}
            appliedIds={appliedIds}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            loading={loading}
          />
        </div>

        {/* Panel Derecho: Detalle de Vacante Activa (60% de ancho en escritorio / Oculto en móvil) */}
        <div className="hidden md:flex md:w-[60%] flex-col h-full overflow-hidden">
          <VacancyDetail
            job={selectedJob}
            candidateSkills={candidateSkills}
            isAlreadyApplied={
              selectedJob ? appliedIds.includes(selectedJob.id) : false
            }
            candidateId={candidateId}
            onApplySuccess={handleApplySuccess}
          />
        </div>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[92vh] p-0 border-t border-border/40 rounded-t-[28px] overflow-hidden bg-white dark:bg-zinc-900"
          showCloseButton={true}
        >
          <VacancyDetail
            job={selectedJob}
            candidateSkills={candidateSkills}
            isAlreadyApplied={
              selectedJob ? appliedIds.includes(selectedJob.id) : false
            }
            candidateId={candidateId}
            onApplySuccess={handleApplySuccess}
            isMobile={true}
            className="border-none rounded-none h-full"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
