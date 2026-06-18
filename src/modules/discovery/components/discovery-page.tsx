"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { jobs } from "../data/mock";
import { SearchFilters } from "./search-filters";
import { VacancyList } from "./vacancy-list";
import { VacancyDetail } from "./vacancy-detail";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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

  // State for Job Details
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // Filters State
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [selectedModality, setSelectedModality] = React.useState("");
  const [selectedLocation, setSelectedLocation] = React.useState("");

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

  // Merge database jobs and mock jobs
  const allJobs = React.useMemo(() => {
    const mockJobsMapped = jobs.map((j) => ({
      ...j,
      benefits: [
        "Seguro Médico Gastos Mayores",
        "Horario Flexible",
        "Home Office / Híbrido",
        "Vales de Despensa",
      ],
      description:
        j.id === "job-1"
          ? "Buscamos un Diseñador UI Senior para unirse a nuestro equipo internacional. Liderarás la creación de interfaces de usuario excepcionales y mantendrás nuestro sistema de diseño en Figma.\n\nRequisitos:\n- Más de 5 años de experiencia en diseño de interfaces.\n- Dominio experto de Figma y sistemas de diseño.\n- Excelentes habilidades de comunicación y trabajo colaborativo."
          : j.id === "job-2"
          ? "Únete a TechFlow como Desarrollador Full Stack. Trabajarás con React, Node.js y TypeScript construyendo APIs robustas e interfaces altamente interactivas.\n\nRequisitos:\n- Experiencia sólida en React, Node.js y bases de datos relacionales.\n- Enfoque de alta calidad de código y buenas prácticas."
          : "Estamos buscando profesionales motivados para unirse a nuestro equipo. Trabajarás en proyectos desafiantes en un ambiente innovador con grandes oportunidades de crecimiento profesional.",
      isFromDb: false,
      companyPhone: null, // Mocks have no phone
      logoUrl: null,
      salaryFormatted: `$${(j.salaryMin / 1000).toFixed(0)}k - $${(
        j.salaryMax / 1000
      ).toFixed(0)}k`,
      featured: false,
    }));

    return [...dbJobs, ...mockJobsMapped];
  }, [dbJobs]);

  // Unique categories and locations compiled dynamically
  const categories = React.useMemo(() => {
    const cats = allJobs.map((j) => j.category).filter(Boolean);
    return Array.from(new Set(cats));
  }, [allJobs]);

  const locations = React.useMemo(() => {
    const locs = allJobs
      .map((j) => {
        if (!j.location) return "";
        if (
          j.location.toLowerCase().includes("remote") ||
          j.location.toLowerCase().includes("remoto")
        ) {
          return "";
        }
        return j.location.split(",")[0].trim();
      })
      .filter(Boolean);
    return Array.from(new Set(locs));
  }, [allJobs]);

  // Modality helper
  const matchesModality = (job: Job, modalityVal: string) => {
    if (!modalityVal) return true;
    const modalityLower = modalityVal.toLowerCase();

    const locationLower = job.location.toLowerCase();
    const typeLower = job.type.toLowerCase();

    if (modalityLower === "remoto") {
      return (
        locationLower.includes("remote") ||
        locationLower.includes("remoto") ||
        typeLower.includes("remote") ||
        typeLower.includes("remoto")
      );
    }
    if (modalityLower === "híbrido" || modalityLower === "hibrido") {
      return (
        locationLower.includes("hybrid") ||
        locationLower.includes("híbrid") ||
        locationLower.includes("hibrid") ||
        typeLower.includes("hybrid") ||
        typeLower.includes("híbrid") ||
        typeLower.includes("hibrid")
      );
    }
    if (modalityLower === "presencial") {
      const isRemote =
        locationLower.includes("remote") ||
        locationLower.includes("remoto") ||
        typeLower.includes("remote") ||
        typeLower.includes("remoto");
      const isHybrid =
        locationLower.includes("hybrid") ||
        locationLower.includes("híbrid") ||
        locationLower.includes("hibrid") ||
        typeLower.includes("hybrid") ||
        typeLower.includes("híbrid") ||
        typeLower.includes("hibrid");
      return !isRemote && !isHybrid;
    }
    return true;
  };

  // Filter jobs based on filter state
  const filteredJobs = React.useMemo(() => {
    return allJobs.filter((job) => {
      // 1. Search Query
      if (search) {
        const query = search.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesSkills = job.skills.some((skill: string) =>
          skill.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesCompany && !matchesSkills) {
          return false;
        }
      }

      // 2. Sector / Category
      if (selectedCategory) {
        if (
          job.category.toLowerCase().trim() !==
          selectedCategory.toLowerCase().trim()
        ) {
          return false;
        }
      }

      // 3. Modalidad
      if (selectedModality) {
        if (!matchesModality(job, selectedModality)) {
          return false;
        }
      }

      // 4. Ubicación / Zona
      if (selectedLocation) {
        const jobLoc = job.location.toLowerCase();
        const selLoc = selectedLocation.toLowerCase();
        if (!jobLoc.includes(selLoc)) {
          return false;
        }
      }

      return true;
    });
  }, [allJobs, search, selectedCategory, selectedModality, selectedLocation]);

  // Auto-select first job on desktop when list/filters change
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

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedModality("");
    setSelectedLocation("");
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
          category={selectedCategory}
          onCategoryChange={setSelectedCategory}
          modality={selectedModality}
          onModalityChange={setSelectedModality}
          location={selectedLocation}
          onLocationChange={setSelectedLocation}
          categories={categories}
          locations={locations}
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
            hasActiveFilters={
              !!(search || selectedCategory || selectedModality || selectedLocation)
            }
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
