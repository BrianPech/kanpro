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
    pieData: [{ name: "Sin Vacantes", value: 100, color: "#94a3b8" }]
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  } as const

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        
        {/* HERO CARD - Resumen Global (Fiord 950 Dark theme) */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <div className="bg-[#1f2732] dark:bg-fiord-950 text-white rounded-[28px] p-6 sm:p-7 flex flex-col justify-between min-h-[370px] relative overflow-hidden shadow-md">
            
            {/* Top info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold uppercase tracking-[0.16em] text-fiord-300">Resumen de Reclutamiento</span>
                <div className="flex gap-2">
                  <button className="text-fiord-300 hover:text-white p-1.5 transition-colors cursor-pointer" aria-label="Tendencia">
                    <TrendingUp className="size-5" />
                  </button>
                  <button className="text-fiord-300 hover:text-white p-1.5 transition-colors cursor-pointer" aria-label="Opciones">
                    <MoreVertical className="size-5" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex gap-8">
                <div>
                  <h3 className="text-5xl sm:text-6xl font-[800] tracking-tight text-white font-sans">
                    {metrics.totalApplications ?? 0}
                  </h3>
                  <p className="text-[13px] text-fiord-300 font-bold mt-1.5">Postulaciones Totales</p>
                </div>
                <div className="border-l border-fiord-800 h-16 my-auto" />
                <div>
                  <h3 className="text-5xl sm:text-6xl font-[800] tracking-tight text-white font-sans">
                    {metrics.pausedVacancies ?? 0}
                  </h3>
                  <p className="text-[13px] text-fiord-300 font-bold mt-1.5">Vacantes Pausadas</p>
                </div>
              </div>
            </div>

            {/* Bottom floating cards */}
            <div className="grid grid-cols-3 gap-3 mt-auto relative z-10 pt-4">
              <div className="bg-white text-fiord-950 rounded-2xl p-3.5 border border-fiord-100 flex flex-col justify-between">
                <span className="text-[18px] font-[800] leading-none font-sans text-fiord-950">{metrics.activeVacancies ?? 0}</span>
                <span className="text-[11px] font-bold text-fiord-500 mt-2 leading-tight">Activas</span>
              </div>
              <div className="bg-white text-fiord-950 rounded-2xl p-3.5 border border-fiord-100 flex flex-col justify-between">
                <span className="text-[18px] font-[800] leading-none font-sans text-fiord-950">{metrics.reviewingApplications ?? 0}</span>
                <span className="text-[11px] font-bold text-fiord-500 mt-2 leading-tight">En Revisión</span>
              </div>
              <div className="bg-white text-fiord-950 rounded-2xl p-3.5 border border-fiord-100 flex flex-col justify-between">
                <span className="text-[18px] font-[800] leading-none font-sans text-fiord-950">{metrics.totalConnections ?? 0}</span>
                <span className="text-[11px] font-bold text-fiord-500 mt-2 leading-tight">Contratados</span>
              </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute -bottom-10 -left-10 size-40 bg-fiord-800 rounded-full blur-[60px] opacity-40 pointer-events-none" />
          </div>
        </motion.div>

        {/* CHART CARD 1 - Flujo Semanal (Light Theme) */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[28px] p-6 flex flex-col justify-between min-h-[370px] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-[16px] font-bold text-fiord-900 dark:text-fiord-100">Flujo Semanal</h4>
                <p className="text-[12px] text-fiord-400 dark:text-fiord-400 font-bold uppercase tracking-wider">Nuevos Candidatos</p>
              </div>
              <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 border-none font-extrabold text-xs px-3 py-1 rounded-full flex items-center gap-0.5">
                <span>
                  {weeklyAnalytics.growthPercent >= 0
                    ? `+${weeklyAnalytics.growthPercent}%`
                    : `${weeklyAnalytics.growthPercent}%`}
                </span>
              </Badge>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-44 w-full mt-4 flex items-end">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyAnalytics.flowData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCandidatos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5c7c9b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#5c7c9b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: "#7d99b3", fontSize: 11, fontWeight: 600 }} 
                      tickFormatter={(val) => val.substring(0, 1)}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7d99b3", fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "14px", 
                        backgroundColor: "#1f2732", 
                        borderColor: "#2f3c4b",
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: "700"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="candidatos" 
                      stroke="#5c7c9b" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorCandidatos)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-fiord-300 font-semibold text-sm">Cargando gráfico...</div>
              )}
            </div>

            <div className="flex justify-between items-center mt-3 text-[12px] text-fiord-400 dark:text-fiord-400 font-semibold px-1">
              <span>Lun - Dom</span>
              <span className="text-fiord-800 dark:text-fiord-200 font-bold">
                Promedio: {weeklyAnalytics.average} candidatos/día
              </span>
            </div>
          </Card>
        </motion.div>

        {/* CHART CARD 2 - Efectividad del Mes (Light Theme) */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[28px] p-6 flex flex-col justify-between min-h-[370px] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-[16px] font-bold text-fiord-900 dark:text-fiord-100">Efectividad del Mes</h4>
                <p className="text-[12px] text-fiord-400 dark:text-fiord-400 font-bold uppercase tracking-wider">Meta de Contratación</p>
              </div>
              <button className="text-fiord-400 hover:text-fiord-900 dark:hover:text-fiord-100 p-1.5 cursor-pointer" aria-label="Estadísticas">
                <TrendingUp className="size-5" />
              </button>
            </div>

            {/* Recharts Pie Chart & Legend Grid */}
            <div className="flex items-center justify-between gap-3 mt-2">
              <div className="relative size-36 shrink-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={monthlyAnalytics.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={52}
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
                  <span className="text-xl font-bold text-fiord-900 dark:text-fiord-100 font-mono leading-none">
                    {monthlyAnalytics.goalPercent}%
                  </span>
                  <span className="text-[9px] text-fiord-400 uppercase tracking-widest font-bold mt-0.5">Meta</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex-1 space-y-2.5 px-1">
                {monthlyAnalytics.pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-fiord-700 dark:text-fiord-300 font-semibold">{item.name}</span>
                    </div>
                    <span className="font-bold text-fiord-900 dark:text-fiord-100">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions button */}
            <Button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="w-full bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#253240] dark:hover:bg-zinc-200 font-bold text-sm rounded-[14px] h-12 flex items-center justify-center gap-2 border-none transition-all cursor-pointer shadow-xs"
            >
              <Download className="size-4" />
              <span>{isDownloading ? "Preparando..." : "Descargar Reporte"}</span>
            </Button>
          </Card>
        </motion.div>

        {/* CHECKLIST CARD - Pendientes (Light Theme) */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[28px] p-6 flex flex-col justify-between min-h-[370px] shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-fiord-100 dark:bg-fiord-800 text-fiord-950 dark:text-fiord-50 flex items-center justify-center">
                    <ClipboardList className="size-4.5" />
                  </div>
                  <h4 className="text-[16px] font-bold text-fiord-900 dark:text-fiord-100">Pendientes del día</h4>
                </div>
                <Badge className="bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 border-none font-bold text-[11px] px-2.5 py-1 rounded-lg">
                  {todos.filter(t => !t.completed).length} Hoy
                </Badge>
              </div>

              <div className="space-y-3.5 mt-4">
                {todos.map(todo => (
                  <div 
                    key={todo.id} 
                    className="flex items-start gap-3.5 p-2.5 rounded-xl hover:bg-fiord-50/50 dark:hover:bg-fiord-800/30 transition-colors"
                  >
                    <Checkbox
                      id={todo.id}
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                      className="mt-0.5 size-5 rounded-md border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-[#1f2732] dark:data-[state=checked]:bg-zinc-100 data-[state=checked]:text-white dark:data-[state=checked]:text-zinc-900 cursor-pointer"
                    />
                    <label 
                      htmlFor={todo.id}
                      className={`text-[14px] leading-snug font-semibold cursor-pointer transition-all select-none
                        ${todo.completed 
                          ? "text-fiord-500/70 dark:text-fiord-400/60 line-through font-medium" 
                          : "text-fiord-800 dark:text-fiord-200"
                        }`}
                    >
                      {todo.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] text-fiord-400 dark:text-fiord-400 font-semibold border-t border-fiord-100/50 dark:border-fiord-800/50 pt-3.5">
              <span className="font-bold">
                {todos.length > 0
                  ? `${Math.round((todos.filter(t => t.completed).length / todos.length) * 100)}% Completado`
                  : "100% Completado"}
              </span>
              <button 
                onClick={() => {
                  setTodos(prev => prev.map(t => ({ ...t, completed: true })))
                  toast.success("¡Todas las tareas completadas!")
                }} 
                className="text-[#5c7c9b] dark:text-zinc-300 font-bold hover:underline transition-colors cursor-pointer"
              >
                Completar todo
              </button>
            </div>
          </Card>
        </motion.div>

        {/* UNIFIED VACANCIES SECTION - Single Consolidated Section */}
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h4 className="text-[18px] sm:text-[20px] font-[800] text-fiord-900 dark:text-fiord-100 tracking-[-0.3px]">
                Vacantes Activas y Recientes
              </h4>
              <p className="text-[13px] text-fiord-400 dark:text-fiord-500 font-semibold">
                Gestión de ofertas publicadas y progreso de postulaciones locales
              </p>
            </div>
            <Link 
              href="/dashboard/company/vacancies" 
              className="text-[13px] font-extrabold text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
            >
              Ver todas las vacantes <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Create Vacancy Action Card */}
            <Link href="/dashboard/company/vacancies/new" className="min-h-[200px]">
              <Card className="border-2 border-dashed border-fiord-200 dark:border-fiord-800 hover:border-fiord-400 dark:hover:border-fiord-600 bg-fiord-50/20 dark:bg-fiord-900/10 rounded-[26px] p-6 flex flex-col items-center justify-center h-full text-center group cursor-pointer transition-all duration-300 hover:bg-fiord-50/45">
                <div className="size-12 rounded-full border border-fiord-100 dark:border-fiord-850 bg-white dark:bg-fiord-950 text-fiord-900 dark:text-fiord-50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Plus className="size-6" />
                </div>
                <h5 className="text-[15px] font-bold text-fiord-900 dark:text-fiord-100 mt-3">Crear Nueva Vacante</h5>
                <p className="text-[12px] text-fiord-400 dark:text-fiord-500 font-medium mt-0.5 max-w-[180px] mx-auto leading-relaxed">
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
                    <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[26px] p-6 flex items-center justify-between gap-4 shadow-sm hover:border-fiord-200 dark:hover:border-fiord-700 transition-all duration-300 h-full">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-fiord-50 dark:bg-fiord-800 text-fiord-700 dark:text-fiord-300 border-none font-bold text-[10px] px-2.5 py-1 rounded-md">
                            {vac.category || "General"}
                          </Badge>
                          <Badge
                            className={cn(
                              "font-extrabold text-[9px] px-2 py-0.5 rounded-full border-none",
                              vac.is_active !== false
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-fiord-100 text-fiord-600 dark:bg-fiord-800 dark:text-fiord-400"
                            )}
                          >
                            {vac.is_active !== false ? "Activa" : "Pausada"}
                          </Badge>
                        </div>
                        <h5 className="text-[16px] sm:text-[17px] font-bold tracking-tight text-fiord-900 dark:text-fiord-50 line-clamp-1">
                          {vac.title}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-fiord-400 dark:text-fiord-500 font-bold">
                          <MapPin className="size-3 text-fiord-400" />
                          <span>{vac.zone || vac.location || "Mérida"}</span>
                          <span>•</span>
                          <span className="text-fiord-700 dark:text-fiord-300 font-semibold">{formattedSalary} MXN</span>
                        </div>
                      </div>

                      {/* Progress wheel SVG */}
                      <div className="relative size-16 shrink-0 flex items-center justify-center">
                        <svg className="size-full transform -rotate-90">
                          <circle cx="32" cy="32" r="24" stroke="#ebeef3" strokeWidth="5" fill="transparent" className="dark:stroke-fiord-800" />
                          <circle
                            cx="32"
                            cy="32"
                            r="24"
                            stroke="#5c7c9b"
                            strokeWidth="5"
                            fill="transparent"
                            strokeDasharray="150"
                            strokeDashoffset={Math.max(0, 150 - Math.min(appCount, 10) * 15)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-[12px] font-bold font-mono text-fiord-900 dark:text-fiord-100">{appCount}</span>
                          <span className="text-[7px] text-fiord-400 dark:text-fiord-500 uppercase tracking-widest font-extrabold">Postulantes</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              });
            })()}

            {latestVacancies.length === 0 && publishedVacancies.length === 0 && (
              <div className="col-span-2 text-center py-6 text-fiord-400 dark:text-fiord-500 text-sm font-semibold">
                Aún no has publicado vacantes. Tus ofertas creadas se mostrarán aquí.
              </div>
            )}
          </div>
        </motion.div>
        
      </motion.div>
    </div>
  )
}
