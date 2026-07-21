"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { 
  Briefcase, 
  Users, 
  Clock, 
  Download, 
  Plus, 
  ArrowRight,
  MoreVertical,
  Bell,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  BriefcaseConveyorBelt,
  Sparkles,
  ClipboardList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import Link from "next/link"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts"

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

// Recharts Weekly Candidate Flow Data
const weeklyFlowData = [
  { day: "Lunes", candidatos: 12 },
  { day: "Martes", candidatos: 19 },
  { day: "Miércoles", candidatos: 15 },
  { day: "Jueves", candidatos: 28 },
  { day: "Viernes", candidatos: 22 },
  { day: "Sábado", candidatos: 34 },
  { day: "Domingo", candidatos: 30 }
]

// Recharts Monthly Donut Effectiveness Data
const pieData = [
  { name: "Operativo", value: 60, color: "#3e546d" }, // Fiord 700
  { name: "Comercial", value: 30, color: "#5c7c9b" }, // Fiord 500
  { name: "Servicio", value: 30, color: "#aabccf" }   // Fiord 300
]

export function DashboardView({ 
  companyName, 
  metrics = {
    activeVacancies: 28,
    totalApplications: 43,
    reviewingApplications: 14,
    totalConnections: 11
  },
  recentActivities = []
}: DashboardViewProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [todos, setTodos] = React.useState([
    { id: "todo-1", text: "Entrevista con Mesero para Playa del Carmen", completed: true },
    { id: "todo-2", text: "Confirmar vacante Recepcionista", completed: false },
    { id: "todo-3", text: "Revisar CVs para vacante de Hostess", completed: false },
    { id: "todo-4", text: "Enviar feedback a postulantes de Mérida", completed: false },
  ])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  } as const

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  } as const

  return (
    <div className="flex-grow min-h-screen bg-fiord-50/30 dark:bg-fiord-950/10 px-4 md:px-10 lg:px-12 py-8 space-y-8 max-w-[1400px] mx-auto w-full">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        
        {/* ========================================================================= */}
        {/* ROW 1: Hero Card (Overall Stats) & Visual Analytics Cards (Charts)        */}
        {/* ========================================================================= */}
        
        {/* HERO CARD - Resumen Global (Fiord 950 Dark theme) */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <div className="bg-fiord-950 text-white rounded-[28px] p-6 flex flex-col justify-between h-[360px] relative overflow-hidden shadow-md">
            
            {/* Top info */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-fiord-300">Resumen de Reclutamiento</span>
                <div className="flex gap-2">
                  <button className="text-fiord-300 hover:text-white p-1 transition-colors">
                    <TrendingUp className="size-4" />
                  </button>
                  <button className="text-fiord-300 hover:text-white p-1 transition-colors">
                    <MoreVertical className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex gap-8">
                <div>
                  <h3 className="text-5xl font-bold tracking-tight text-white font-sans">
                    {metrics.totalApplications || 43}
                  </h3>
                  <p className="text-[12px] text-fiord-300 font-medium mt-1">Postulaciones Totales</p>
                </div>
                <div className="border-l border-fiord-800 h-14 my-auto" />
                <div>
                  <h3 className="text-5xl font-bold tracking-tight text-white font-sans">
                    2
                  </h3>
                  <p className="text-[12px] text-fiord-300 font-medium mt-1">Vacantes Pausadas</p>
                </div>
              </div>
            </div>

            {/* Bottom floating cards */}
            <div className="grid grid-cols-3 gap-2.5 mt-auto relative z-10">
              <div className="bg-white text-fiord-950 rounded-2xl p-3 border border-fiord-100 flex flex-col justify-between">
                <span className="text-[16px] font-bold leading-none font-sans text-fiord-950">{metrics.activeVacancies || 28}</span>
                <span className="text-[9px] font-semibold text-fiord-500 mt-2 leading-tight">Activas</span>
              </div>
              <div className="bg-white text-fiord-950 rounded-2xl p-3 border border-fiord-100 flex flex-col justify-between">
                <span className="text-[16px] font-bold leading-none font-sans text-fiord-950">{metrics.reviewingApplications || 14}</span>
                <span className="text-[9px] font-semibold text-fiord-500 mt-2 leading-tight">En Revisión</span>
              </div>
              <div className="bg-white text-fiord-950 rounded-2xl p-3 border border-fiord-100 flex flex-col justify-between">
                <span className="text-[16px] font-bold leading-none font-sans text-fiord-950">{metrics.totalConnections || 11}</span>
                <span className="text-[9px] font-semibold text-fiord-500 mt-2 leading-tight">Contratados</span>
              </div>
            </div>
            
            {/* Background Glow */}
            <div className="absolute -bottom-10 -left-10 size-40 bg-fiord-800 rounded-full blur-[60px] opacity-40 pointer-events-none" />
          </div>
        </motion.div>

        {/* CHART CARD 1 - Flujo Semanal (Light Theme) */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[28px] p-6 flex flex-col justify-between h-[360px] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-[14px] font-bold text-fiord-900 dark:text-fiord-100">Flujo Semanal</h4>
                <p className="text-[11px] text-fiord-400 dark:text-fiord-400 font-semibold uppercase tracking-wider">Nuevos Candidatos</p>
              </div>
              <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 border-none font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-0.5">
                <span>+24%</span>
              </Badge>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-44 w-full mt-4 flex items-end">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyFlowData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
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
                      tick={{ fill: "#7d99b3", fontSize: 10, fontWeight: 550 }} 
                      tickFormatter={(val) => val.substring(0, 1)}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7d99b3", fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "12px", 
                        backgroundColor: "#1f2732", 
                        borderColor: "#2f3c4b",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: "600"
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
                <div className="h-full w-full flex items-center justify-center text-fiord-300">Cargando gráfico...</div>
              )}
            </div>

            <div className="flex justify-between items-center mt-3 text-[11px] text-fiord-400 dark:text-fiord-400 font-semibold px-1">
              <span>Lun - Dom</span>
              <span className="text-fiord-800 dark:text-fiord-200">Promedio: 22 candidatos/día</span>
            </div>
          </Card>
        </motion.div>

        {/* CHART CARD 2 - Efectividad del Mes (Light Theme) */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[28px] p-6 flex flex-col justify-between h-[360px] shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-[14px] font-bold text-fiord-900 dark:text-fiord-100">Efectividad del Mes</h4>
                <p className="text-[11px] text-fiord-400 dark:text-fiord-400 font-semibold uppercase tracking-wider">Meta de Contratación</p>
              </div>
              <button className="text-fiord-400 hover:text-fiord-900 dark:hover:text-fiord-100 p-1">
                <TrendingUp className="size-4" />
              </button>
            </div>

            {/* Recharts Pie Chart & Legend Grid */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="relative size-32 shrink-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={48}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold text-fiord-900 dark:text-fiord-555 font-mono leading-none">120%</span>
                  <span className="text-[8px] text-fiord-400 uppercase tracking-widest mt-1 font-bold">Meta</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="flex-1 space-y-2 px-1">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-fiord-700 dark:text-fiord-300 font-medium">{item.name}</span>
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
              className="w-full bg-fiord-50 hover:bg-fiord-100 dark:bg-fiord-800 dark:hover:bg-fiord-800/80 text-fiord-900 dark:text-fiord-100 font-bold text-xs rounded-xl h-10 flex items-center justify-center gap-2 border border-fiord-100/50 dark:border-fiord-700"
            >
              <Download className="size-3.5" />
              <span>{isDownloading ? "Preparando..." : "Descargar Reporte"}</span>
            </Button>
          </Card>
        </motion.div>

        {/* ========================================================================= */}
        {/* ROW 2: Checklist Card & In-Progress Vacancies Cards                       */}
        {/* ========================================================================= */}

        {/* CHECKLIST CARD - Pendientes (Light Theme) */}
        <motion.div variants={cardVariants} className="lg:col-span-1">
          <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[28px] p-6 flex flex-col justify-between h-[360px] shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-fiord-100 dark:bg-fiord-800 text-fiord-950 dark:text-fiord-50 flex items-center justify-center">
                    <ClipboardList className="size-4" />
                  </div>
                  <h4 className="text-[14px] font-bold text-fiord-900 dark:text-fiord-100">Pendientes del día</h4>
                </div>
                <Badge className="bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 border-none font-bold text-[10px] px-2 py-0.5 rounded-md">
                  {todos.filter(t => !t.completed).length} Hoy
                </Badge>
              </div>

              <div className="space-y-3 mt-4">
                {todos.map(todo => (
                  <div 
                    key={todo.id} 
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-fiord-50/50 dark:hover:bg-fiord-800/30 transition-colors"
                  >
                    <Checkbox
                      id={todo.id}
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                      className="mt-0.5 rounded-md border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50 data-[state=checked]:text-white dark:data-[state=checked]:text-fiord-950"
                    />
                    <label 
                      htmlFor={todo.id}
                      className={`text-[12.5px] leading-tight font-medium cursor-pointer transition-all select-none
                        ${todo.completed 
                          ? "text-fiord-500/70 dark:text-fiord-400/60 line-through font-normal" 
                          : "text-fiord-700 dark:text-fiord-200"
                        }`}
                    >
                      {todo.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-fiord-400 dark:text-fiord-400 font-semibold border-t border-fiord-100/50 dark:border-fiord-800/50 pt-3">
              <span>{Math.round((todos.filter(t => t.completed).length / todos.length) * 100)}% Completado</span>
              <button 
                onClick={() => {
                  setTodos(prev => prev.map(t => ({ ...t, completed: true })))
                  toast.success("¡Todas las tareas completadas!")
                }} 
                className="text-fiord-600 dark:text-fiord-400 hover:text-fiord-950 dark:hover:text-fiord-200 transition-colors"
              >
                Completar todo
              </button>
            </div>
          </Card>
        </motion.div>

        {/* IN-PROGRESS VACANCIES GRID - 2/3 Width container */}
        <motion.div variants={cardVariants} className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[14px] font-bold text-fiord-900 dark:text-fiord-100">Vacantes en Proceso</h4>
            <Link 
              href="/dashboard/company/vacancies" 
              className="text-[11px] font-bold text-fiord-500 hover:text-fiord-900 dark:hover:text-fiord-300 flex items-center gap-0.5 transition-colors"
            >
              Ver todas las vacantes <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Vacancy Card 1 */}
            <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[24px] p-5 flex flex-col justify-between h-[300px] shadow-sm relative group hover:border-fiord-200 dark:hover:border-fiord-700 transition-all duration-200">
              <div>
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-fiord-50 dark:bg-fiord-800 text-fiord-900 dark:text-fiord-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Briefcase className="size-5" />
                  </div>
                  <button className="text-fiord-350 hover:text-fiord-900 dark:hover:text-fiord-100 p-1">
                    <MoreVertical className="size-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-1">
                  <h5 className="text-[14px] font-bold text-fiord-900 dark:text-fiord-50 line-clamp-1 leading-snug">Mesero de Playa</h5>
                  <p className="text-[11px] text-fiord-400 dark:text-fiord-400 font-semibold uppercase tracking-wider">Hotel Marina Riviera</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge className="bg-fiord-50 dark:bg-fiord-800 text-fiord-700 dark:text-fiord-300 hover:bg-fiord-100 border-none font-bold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <MapPin className="size-2.5" />
                    <span>Playa del Carmen</span>
                  </Badge>
                  <Badge className="bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 hover:bg-fiord-950 border-none font-bold text-[9px] px-2.5 py-0.5 rounded-full">
                    Sueldo Base + Propinas
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-fiord-100/50 dark:border-fiord-800/50 pt-4">
                <span className="text-[10px] text-fiord-400 dark:text-fiord-500 font-bold uppercase tracking-wider">Sueldo: $12,500 MXN</span>
                <button className="size-8 rounded-full bg-fiord-950 dark:bg-fiord-50 hover:bg-fiord-900 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                  <Bell className="size-3.5" />
                </button>
              </div>
            </Card>

            {/* Vacancy Card 2 */}
            <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[24px] p-5 flex flex-col justify-between h-[300px] shadow-sm relative group hover:border-fiord-200 dark:hover:border-fiord-700 transition-all duration-200">
              <div>
                <div className="flex justify-between items-start">
                  <div className="size-10 rounded-xl bg-fiord-50 dark:bg-fiord-800 text-fiord-900 dark:text-fiord-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Briefcase className="size-5" />
                  </div>
                  <button className="text-fiord-350 hover:text-fiord-900 dark:hover:text-fiord-100 p-1">
                    <MoreVertical className="size-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-1">
                  <h5 className="text-[14px] font-bold text-fiord-900 dark:text-fiord-50 line-clamp-1 leading-snug">Recepcionista Bilingüe</h5>
                  <p className="text-[11px] text-fiord-400 dark:text-fiord-400 font-semibold uppercase tracking-wider">Corporate Hub Mérida</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge className="bg-fiord-50 dark:bg-fiord-800 text-fiord-700 dark:text-fiord-300 hover:bg-fiord-100 border-none font-bold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <MapPin className="size-2.5" />
                    <span>Mérida</span>
                  </Badge>
                  <Badge className="bg-fiord-50 dark:bg-fiord-800 text-fiord-700 dark:text-fiord-300 hover:bg-fiord-100 border-none font-bold text-[9px] px-2.5 py-0.5 rounded-full">
                    Completo
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-fiord-100/50 dark:border-fiord-800/50 pt-4">
                <span className="text-[10px] text-fiord-400 dark:text-fiord-500 font-bold uppercase tracking-wider">Sueldo: $14,000 MXN</span>
                <button className="size-8 rounded-full bg-fiord-950 dark:bg-fiord-50 hover:bg-fiord-900 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 flex items-center justify-center shadow-sm active:scale-95 transition-all">
                  <Bell className="size-3.5" />
                </button>
              </div>
            </Card>

            {/* Dashed Action Card - Crear Vacante */}
            <Link href="/dashboard/company/vacancies/new" className="h-[300px]">
              <Card className="border-2 border-dashed border-fiord-200 dark:border-fiord-800 hover:border-fiord-400 dark:hover:border-fiord-600 bg-fiord-50/20 dark:bg-fiord-900/10 rounded-[24px] p-5 flex flex-col items-center justify-center h-full text-center group cursor-pointer transition-all duration-300 hover:bg-fiord-50/45">
                <div className="size-12 rounded-full border border-fiord-100 dark:border-fiord-850 bg-white dark:bg-fiord-950 text-fiord-900 dark:text-fiord-50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Plus className="size-6" />
                </div>
                <h5 className="text-[13.5px] font-bold text-fiord-900 dark:text-fiord-100 mt-4">Crear Vacante</h5>
                <p className="text-[11px] text-fiord-400 dark:text-fiord-500 mt-1 max-w-[160px] mx-auto leading-relaxed">Publica una nueva oferta exprés en la Riviera Maya</p>
              </Card>
            </Link>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* ROW 3: Horizontal bottom list: Últimas Vacantes Publicadas                 */}
        {/* ========================================================================= */}

        <motion.div variants={cardVariants} className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h4 className="text-[14px] font-bold text-fiord-900 dark:text-fiord-100">Últimas Vacantes Publicadas</h4>
              <p className="text-[11px] text-fiord-400 dark:text-fiord-500 font-medium">Progreso de postulaciones y reclutamiento local</p>
            </div>
            <Link 
              href="/dashboard/company/vacancies" 
              className="text-[11px] font-bold text-fiord-550 hover:text-fiord-900 dark:hover:text-fiord-350 transition-colors"
            >
              Ver historial
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Bottom Card 1 - Darker Theme */}
            <div className="bg-fiord-900 text-white rounded-[24px] p-5 flex items-center justify-between gap-4 shadow-sm relative overflow-hidden group hover:bg-fiord-950 transition-all duration-300">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-fiord-800 text-fiord-200 border-none font-bold text-[9px] px-2 py-0.5 rounded-md">Ventas</Badge>
                  <span className="text-[10px] text-fiord-300 font-bold uppercase tracking-wider">Mérida</span>
                </div>
                <h5 className="text-[14.5px] font-bold tracking-tight text-white line-clamp-1">Ejecutivo Comercial</h5>
                <p className="text-[11px] text-fiord-300 font-bold">$15,000 - $18,000 MXN</p>
              </div>

              {/* Progress wheel SVG */}
              <div className="relative size-16 shrink-0 flex items-center justify-center">
                <svg className="size-full transform -rotate-90">
                  <circle cx="32" cy="32" r="24" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="transparent" />
                  <circle cx="32" cy="32" r="24" stroke="#aabccf" strokeWidth="6" fill="transparent" strokeDasharray="150" strokeDashoffset="50" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold font-mono">2/3</span>
                  <span className="text-[6.5px] text-fiord-300 uppercase tracking-widest font-semibold">Vacantes</span>
                </div>
              </div>
            </div>

            {/* Bottom Card 2 - Light Theme */}
            <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[24px] p-5 flex items-center justify-between gap-4 shadow-sm hover:border-fiord-200 dark:hover:border-fiord-700 transition-all duration-300">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-fiord-50 dark:bg-fiord-800 text-fiord-700 dark:text-fiord-300 border-none font-bold text-[9px] px-2 py-0.5 rounded-md">Servicios</Badge>
                  <span className="text-[10px] text-fiord-400 dark:text-fiord-500 font-bold uppercase tracking-wider">Playa del Carmen</span>
                </div>
                <h5 className="text-[14.5px] font-bold tracking-tight text-fiord-900 dark:text-fiord-50 line-clamp-1">Recepcionista Spa</h5>
                <p className="text-[11px] text-fiord-500 dark:text-fiord-400 font-bold">$12,000 - $14,000 MXN</p>
              </div>

              {/* Progress wheel SVG */}
              <div className="relative size-16 shrink-0 flex items-center justify-center">
                <svg className="size-full transform -rotate-90">
                  <circle cx="32" cy="32" r="24" stroke="#ebeef3" strokeWidth="6" fill="transparent" className="dark:stroke-fiord-800" />
                  <circle cx="32" cy="32" r="24" stroke="#5c7c9b" strokeWidth="6" fill="transparent" strokeDasharray="150" strokeDashoffset="100" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold font-mono text-fiord-900 dark:text-fiord-100">1/3</span>
                  <span className="text-[6.5px] text-fiord-400 dark:text-fiord-500 uppercase tracking-widest font-semibold">Vacantes</span>
                </div>
              </div>
            </Card>

            {/* Bottom Card 3 - Light Theme */}
            <Card className="bg-white dark:bg-fiord-900 border-fiord-100 dark:border-fiord-800 rounded-[24px] p-5 flex items-center justify-between gap-4 shadow-sm hover:border-fiord-200 dark:hover:border-fiord-700 transition-all duration-300">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="bg-fiord-50 dark:bg-fiord-800 text-fiord-700 dark:text-fiord-300 border-none font-bold text-[9px] px-2 py-0.5 rounded-md">Logística</Badge>
                  <span className="text-[10px] text-fiord-400 dark:text-fiord-500 font-bold uppercase tracking-wider">Mérida</span>
                </div>
                <h5 className="text-[14.5px] font-bold tracking-tight text-fiord-900 dark:text-fiord-50 line-clamp-1">Auxiliar de Almacén</h5>
                <p className="text-[11px] text-fiord-500 dark:text-fiord-400 font-bold">$10,000 - $12,000 MXN</p>
              </div>

              {/* Progress wheel SVG */}
              <div className="relative size-16 shrink-0 flex items-center justify-center">
                <svg className="size-full transform -rotate-90">
                  <circle cx="32" cy="32" r="24" stroke="#ebeef3" strokeWidth="6" fill="transparent" className="dark:stroke-fiord-800" />
                  <circle cx="32" cy="32" r="24" stroke="#3e546d" strokeWidth="6" fill="transparent" strokeDasharray="150" strokeDashoffset="0" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] font-bold font-mono text-fiord-900 dark:text-fiord-100">3/3</span>
                  <span className="text-[6.5px] text-fiord-400 dark:text-fiord-500 uppercase tracking-widest font-semibold">Vacantes</span>
                </div>
              </div>
            </Card>

          </div>
        </motion.div>
        
      </motion.div>
    </div>
  )
}
