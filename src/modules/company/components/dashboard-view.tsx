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

  return (
    <div className="flex-grow min-h-screen bg-[#fafafa] dark:bg-zinc-950/20 px-4 md:px-10 lg:px-12 py-10 space-y-10 max-w-[1400px] mx-auto w-full animate-in fade-in duration-300">
      
      {/* Dashboard Header Banner */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-3xl">
            Dashboard Empresarial
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
            Bienvenido de nuevo, <span className="text-zinc-900 dark:text-zinc-50 font-bold">{companyName}</span>. Resumen de tu actividad de reclutamiento.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="flex items-center gap-2 border border-border/10 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold px-4 py-3 rounded-lg h-9 active:scale-[0.98] transition-all shadow-none"
          >
            {isDownloading ? (
              <Loader2 className="size-3.5 animate-spin text-zinc-500" />
            ) : (
              <Download className="size-3.5 text-zinc-500" />
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
            className="bg-white dark:bg-zinc-900 border border-border/10 p-6 md:p-8 rounded-xl flex flex-col gap-4 group cursor-pointer relative overflow-hidden h-full shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-650 dark:text-zinc-400">
              <Briefcase className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Vacantes activas
              </p>
              <h3 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1 tracking-tight font-mono">
                {metrics.activeVacancies}
              </h3>
            </div>
            <div className="flex items-center text-zinc-500 dark:text-zinc-400 gap-1 mt-auto font-semibold text-xs transition-colors group-hover:text-zinc-950 dark:group-hover:text-zinc-100">
              <span>Gestionar puestos</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Metric 2 - Postulaciones totales */}
        <Link 
          href="/dashboard/company/applications"
          className="no-underline block"
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-border/10 p-6 md:p-8 rounded-xl flex flex-col gap-4 group cursor-pointer relative overflow-hidden h-full shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-650 dark:text-zinc-400">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Postulaciones totales
              </p>
              <h3 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1 tracking-tight font-mono">
                {metrics.totalApplications}
              </h3>
            </div>
            <div className="flex items-center text-zinc-500 dark:text-zinc-400 gap-1 mt-auto font-semibold text-xs transition-colors group-hover:text-zinc-950 dark:group-hover:text-zinc-100">
              <span>Ver bandeja de entrada</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Metric 3 - Perfiles en revisión */}
        <Link 
          href="/dashboard/company/applications"
          className="no-underline block"
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-border/10 p-6 md:p-8 rounded-xl flex flex-col gap-4 group cursor-pointer relative overflow-hidden h-full shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-650 dark:text-zinc-400">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Postulaciones pendientes
              </p>
              <h3 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1 tracking-tight font-mono">
                {metrics.reviewingApplications}
              </h3>
            </div>
            <div className="flex items-center text-amber-600 dark:text-amber-400 gap-1 mt-auto font-semibold text-xs">
              <Clock className="size-3.5 text-amber-500" />
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
            className="bg-white dark:bg-zinc-900 border border-border/10 p-6 md:p-8 rounded-xl flex flex-col gap-4 group cursor-pointer relative overflow-hidden h-full shadow-none hover:border-zinc-350 dark:hover:border-zinc-700 transition-all duration-200"
          >
            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-650 dark:text-zinc-400">
              <CalendarDays className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Contactos Directos
              </p>
              <h3 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 mt-1 tracking-tight font-mono">
                {metrics.totalConnections}
              </h3>
            </div>
            <div className="flex items-center text-zinc-500 dark:text-zinc-400 gap-1 mt-auto font-semibold text-xs transition-colors group-hover:text-zinc-950 dark:group-hover:text-zinc-100">
              <span>Buscar talento local</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>

      </section>

      {/* Activity Feed Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight md:text-lg">
            Feed de Actividad Reciente
          </h3>
          <Link href="/dashboard/company/applications">
            <Button 
              variant="ghost" 
              className="text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition-all h-8 rounded-lg"
            >
              Ver todo
            </Button>
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-border/10 rounded-xl overflow-hidden shadow-none">
          {recentActivities.length === 0 ? (
            <div className="text-center py-16 px-4 text-zinc-400 bg-white dark:bg-zinc-900">
              <Users className="size-12 stroke-[1.2] mx-auto mb-4 text-zinc-200 dark:text-zinc-800" />
              <p className="text-sm font-semibold">No hay postulaciones recientes</p>
              <p className="text-xs mt-1 max-w-sm mx-auto text-zinc-400">
                Tus vacantes activas no han recibido postulaciones en los últimos días. ¡Usa el botón flotante para publicar otra oferta exprés!
              </p>
            </div>
          ) : (
            <>
              {/* Feed Header */}
              <div className="hidden sm:grid grid-cols-12 px-8 py-3 bg-zinc-50/50 dark:bg-zinc-850/50 border-b border-border/10">
                <div className="col-span-6 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CANDIDATO</div>
                <div className="col-span-4 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">HABILIDADES</div>
                <div className="col-span-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-right">TIEMPO</div>
              </div>

              {/* List Items */}
              <div className="divide-y divide-border/10">
                {recentActivities.map((act) => (
                  <Link 
                    key={act.id}
                    href="/dashboard/company/applications"
                    className="no-underline block"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 px-6 sm:px-8 py-5 items-center hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors cursor-pointer group gap-4 sm:gap-0">
                      <div className="col-span-12 sm:col-span-6 flex items-center gap-4">
                        <img 
                          alt={act.candidateName} 
                          className="w-10 h-10 rounded-full object-cover border border-border/10 shadow-none" 
                          src={act.candidateAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"} 
                        />
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 transition-colors">
                            {act.candidateName}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                            {act.candidateHeadline} <span className="text-zinc-400 dark:text-zinc-500 font-semibold">• Postuló a {act.vacancyTitle}</span>
                          </p>
                        </div>
                      </div>
                      <div className="col-span-12 sm:col-span-4 flex flex-wrap gap-1.5">
                        {act.skills.length === 0 ? (
                          <span className="text-xs text-zinc-450 italic">Sin habilidades registradas</span>
                        ) : (
                          act.skills.map((skill: string) => (
                            <span key={skill} className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-350 text-[9px] font-bold rounded-md uppercase tracking-wider border border-border/10">
                              {skill}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="col-span-12 sm:col-span-2 text-left sm:text-right font-mono text-xs text-zinc-400 dark:text-zinc-500">
                        <p className="font-semibold">
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
        className="fixed bottom-20 md:bottom-10 right-10 z-50 group"
        onClick={() => toast.info("Abriendo publicador...", { description: "Preparando formulario de nueva vacante." })}
      >
        <Button className="bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-5 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200 active:scale-[0.98] h-auto border-none">
          <Plus className="size-5" />
          <span className="font-bold tracking-tight text-xs md:text-sm">Publicar Nueva Vacante</span>
        </Button>
      </Link>

    </div>
  )
}
