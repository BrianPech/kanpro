"use client";

import * as React from "react";
import { Search, RotateCcw, ArrowRight, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { jobs } from "../data/mock";
import { JobCard } from "./job-card";
import { FilterSidebar, type FilterState } from "./filter-sidebar";
import { JobDetailSheet } from "./job-detail-sheet";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

const SEARCH_SUGGESTIONS = ["React", "Figma", "DevOps", "Remote", "Senior", "Node.js"];

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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);

  // Synchronize state during render instead of inside useEffect
  if (appliedVacancyIds !== prevAppliedVacancyIds) {
    setPrevAppliedVacancyIds(appliedVacancyIds);
    setAppliedIds(appliedVacancyIds);
  }

  const handleApplySuccess = (jobId: string) => {
    setAppliedIds((prev) => [...prev, jobId]);
  };

  // State for Job Details Sheet
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const handleViewDetails = (job: Job) => {
    setSelectedJob(job);
    setIsSheetOpen(true);
  };

  const [filter, setFilter] = React.useState<FilterState>({
    search: "",
    types: [],
    salary: [30, 250],
    categories: [],
    locations: [],
    experience: [],
  });

  const handleSearchChange = (val: string) => {
    setFilter((prev) => ({ ...prev, search: val }));
  };

  // Merge database jobs and mock jobs
  const allJobs = React.useMemo(() => {
    const mockJobsMapped = jobs.map((j) => ({
      ...j,
      benefits: ["Seguro Médico Gastos Mayores", "Horario Flexible", "Home Office / Híbrido", "Vales de Despensa"],
      description: j.id === "job-1" 
        ? "Buscamos un Diseñador UI Senior para unirse a nuestro equipo internacional. Liderarás la creación de interfaces de usuario excepcionales y mantendrás nuestro sistema de diseño en Figma.\n\nRequisitos:\n- Más de 5 años de experiencia en diseño de interfaces.\n- Dominio experto de Figma y sistemas de diseño.\n- Excelentes habilidades de comunicación y trabajo colaborativo."
        : j.id === "job-2"
        ? "Únete a TechFlow como Desarrollador Full Stack. Trabajarás con React, Node.js y TypeScript construyendo APIs robustas e interfaces altamente interactivas.\n\nRequisitos:\n- Experiencia sólida en React, Node.js y bases de datos relacionales.\n- Enfoque de alta calidad de código y buenas prácticas."
        : "Estamos buscando profesionales motivados para unirse a nuestro equipo. Trabajarás en proyectos desafiantes en un ambiente innovador con grandes oportunidades de crecimiento profesional.",
      isFromDb: false,
      companyPhone: null, // Mocks have no phone
      logoUrl: null,
      salaryFormatted: `$${(j.salaryMin/1000).toFixed(0)}k - $${(j.salaryMax/1000).toFixed(0)}k`,
      featured: false,
    }));

    return [...dbJobs, ...mockJobsMapped];
  }, [dbJobs]);

  // Filter jobs based on sidebar state
  const filteredJobs = React.useMemo(() => {
    return allJobs.filter((job) => {
      // 1. Search Query
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesSkills = job.skills.some((skill: string) =>
          skill.toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesCompany && !matchesSkills) {
          return false;
        }
      }

      // 2. Job Types
      if (filter.types.length > 0) {
        const typeNormalized = job.type.toLowerCase().trim();
        const matchesType = filter.types.some((ft: string) => {
          if (ft === "Full-time" && (typeNormalized.includes("full") || typeNormalized.includes("completa") || typeNormalized.includes("presencial"))) return true;
          if (ft === "Part-time" && (typeNormalized.includes("part") || typeNormalized.includes("media"))) return true;
          return typeNormalized.includes(ft.toLowerCase().trim());
        });
        if (!matchesType) return false;
      }

      // 3. Salary Range (convert from absolute values to thousands for filter check)
      const minSalaryK = job.salaryMin / 1000;
      const maxSalaryK = job.salaryMax / 1000;
      if (minSalaryK > 0 || maxSalaryK > 0) {
        if (maxSalaryK < filter.salary[0] || minSalaryK > filter.salary[1]) {
          return false;
        }
      }

      // 4. Categories
      if (filter.categories.length > 0) {
        const categoryNormalized = job.category.toLowerCase().trim();
        const matchesCategory = filter.categories.some((fc: string) =>
          categoryNormalized.includes(fc.toLowerCase().trim())
        );
        if (!matchesCategory) return false;
      }

      // 5. Locations
      if (filter.locations.length > 0) {
        const matchesLocation = filter.locations.some((loc: string) => {
          if (loc === "Remote" && job.location.toLowerCase().includes("remote")) return true;
          return job.location.toLowerCase().includes(loc.toLowerCase());
        });
        if (!matchesLocation) return false;
      }

      // 6. Experience
      if (filter.experience.length > 0) {
        const expNormalized = job.experience.toLowerCase().trim();
        const matchesExp = filter.experience.some((fe: string) =>
          expNormalized.includes(fe.toLowerCase().trim())
        );
        if (!matchesExp) return false;
      }

      return true;
    });
  }, [allJobs, filter]);

  return (
    <div className={cn("min-h-screen bg-[#fafafc] dark:bg-zinc-950", showNav ? "pt-12" : "pt-0")}>
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10 lg:px-12 flex flex-col gap-8 pb-24">
        
        {/* Premium Dark Hero Search Hub */}
        <section className="bg-gradient-to-br from-[#18191b] via-[#1f2125] to-[#0d0e10] text-white rounded-[32px] p-6 md:p-12 lg:p-14 relative overflow-hidden shadow-xl flex flex-col gap-6 md:gap-8 border border-white/[0.04]">
          <div className="relative z-10 max-w-[700px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4f55f1] animate-ping"></span>
              <span className="text-[11px] uppercase tracking-widest font-bold text-white/60">Motor de Búsqueda IA</span>
            </div>
            <h1 className="text-[32px] md:text-[48px] font-bold tracking-tight leading-[1.1] text-white">
              Encuentra tu próximo paso profesional.
            </h1>
            <p className="text-[14px] md:text-[16px] text-white/70 mt-3 leading-relaxed max-w-[550px]">
              Filtra por salarios, modalidad y nivel técnico para conectar con ofertas analizadas y aprobadas por IA.
            </p>
          </div>

          {/* Centered Floating Search Input */}
          <div className="relative z-10 w-full max-w-[800px] mt-2 group/search">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-white/40 group-focus-within/search:text-[#4f55f1] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Buscar por cargo, palabra clave o empresa (ej. Frontend, Wayne Corp)..."
              value={filter.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-14 pl-12 pr-32 rounded-2xl bg-white/10 dark:bg-white/[0.06] backdrop-blur-md border border-white/10 text-white text-sm placeholder-white/40 focus:outline-hidden focus:ring-2 focus:ring-[#4f55f1]/45 focus:border-[#4f55f1]/45 focus:bg-white/15 transition-all shadow-lg"
            />
            <div className="absolute right-2 top-2 bottom-2 flex items-center">
              <Button className="h-10 rounded-xl bg-white hover:bg-white/95 text-zinc-950 font-bold text-xs px-5 shadow-xs transition-all gap-1.5 border-none">
                Buscar
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Quick Search Suggestions */}
          <div className="relative z-10 flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-white/50 font-semibold mr-1">Sugerencias:</span>
            {SEARCH_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSearchChange(suggestion)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-bold text-white/80 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Decorative mesh backgrounds */}
          <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-[#4f55f1]/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-[#4f55f1]/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
        </section>

        {/* Workspace Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start mt-2">
          
          {/* Left: Sticky Sidebar (Desktop only) */}
          <div className="hidden lg:block w-[300px] shrink-0 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[28px] p-2 py-6 shadow-xs sticky top-24">
            <FilterSidebar 
              filter={filter} 
              onChange={setFilter} 
              mode="jobs" 
              hideSearch={true}
            />
          </div>

          {/* Right: Job Cards List Grid */}
          <div className="flex-1 w-full space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-base text-foreground tracking-tight flex items-center gap-2">
                Ofertas de empleo disponibles
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-[#494fdf]/10 text-[#494fdf] rounded-md font-extrabold uppercase tracking-wide">
                  IA Matched
                </span>
              </h3>
              
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="lg:hidden h-9 px-4 rounded-full border border-border bg-white dark:bg-zinc-900 text-xs font-bold text-muted-foreground hover:bg-muted/50 flex items-center gap-1.5 shrink-0"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  Filtros
                </button>
                <p className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-widest hidden sm:block">
                  Mostrando <span className="text-primary">{filteredJobs.length}</span> vacantes
                </p>
              </div>
            </div>

            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredJobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onViewDetails={handleViewDetails}
                    candidateSkills={candidateSkills}
                    isAlreadyApplied={appliedIds.includes(job.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white/70 dark:bg-zinc-900/40 border border-dashed border-border/80 rounded-[28px] py-16 px-6 text-center max-w-md mx-auto flex flex-col items-center justify-center gap-4 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <RotateCcw className="size-5" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-foreground">
                    No encontramos vacantes
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Prueba cambiando los criterios de filtros en la barra lateral o limpia tu búsqueda en la caja superior.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Slide-out Job Details and Application Drawer */}
      <JobDetailSheet
        job={selectedJob}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        candidateSkills={candidateSkills}
        isAlreadyApplied={selectedJob ? appliedIds.includes(selectedJob.id) : false}
        candidateId={candidateId}
        onApplySuccess={handleApplySuccess}
      />

      {/* Mobile Collapsible Filter Drawer */}
      <Sheet open={isFilterDrawerOpen} onOpenChange={setIsFilterDrawerOpen}>
        <SheetContent side="left" className="w-full sm:max-w-[340px] overflow-y-auto px-1 py-8 flex flex-col gap-6 bg-card border-r border-border/40 shadow-xl">
          <SheetHeader className="px-5">
            <SheetTitle className="text-base font-bold text-foreground">Filtros Avanzados</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">Filtra ofertas según tu perfil y cercanía.</SheetDescription>
          </SheetHeader>
          <FilterSidebar 
            filter={filter} 
            onChange={setFilter} 
            mode="jobs" 
            hideSearch={true}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
