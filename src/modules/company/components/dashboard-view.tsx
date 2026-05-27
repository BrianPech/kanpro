"use client"

import * as React from "react"
import { 
  Briefcase, 
  Users, 
  Clock, 
  CalendarDays, 
  TrendingUp, 
  Download, 
  Plus, 
  ArrowRight,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

interface DashboardViewProps {
  companyName: string
}

export function DashboardView({ companyName }: DashboardViewProps) {
  const [isDownloading, setIsDownloading] = React.useState(false)

  // Report download logic with micro-interaction loading spinner
  const handleDownloadReport = () => {
    setIsDownloading(true)
    toast.info("Generando reporte...", {
      description: "Estamos preparando tu resumen de actividad empresarial.",
    })
    
    setTimeout(() => {
      setIsDownloading(false)
      toast.success("¡Reporte descargado con éxito!", {
        description: `El informe de reclutamiento para ${companyName} ha sido guardado.`,
      })
    }, 1500)
  }

  // Mouse move interactive shine glow handler for glassmorphism bento cards
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty("--mouse-x", `${x}px`)
    card.style.setProperty("--mouse-y", `${y}px`)
  }

  return (
    <div className="flex-grow min-h-screen bg-background/50 dark:bg-background/20 px-4 md:px-10 lg:px-12 py-10 space-y-12 animate-in fade-in duration-500">
      
      {/* Dashboard Header Banner */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            Dashboard Empresarial
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 font-medium">
            Bienvenido de nuevo, <span className="text-indigo-600 dark:text-indigo-300 font-bold">{companyName}</span>. Aquí tienes el resumen de tu actividad de reclutamiento.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="flex items-center gap-2 border border-indigo-500/20 dark:border-indigo-500/40 bg-card hover:bg-indigo-500/5 text-indigo-600 dark:text-indigo-300 font-semibold px-6 py-5 rounded-xl h-auto active:scale-95 transition-all shadow-sm"
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin text-indigo-600 dark:text-indigo-300" />
            ) : (
              <Download className="size-4 text-indigo-600 dark:text-indigo-300" />
            )}
            <span>{isDownloading ? "Descargando..." : "Descargar Reporte"}</span>
          </Button>
        </div>
      </section>

      {/* Bento Grid Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 - Vacantes activas */}
        <div 
          onMouseMove={handleMouseMove}
          className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col gap-4 group cursor-pointer relative overflow-hidden"
          onClick={() => toast.info("Navegando a vacantes...", { description: "Cargando el listado completo de vacantes." })}
        >
          {/* Shine glowing radial effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]"
            style={{
              background: "radial-gradient(300px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.08), transparent 80%)"
            }}
          />
          <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-300 relative z-10">
            <Briefcase className="size-6 fill-indigo-500/20 dark:fill-indigo-500/30" />
          </div>
          <div className="relative z-10">
            <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Vacantes activas
            </p>
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">12</h3>
          </div>
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 gap-1 mt-auto relative z-10">
            <TrendingUp className="size-4" />
            <span className="text-xs font-bold font-sans">+2 este mes</span>
          </div>
        </div>

        {/* Metric 2 - Postulaciones totales */}
        <div 
          onMouseMove={handleMouseMove}
          className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col gap-4 group cursor-pointer relative overflow-hidden"
          onClick={() => toast.info("Ver postulaciones...", { description: "Cargando todas las postulaciones recibidas." })}
        >
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]"
            style={{
              background: "radial-gradient(300px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.08), transparent 80%)"
            }}
          />
          <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-300 relative z-10">
            <Users className="size-6 fill-blue-500/20 dark:fill-blue-500/30" />
          </div>
          <div className="relative z-10">
            <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Postulaciones totales
            </p>
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">284</h3>
          </div>
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 gap-1 mt-auto relative z-10">
            <TrendingUp className="size-4" />
            <span className="text-xs font-bold font-sans">+15% vs semana pasada</span>
          </div>
        </div>

        {/* Metric 3 - Perfiles en revisión */}
        <div 
          onMouseMove={handleMouseMove}
          className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col gap-4 group cursor-pointer relative overflow-hidden"
          onClick={() => toast.info("Revisar perfiles pendientes...", { description: "Filtrando candidatos en fase de revisión." })}
        >
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]"
            style={{
              background: "radial-gradient(300px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.08), transparent 80%)"
            }}
          />
          <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 relative z-10">
            <Clock className="size-6 fill-amber-500/20 dark:fill-amber-500/30" />
          </div>
          <div className="relative z-10">
            <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Perfiles en revisión
            </p>
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">45</h3>
          </div>
          <div className="flex items-center text-amber-700 dark:text-amber-400 gap-1 mt-auto relative z-10">
            <Clock className="size-4 animate-pulse" />
            <span className="text-xs font-bold font-sans">Requiere atención pronta</span>
          </div>
        </div>

        {/* Metric 4 - Entrevistas programadas */}
        <div 
          onMouseMove={handleMouseMove}
          className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col gap-4 group cursor-pointer relative overflow-hidden"
          onClick={() => toast.info("Abriendo agenda...", { description: "Cargando tu calendario de entrevistas." })}
        >
          <div 
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]"
            style={{
              background: "radial-gradient(300px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.08), transparent 80%)"
            }}
          />
          <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-300 relative z-10">
            <CalendarDays className="size-6 fill-indigo-500/20 dark:fill-indigo-500/30" />
          </div>
          <div className="relative z-10">
            <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Entrevistas programadas
            </p>
            <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">8</h3>
          </div>
          <div className="flex items-center text-indigo-600 dark:text-indigo-300 font-bold gap-1 mt-auto hover:text-indigo-700 dark:hover:text-indigo-200 transition-colors relative z-10">
            <span className="text-xs">Ver calendario</span>
            <ArrowRight className="size-4 text-indigo-600 dark:text-indigo-300 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>

      </section>

      {/* Activity Feed Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight md:text-2xl">
            Feed de Actividad Reciente
          </h3>
          <Button 
            variant="ghost" 
            onClick={() => toast.info("Cargando feed completo...", { description: "Accediendo al historial de actividad general." })}
            className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 font-bold text-sm hover:bg-indigo-500/5 active:scale-95 transition-all"
          >
            Ver todo
          </Button>
        </div>

        <div className="glass-card rounded-[24px] overflow-hidden shadow-sm">
          
          {/* Feed Header */}
          <div className="hidden sm:grid grid-cols-12 px-8 py-4 bg-muted/20 dark:bg-muted/10 border-b border-border/40">
            <div className="col-span-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CANDIDATO</div>
            <div className="col-span-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">HABILIDADES</div>
            <div className="col-span-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">TIEMPO</div>
          </div>

          {/* List Items */}
          <div className="divide-y divide-border/40">
            
            {/* Candidate 1 - David Rivera */}
            <div 
              onClick={() => toast("Visualizando perfil", { description: "Se abrirá el perfil detallado del candidato David Rivera." })}
              className="grid grid-cols-1 sm:grid-cols-12 px-6 sm:px-8 py-6 items-center hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors cursor-pointer group gap-4 sm:gap-0"
            >
              <div className="col-span-12 sm:col-span-6 flex items-center gap-4">
                <img 
                  alt="David Rivera" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/10 dark:border-indigo-500/30 group-hover:scale-105 transition-transform duration-300 shadow-sm" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCh0sczpLCa4_hoGHvWLfisVgi5oSRzfMiEq3khHe6zjaSJqN43loqcqpjYPlu1awoWeMEsmCREHg6RmCMTlIMKJin0FCtbo0PrEh-2f8SCL64PbURlpCOF4bScegobdGidVvqYsi89VI6rWRKMQN6aiqkN98-_4j_3e4UaC8Kd5lNE8CoXaZG3bLrn4wNG3IM_18NuDpol6NmLyBqgdtDQgC11Jm640lwezz2bEcjBOjOBoItnUzJXwjopXoqhanuba5yngbs_PMY" 
                />
                <div>
                  <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    David Rivera
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Senior Full-Stack Dev
                  </p>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  React
                </span>
                <span className="px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Node.js
                </span>
                <span className="px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  AWS
                </span>
              </div>
              <div className="col-span-12 sm:col-span-2 text-left sm:text-right">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  hace 15 min
                </p>
              </div>
            </div>

            {/* Candidate 2 - Mariana Gómez */}
            <div 
              onClick={() => toast("Visualizando perfil", { description: "Se abrirá el perfil detallado del candidato Mariana Gómez." })}
              className="grid grid-cols-1 sm:grid-cols-12 px-6 sm:px-8 py-6 items-center hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors cursor-pointer group gap-4 sm:gap-0"
            >
              <div className="col-span-12 sm:col-span-6 flex items-center gap-4">
                <img 
                  alt="Mariana Gómez" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/10 dark:border-indigo-500/30 group-hover:scale-105 transition-transform duration-300 shadow-sm" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwJ49HVEK9CCX2gGBHdabYxYkpSaOdFPimAMWpdlYQQkF3sfFy2fBYJes7ltklzb80bLifRPKasTqblhWhSk6dWLhctCTjonnjfYVMG_MDROqTR6Z3PU3IVX_zOncsOHanNxzwyrCufc4xNA6RFCfeJhl5-WVIeehDnNjNAsMZZpneRkmg1IER9sce-gzBtgQROKyt7CX7AeJlIIUcQVTdLldmCP5Z4P19_OF_X2LGtYs-rfDmrMFS481v33AP46ERkzTrKalR-6E" 
                />
                <div>
                  <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    Mariana Gómez
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    UX/UI Design Lead
                  </p>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Figma
                </span>
                <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  User Research
                </span>
              </div>
              <div className="col-span-12 sm:col-span-2 text-left sm:text-right">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  hace 2 horas
                </p>
              </div>
            </div>

            {/* Candidate 3 - Carlos Ruiz */}
            <div 
              onClick={() => toast("Visualizando perfil", { description: "Se abrirá el perfil detallado del candidato Carlos Ruiz." })}
              className="grid grid-cols-1 sm:grid-cols-12 px-6 sm:px-8 py-6 items-center hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors cursor-pointer group gap-4 sm:gap-0"
            >
              <div className="col-span-12 sm:col-span-6 flex items-center gap-4">
                <img 
                  alt="Carlos Ruiz" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/10 dark:border-indigo-500/30 group-hover:scale-105 transition-transform duration-300 shadow-sm" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC09IG5lVQKO5JXGhkMg2AsIb7DwnAwLaeMA53rv4sIfbnCCF8Qo4RprB4xZ_OACUMw5FgzA8P9TQyQGgrjwr_B_jDRaJbBuEQtFK1MFSb1wz8AATggGGP30aNKRyLblM-5xcPTzgaToE_UNeAmrNA0Gpp3T4QdPo0PjErnSj415Am3h_mFQw5cPDijtRmfLFhnoXfqHFjM-nQLWlhJrqKzH2yco5fu-ZB4gMAMvYeE_nVAf22eRRNCzLDdbPAGlHEU2t9H_FQpz6E" 
                />
                <div>
                  <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    Carlos Ruiz
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium">
                    DevOps Engineer
                  </p>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Docker
                </span>
                <span className="px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Kubernetes
                </span>
                <span className="px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Python
                </span>
              </div>
              <div className="col-span-12 sm:col-span-2 text-left sm:text-right">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  hace 5 horas
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Floating Action Button (FAB) persistent */}
      <Link 
        href="/dashboard/company/vacancies?create=true" 
        className="fixed bottom-10 right-10 z-50 animate-bounce group"
        onClick={() => toast.info("Abriendo publicador...", { description: "Preparando formulario de nueva vacante." })}
        style={{ animationDuration: "3s" }}
      >
        <Button className="bg-primary hover:bg-secondary-container text-white px-6 py-6 rounded-full shadow-2xl flex items-center gap-3 transition-all duration-300 active:scale-95 h-auto md:px-8">
          <Plus className="size-6 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-extrabold tracking-wide text-xs md:text-sm">Publicar Nueva Vacante</span>
        </Button>
      </Link>

    </div>
  )
}
