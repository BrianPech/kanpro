"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  TrendingUp, 
  MoreVertical, 
  Download, 
  ClipboardList, 
  MapPin, 
  ArrowRight,
  Plus
} from "lucide-react"
import Link from "next/link"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DashboardMetrics {
  totalApplications: number
  pausedVacancies: number
  activeVacancies: number
  reviewingApplications: number
  totalConnections: number
}

interface AnalyticsData {
  weeklyAnalytics: {
    growthPercent: number
    average: number
    flowData: Array<{ day: string; candidatos: number }>
  }
  monthlyAnalytics: {
    goalPercent: number
    pieData: Array<{ name: string; value: number; color: string }>
  }
}

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

export interface DashboardViewProps {
  companyName?: string
  metrics: DashboardMetrics
  analytics?: AnalyticsData
  weeklyAnalytics?: {
    growthPercent: number
    average: number
    flowData: Array<{ day: string; candidatos: number }>
  }
  monthlyAnalytics?: {
    goalPercent: number
    pieData: Array<{ name: string; value: number; color: string }>
  }
  publishedVacancies?: Array<{
    id: string
    title: string
    category: string
    zone?: string
    location?: string
    salary_min?: number
    salary_max?: number
    is_active?: boolean
    applicationsCount?: number
  }>
  latestVacancies?: Array<{
    id: string
    title: string
    category: string
    zone?: string
    location?: string
    salary_min?: number
    salary_max?: number
    is_active?: boolean
    applicationsCount?: number
  }>
  todos?: TodoItem[]
  pendingTasks?: TodoItem[]
  recentActivities?: any[]
}

const DEFAULT_TODOS: TodoItem[] = [
  { id: "1", text: "Publicar tu primera oferta de empleo activa", completed: false },
  { id: "2", text: "Verificar información de contacto de K'anPro", completed: true },
  { id: "3", text: "Completar perfil corporativo con logotipo", completed: false },
]

export function DashboardView({
  metrics,
  analytics,
  weeklyAnalytics: directWeekly,
  monthlyAnalytics: directMonthly,
  publishedVacancies = [],
  latestVacancies = [],
  todos: initialTodos,
  pendingTasks
}: DashboardViewProps) {
  const [todos, setTodos] = useState<TodoItem[]>(pendingTasks || initialTodos || DEFAULT_TODOS)
  const [mounted, setMounted] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const handleDownloadReport = () => {
    setIsDownloading(true)
    setTimeout(() => {
      setIsDownloading(false)
      toast.success("Reporte generado con éxito", {
        description: "El resumen mensual de reclutamiento ha sido descargado."
      })
    }, 1200)
  }

  const weeklyAnalytics = directWeekly || analytics?.weeklyAnalytics || {
    growthPercent: 0,
    average: 0,
    flowData: []
  }
  const monthlyAnalytics = directMonthly || analytics?.monthlyAnalytics || {
    goalPercent: 0,
    pieData: [{ name: "Sin Vacantes", value: 100, color: "#7d99b3" }]
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 15 } }
  } as const

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        
        {/* HERO CARD - Resumen Global */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-card text-card-foreground border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[290px] relative overflow-hidden shadow-xs">
            
            {/* Top info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Resumen de Reclutamiento</span>
                <div className="flex gap-1">
                  <button className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer rounded-md hover:bg-muted" aria-label="Tendencia">
                    <TrendingUp className="size-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer rounded-md hover:bg-muted" aria-label="Opciones">
                    <MoreVertical className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-6">
                <div>
                  <h3 className="text-3xl sm:text-4xl font-[800] tracking-tight text-foreground font-sans leading-none">
                    {metrics.totalApplications ?? 0}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-1">Postulaciones Totales</p>
                </div>
                <div className="border-l border-border h-10 my-auto" />
                <div>
                  <h3 className="text-3xl sm:text-4xl font-[800] tracking-tight text-foreground font-sans leading-none">
                    {metrics.pausedVacancies ?? 0}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-1">Vacantes Pausadas</p>
                </div>
              </div>
            </div>

            {/* Bottom floating cards */}
            <div className="grid grid-cols-3 gap-2 mt-auto relative z-10 pt-3">
              <div className="bg-muted/70 text-foreground rounded-xl p-2.5 shadow-2xs border border-border/40 flex flex-col justify-between">
                <span className="text-[15px] font-[800] leading-none font-sans text-foreground">{metrics.activeVacancies ?? 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground mt-1 leading-tight">Activas</span>
              </div>
              <div className="bg-muted/70 text-foreground rounded-xl p-2.5 shadow-2xs border border-border/40 flex flex-col justify-between">
                <span className="text-[15px] font-[800] leading-none font-sans text-foreground">{metrics.reviewingApplications ?? 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground mt-1 leading-tight">En Revisión</span>
              </div>
              <div className="bg-muted/70 text-foreground rounded-xl p-2.5 shadow-2xs border border-border/40 flex flex-col justify-between">
                <span className="text-[15px] font-[800] leading-none font-sans text-foreground">{metrics.totalConnections ?? 0}</span>
                <span className="text-[10px] font-bold text-muted-foreground mt-1 leading-tight">Contratados</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* CHART CARD 1 - Flujo Semanal */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-card text-card-foreground border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[290px] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-[14px] font-bold text-foreground">Flujo Semanal</h4>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Nuevos Candidatos</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 border-none font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span>
                  {weeklyAnalytics.growthPercent >= 0
                    ? `+${weeklyAnalytics.growthPercent}%`
                    : `${weeklyAnalytics.growthPercent}%`}
                </span>
              </Badge>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-32 w-full mt-2 flex items-end">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyAnalytics.flowData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCandidatos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-fiord-500)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-fiord-500)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: "currentColor", fontSize: 10, fontWeight: 600 }} 
                      className="text-muted-foreground"
                      tickFormatter={(val) => val.substring(0, 1)}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "currentColor", fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "10px", 
                        backgroundColor: "var(--card)", 
                        borderColor: "var(--border)",
                        color: "var(--card-foreground)",
                        fontSize: "11px",
                        fontWeight: "700"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="candidatos" 
                      stroke="var(--color-fiord-500)" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorCandidatos)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground font-semibold text-xs">Cargando gráfico...</div>
              )}
            </div>

            <div className="flex justify-between items-center mt-2 text-[11px] text-muted-foreground font-semibold px-0.5">
              <span>Lun - Dom</span>
              <span className="text-foreground font-bold">
                Promedio: {weeklyAnalytics.average} cand./día
              </span>
            </div>
          </Card>
        </motion.div>

        {/* CHART CARD 2 - Efectividad del Mes */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-card text-card-foreground border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[290px] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-[14px] font-bold text-foreground">Efectividad del Mes</h4>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Meta de Contratación</p>
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1 cursor-pointer rounded-md hover:bg-muted" aria-label="Estadísticas">
                <TrendingUp className="size-4" />
              </button>
            </div>

            {/* Recharts Pie Chart & Legend Grid */}
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="relative size-28 shrink-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monthlyAnalytics.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={42}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {monthlyAnalytics.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-bold text-foreground font-mono leading-none">
                    {monthlyAnalytics.goalPercent}%
                  </span>
                  <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">Meta</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex-1 space-y-1.5 px-1">
                {monthlyAnalytics.pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground font-medium truncate max-w-[90px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions button */}
            <Button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl h-9 flex items-center justify-center gap-1.5 border-none transition-all cursor-pointer shadow-xs mt-2"
            >
              <Download className="size-3.5" />
              <span>{isDownloading ? "Preparando..." : "Descargar Reporte"}</span>
            </Button>
          </Card>
        </motion.div>

        {/* CHECKLIST CARD - Pendientes */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-card text-card-foreground border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[290px] shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <ClipboardList className="size-4" />
                  </div>
                  <h4 className="text-[14px] font-bold text-foreground">Pendientes del día</h4>
                </div>
                <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold text-[10px] px-2 py-0.5 rounded-md">
                  {todos.filter(t => !t.completed).length} Hoy
                </Badge>
              </div>

              <div className="space-y-2 mt-3">
                {todos.map(todo => (
                  <div 
                    key={todo.id} 
                    className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={todo.id}
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                      className="mt-0.5 size-4 rounded-md cursor-pointer"
                    />
                    <label 
                      htmlFor={todo.id}
                      className={`text-[12px] leading-snug font-medium cursor-pointer transition-all select-none
                        ${todo.completed 
                          ? "text-muted-foreground line-through font-normal" 
                          : "text-foreground"
                        }`}
                    >
                      {todo.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold border-t border-border/60 pt-2.5">
              <span className="font-bold text-foreground">
                {todos.length > 0
                  ? `${Math.round((todos.filter(t => t.completed).length / todos.length) * 100)}% Listo`
                  : "100% Listo"}
              </span>
              <button 
                onClick={() => {
                  setTodos(prev => prev.map(t => ({ ...t, completed: true })))
                  toast.success("¡Todas las tareas completadas!")
                }} 
                className="text-primary font-bold hover:underline transition-colors cursor-pointer"
              >
                Completar todo
              </button>
            </div>
          </Card>
        </motion.div>

        {/* UNIFIED VACANCIES SECTION */}
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-0.5">
              <h4 className="text-[16px] sm:text-[17px] font-[800] text-foreground tracking-[-0.2px]">
                Vacantes Activas y Recientes
              </h4>
              <p className="text-[11px] text-muted-foreground font-semibold">
                Gestión de ofertas publicadas y progreso de postulaciones locales
              </p>
            </div>
            <Link 
              href="/dashboard/company/vacancies" 
              className="text-[12px] font-extrabold text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              Ver todas <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Create Vacancy Action Card */}
            <Link href="/dashboard/company/vacancies/new" className="min-h-[140px]">
              <Card className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-2xl p-4 flex flex-col items-center justify-center h-full text-center group cursor-pointer transition-all duration-200">
                <div className="size-9 rounded-full border border-border bg-card text-foreground flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  <Plus className="size-5" />
                </div>
                <h5 className="text-[13px] font-bold text-foreground mt-2">Crear Nueva Vacante</h5>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5 max-w-[180px] mx-auto leading-tight">
                  Publica una oferta exprés en Mérida y Riviera Maya
                </p>
              </Card>
            </Link>

            {/* Display up to 3 vacancies */}
            {(() => {
              const displayVacancies = publishedVacancies.length > 0 ? publishedVacancies : latestVacancies;
              return displayVacancies.slice(0, 3).map((vac) => {
                const formattedSalary =
                  vac.salary_min && vac.salary_max
                    ? `$${vac.salary_min.toLocaleString("es-MX")} - $${vac.salary_max.toLocaleString("es-MX")}`
                    : vac.salary_min
                    ? `Desde $${vac.salary_min.toLocaleString("es-MX")}`
                    : vac.salary_max
                    ? `Hasta $${vac.salary_max.toLocaleString("es-MX")}`
                    : "A convenir";

                const appCount = vac.applicationsCount ?? 0;

                return (
                  <Link key={vac.id} href={`/dashboard/company/vacancies/${vac.id}`} className="block">
                    <Card className="bg-card text-card-foreground border border-border/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-primary/40 transition-all duration-200 h-full">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] px-2 py-0.5 rounded-md font-semibold">
                            {vac.category || "General"}
                          </Badge>
                          <Badge
                            className={cn(
                              "font-extrabold text-[9px] px-2 py-0.5 rounded-full border-none",
                              vac.is_active !== false
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {vac.is_active !== false ? "Activa" : "Pausada"}
                          </Badge>
                        </div>
                        <h5 className="text-[14px] font-bold tracking-tight text-foreground line-clamp-1">
                          {vac.title}
                        </h5>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{vac.zone || vac.location || "Mérida"}</span>
                          <span>•</span>
                          <span className="text-foreground font-bold">{formattedSalary} MXN</span>
                        </div>
                      </div>

                      {/* Applicants Indicator */}
                      <div className="flex flex-col items-center justify-center rounded-xl bg-muted/60 px-2.5 py-1.5 shrink-0 border border-border/40">
                        <span className="text-[14px] font-bold font-mono text-foreground leading-none">{appCount}</span>
                        <span className="text-[8px] text-muted-foreground uppercase tracking-wider font-extrabold mt-0.5">Postulantes</span>
                      </div>
                    </Card>
                  </Link>
                );
              });
            })()}

            {latestVacancies.length === 0 && publishedVacancies.length === 0 && (
              <div className="col-span-2 text-center py-4 text-muted-foreground text-xs font-medium">
                Aún no has publicado vacantes.
              </div>
            )}
          </div>
        </motion.div>
        
      </motion.div>
    </div>
  )
}
