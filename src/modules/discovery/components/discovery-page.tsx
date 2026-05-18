"use client"

import { useState, useMemo } from "react"
import { SlidersHorizontal, X, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { jobs, professionals, type Job, type Professional } from "../data/mock"
import { JobCard } from "./job-card"
import { ProfessionalCard } from "./professional-card"
import { FilterSidebar, type FilterState } from "./filter-sidebar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type ViewMode = "jobs" | "professionals"

const defaultFilter: FilterState = {
  search: "",
  types: [],
  salary: [30, 200],
  categories: [],
  locations: [],
  experience: [],
}

function filterJobs(jobs: Job[], filter: FilterState): Job[] {
  return jobs.filter((job) => {
    if (filter.search) {
      const q = filter.search.toLowerCase()
      if (
        !job.title.toLowerCase().includes(q) &&
        !job.company.toLowerCase().includes(q) &&
        !job.skills.some((s) => s.toLowerCase().includes(q))
      )
        return false
    }
    if (filter.types.length > 0 && !filter.types.includes(job.type)) return false
    if (filter.categories.length > 0 && !filter.categories.includes(job.category))
      return false
    if (filter.locations.length > 0 && !filter.locations.includes(job.location))
      return false
    if (filter.experience.length > 0 && !filter.experience.includes(job.experience))
      return false
    if (job.salaryMax < filter.salary[0] * 1000 || job.salaryMin > filter.salary[1] * 1000)
      return false
    return true
  })
}

function filterProfessionals(pros: Professional[], filter: FilterState): Professional[] {
  return pros.filter((pro) => {
    if (filter.search) {
      const q = filter.search.toLowerCase()
      if (
        !pro.name.toLowerCase().includes(q) &&
        !pro.title.toLowerCase().includes(q) &&
        !pro.skills.some((s) => s.toLowerCase().includes(q)) &&
        !pro.services.some((s) => s.name.toLowerCase().includes(q))
      )
        return false
    }
    if (filter.categories.length > 0 && !filter.categories.includes(pro.category))
      return false
    if (filter.locations.length > 0 && !filter.locations.includes(pro.location))
      return false
    return true
  })
}

export function DiscoveryPage({ 
  showNav = true,
  initialMode = "jobs",
  lockMode = false
}: { 
  showNav?: boolean
  initialMode?: ViewMode
  lockMode?: boolean
}) {
  const [mode, setMode] = useState<ViewMode>(initialMode)
  const [filter, setFilter] = useState<FilterState>(defaultFilter)
  const [sheetOpen, setSheetOpen] = useState(false)

  const filteredJobs = useMemo(() => filterJobs(jobs, filter), [filter])
  const filteredProfessionals = useMemo(
    () => filterProfessionals(professionals, filter),
    [filter],
  )

  const tabs: { value: ViewMode; label: string; count: number }[] = [
    { value: "jobs", label: "Vacantes", count: filteredJobs.length },
    { value: "professionals", label: "Profesionales", count: filteredProfessionals.length },
  ]

  return (
    <div className={cn("min-h-screen", showNav ? "bg-white" : "bg-transparent")}>
      {showNav && (
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-[#e2e2e7]">
          <Link href="/discovery" className="flex items-center gap-2">
            <div className="h-7 w-7 bg-[#191c1f] rounded-md flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-[18px] font-semibold text-[#191c1f] tracking-tight">K'anPro</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/contact"
              className="text-[14px] font-medium text-[#505a63] hover:text-[#191c1f] transition-colors"
            >
              Contacto
            </Link>
            <Link
              href="/login"
              className="text-[14px] font-semibold text-white bg-[#191c1f] hover:bg-[#191c1f]/90 px-5 py-2 rounded-full transition-colors"
            >
              Iniciar Sesión
            </Link>
          </div>
        </nav>
      )}
      <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-8 md:py-[88px]">
        <div className="mb-10">
          <h1 className="text-[40px] font-medium leading-[1.2] -tracking-[0.4px] text-foreground">
            {lockMode ? (mode === "jobs" ? "Vacantes" : "Talento") : "Discovery"}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Encuentra el talento o la oportunidad perfecta para tu próximo proyecto.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between border-b border-border">
          {!lockMode && (
            <div className="flex gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setMode(tab.value)}
                  className={cn(
                    "relative px-6 pb-3 text-sm font-medium transition-colors",
                    mode === tab.value
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span className="ml-2 text-xs text-muted-foreground/60">
                    {tab.count}
                  </span>
                  {mode === tab.value && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex h-10 items-center gap-2 rounded-full border-[#e2e2e7] bg-white text-sm text-foreground md:hidden"
              >
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-6 sm:max-w-sm">
              <SheetHeader className="p-0">
                <SheetTitle className="text-lg font-medium text-foreground">
                  Filters
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar
                  filter={filter}
                  onChange={(f) => {
                    setFilter(f)
                    setSheetOpen(false)
                  }}
                  mode={mode}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-10">
          <div className="hidden w-[260px] shrink-0 md:block">
            <div className="sticky top-12">
              <FilterSidebar
                filter={filter}
                onChange={setFilter}
                mode={mode}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-6 text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {mode === "jobs" ? filteredJobs.length : filteredProfessionals.length}
              </span>{" "}
              {mode === "jobs" ? "vacantes" : "profesionales"}
            </p>

            {mode === "jobs" ? (
              filteredJobs.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-base font-medium text-foreground">
                    No vacancies match your filters
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search criteria
                  </p>
                </div>
              )
            ) : filteredProfessionals.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProfessionals.map((pro) => (
                  <ProfessionalCard key={pro.id} professional={pro} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-base font-medium text-foreground">
                  No professionals match your filters
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
