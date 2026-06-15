"use client"

import * as React from "react"
import { Search, RotateCcw, Compass, MapPin, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { jobs, type Job } from "../data/mock"
import { JobCard } from "./job-card"
import { FilterSidebar, type FilterState } from "./filter-sidebar"

export function DiscoveryPage({ 
  showNav = true
}: { 
  showNav?: boolean
}) {
  const [filter, setFilter] = React.useState<FilterState>({
    search: "",
    types: [],
    salary: [30, 250],
    categories: [],
    locations: [],
    experience: [],
  })

  // Filter jobs based on sidebar state
  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search Query
      if (filter.search) {
        const query = filter.search.toLowerCase()
        const matchesTitle = job.title.toLowerCase().includes(query)
        const matchesCompany = job.company.toLowerCase().includes(query)
        const matchesSkills = job.skills.some(skill => skill.toLowerCase().includes(query))
        if (!matchesTitle && !matchesCompany && !matchesSkills) {
          return false
        }
      }

      // 2. Job Types
      if (filter.types.length > 0) {
        if (!filter.types.includes(job.type)) {
          return false
        }
      }

      // 3. Salary Range
      // job.salaryMin and salaryMax are in absolute dollars (e.g. 120000). Filter salary is in thousands (e.g. 120).
      const minSalaryK = job.salaryMin / 1000
      const maxSalaryK = job.salaryMax / 1000
      if (maxSalaryK < filter.salary[0] || minSalaryK > filter.salary[1]) {
        return false
      }

      // 4. Categories
      if (filter.categories.length > 0) {
        if (!filter.categories.includes(job.category)) {
          return false
        }
      }

      // 5. Locations
      if (filter.locations.length > 0) {
        const matchesLocation = filter.locations.some(loc => {
          if (loc === "Remote" && job.location.toLowerCase().includes("remote")) return true
          return job.location.toLowerCase().includes(loc.toLowerCase())
        })
        if (!matchesLocation) return false
      }

      // 6. Experience
      if (filter.experience.length > 0) {
        if (!filter.experience.includes(job.experience)) {
          return false
        }
      }

      return true
    })
  }, [filter])

  return (
    <div className={cn("min-h-screen bg-background/50 dark:bg-background/20", showNav ? "pt-12" : "pt-0")}>
      <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 lg:px-12 flex flex-col gap-8 pb-24">
        
        {/* Header Section */}
        <section className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl flex items-center gap-3">
            <Compass className="size-8 text-primary" />
            Explorar Empleos
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-350 max-w-3xl leading-relaxed font-medium">
            Encuentra tu próximo desafío profesional. Utiliza los filtros avanzados para afinar tu búsqueda y conectar con las mejores empresas.
          </p>
        </section>

        {/* Workspace Layout */}
        <div className="flex flex-col lg:flex-row gap-10 items-start mt-4">
          
          {/* Left: Filter Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0 bg-card border border-border/50 rounded-[28px] p-2 py-8 shadow-sm">
            <FilterSidebar 
              filter={filter} 
              onChange={setFilter} 
              mode="jobs" 
            />
          </div>

          {/* Right: Job Cards List Grid */}
          <div className="flex-1 w-full space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                Resultados de búsqueda
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Mostrando <span className="text-primary">{filteredJobs.length}</span> empleos
              </p>
            </div>

            {filteredJobs.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
                {filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-[28px] py-20 px-6 text-center border border-border/50 max-w-md mx-auto flex flex-col items-center justify-center gap-4 bg-card shadow-sm mt-12">
                <div className="w-12 h-12 rounded-full bg-slate-500/10 dark:bg-slate-500/20 flex items-center justify-center text-slate-500 dark:text-slate-450">
                  <RotateCcw className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    No se encontraron vacantes
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Prueba cambiando los criterios de filtro o limpia los filtros de búsqueda.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
