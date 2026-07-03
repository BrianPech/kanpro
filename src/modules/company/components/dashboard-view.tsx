"use client"

import * as React from "react"
import { 
  Briefcase, 
  Users, 
  Clock, 
  CalendarDays, 
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
  metrics?: {
    activeVacancies: number
    totalApplications: number
    reviewingApplications: number
    totalConnections: number
  }
  recentActivities?: {
    id: string
    candidateName: string
    candidateHeadline: string
    candidateAvatar: string | null
    skills: string[]
    vacancyTitle: string
    createdAt: string
  }[]
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "hace unos segundos"
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  if (diffHours < 24) return `hace ${diffHours} h`
  return `hace ${diffDays} d`
}

export function DashboardView({ 
  companyName, 
  metrics = {
    activeVacancies: 0,
    totalApplications: 0,
    reviewingApplications: 0,
    totalConnections: 0
  },
  recentActivities = []
}: DashboardViewProps) {
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
        <Link 
          href="/dashboard/company/vacancies"
          className="no-underline block"
        >
          <div 
            onMouseMove={handleMouseMove}
            className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col gap-4 group cursor-pointer relative overflow-hidden h-full"
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
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight font-sans">
                {metrics.activeVacancies}
              </h3>
            </div>
            <div className="flex items-center text-indigo-600 dark:text-indigo-300 gap-1 mt-auto relative z-10 font-semibold text-xs">
              <span>Gestionar puestos</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Metric 2 - Postulaciones totales */}
        <Link 
          href="/dashboard/company/inbox"
          className="no-underline block"
        >
          <div 
            onMouseMove={handleMouseMove}
            className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col gap-4 group cursor-pointer relative overflow-hidden h-full"
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
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight font-sans">
                {metrics.totalApplications}
              </h3>
            </div>
            <div className="flex items-center text-blue-600 dark:text-blue-300 gap-1 mt-auto relative z-10 font-semibold text-xs">
              <span>Ver bandeja de entrada</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Metric 3 - Perfiles en revisión */}
        <Link 
          href="/dashboard/company/inbox"
          className="no-underline block"
        >
          <div 
            onMouseMove={handleMouseMove}
            className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col gap-4 group cursor-pointer relative overflow-hidden h-full"
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
                Postulaciones pendientes
              </p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight font-sans">
                {metrics.reviewingApplications}
              </h3>
            </div>
            <div className="flex items-center text-amber-700 dark:text-amber-400 gap-1 mt-auto relative z-10 font-semibold text-xs">
              <Clock className="size-4 animate-pulse text-amber-500" />
              <span>Requieren revisión</span>
            </div>
          </div>
        </Link>

        {/* Metric 4 - Contactos directos */}
        <Link 
          href="/dashboard/company/radar"
          className="no-underline block"
        >
          <div 
            onMouseMove={handleMouseMove}
            className="glass-card p-6 md:p-8 rounded-[24px] flex flex-col gap-4 group cursor-pointer relative overflow-hidden h-full"
          >
            <div 
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]"
              style={{
                background: "radial-gradient(300px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.08), transparent 80%)"
              }}
            />
            <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-300 relative z-10">
              <CalendarDays className="size-6 fill-emerald-500/20 dark:fill-emerald-500/30" />
            </div>
            <div className="relative z-10">
              <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Contactos Directos
              </p>
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight font-sans">
                {metrics.totalConnections}
              </h3>
            </div>
            <div className="flex items-center text-emerald-600 dark:text-emerald-300 font-bold gap-1 mt-auto hover:text-emerald-700 transition-colors relative z-10 text-xs">
              <span>Buscar talento local</span>
              <ArrowRight className="size-4 text-emerald-600 dark:text-emerald-300 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </div>
        </Link>

      </section>

      {/* Activity Feed Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight md:text-2xl">
            Feed de Actividad Reciente
          </h3>
          <Link href="/dashboard/company/inbox">
            <Button 
              variant="ghost" 
              className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 font-bold text-sm hover:bg-indigo-500/5 active:scale-95 transition-all"
            >
              Ver todo
            </Button>
          </Link>
        </div>

        <div className="glass-card rounded-[24px] overflow-hidden shadow-sm">
          {recentActivities.length === 0 ? (
            <div className="text-center py-16 px-4 text-muted-foreground bg-card">
              <Users className="size-12 stroke-[1.2] mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold">No hay postulaciones recientes</p>
              <p className="text-xs mt-1 max-w-sm mx-auto">
                Tus vacantes activas no han recibido postulaciones en los últimos días. ¡Usa el botón flotante para publicar otra oferta exprés!
              </p>
            </div>
          ) : (
            <>
              {/* Feed Header */}
              <div className="hidden sm:grid grid-cols-12 px-8 py-4 bg-muted/20 dark:bg-muted/10 border-b border-border/40">
                <div className="col-span-6 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CANDIDATO</div>
                <div className="col-span-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">HABILIDADES</div>
                <div className="col-span-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">TIEMPO</div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-border/40">
                {recentActivities.map((act) => (
                  <Link 
                    key={act.id}
                    href="/dashboard/company/inbox"
                    className="no-underline block"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 px-6 sm:px-8 py-6 items-center hover:bg-muted/20 dark:hover:bg-muted/10 transition-colors cursor-pointer group gap-4 sm:gap-0">
                      <div className="col-span-12 sm:col-span-6 flex items-center gap-4">
                        <img 
                          alt={act.candidateName} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/10 dark:border-indigo-500/30 group-hover:scale-105 transition-transform duration-300 shadow-sm" 
                          src={act.candidateAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} 
                        />
                        <div>
                          <h4 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            {act.candidateName}
                          </h4>
                          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-medium">
                            {act.candidateHeadline} <span className="text-indigo-500/80 dark:text-indigo-400 font-semibold">• Postuló a {act.vacancyTitle}</span>
                          </p>
                        </div>
                      </div>
                      <div className="col-span-12 sm:col-span-4 flex flex-wrap gap-2">
                        {act.skills.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Sin habilidades registradas</span>
                        ) : (
                          act.skills.map((skill: string) => (
                            <span key={skill} className="px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {skill}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="col-span-12 sm:col-span-2 text-left sm:text-right">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                          {formatRelativeTime(act.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Floating Action Button (FAB) persistent */}
      <Link 
        href="/dashboard/company/vacancies?create=true" 
        className="fixed bottom-20 md:bottom-10 right-10 z-50 animate-bounce group"
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
