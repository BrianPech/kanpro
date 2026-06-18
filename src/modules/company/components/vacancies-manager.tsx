"use client"

import * as React from "react"
import {
  Plus,
  Search,
  Filter,
  Briefcase,
  Calendar,
  Users,
  MoreVertical,
  Edit,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  X,
  Sparkles,
  Award,
  PauseCircle,
  FileEdit,
  FileCheck,
  FileDown,
  Trash2,
  Save,
  Loader2,
  Lightbulb,
  Bold,
  Italic,
  List,
  Link as LinkIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Controller } from "react-hook-form"
import { useVacanciesManager, type Vacancy } from "../hooks/use-vacancies-manager"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const modalities = ["Remoto", "Híbrido", "Presencial"] as const
const categories = [
  "Administración",
  "Atención al cliente",
  "Comercial",
  "Finanzas",
  "Operaciones",
  "Recursos Humanos",
  "Logística",
  "Salud",
  "Educación",
  "Tecnología",
] as const
const seniorities = [
  "Inicial",
  "Intermedio",
  "Avanzado",
  "Especialista",
  "Liderazgo",
] as const
const contractTypes = [
  "Indefinido",
  "Temporal",
  "Freelance",
  "Prácticas",
] as const
const employmentTypes = [
  "Tiempo completo",
  "Tiempo parcial",
  "Por proyecto",
] as const
const currencies = ["USD", "EUR", "MXN", "ARS", "COP"] as const

export function VacanciesManager({ userId }: { userId: string }) {
  const searchParams = useSearchParams()
  const shouldCreate = searchParams.get("create") === "true"

  const {
    isCreating,
    setIsCreating,
    vacancies,
    isLoading,
    searchQuery,
    setSearchQuery,
    dragOverColumn,
    isExporting,
    form,
    onSubmit,
    handleSaveDraft,
    handleExportReport,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useVacanciesManager(userId, shouldCreate)

  const { register, control, watch, formState: { errors, isSubmitting } } = form

  // Watch form fields for live preview synchronization
  const watchTitle = watch("title", "")
  const watchCategory = watch("category", "Tecnología")
  const watchModality = watch("modality", "Remoto")
  const watchLocation = watch("location", "")
  const watchSalaryMin = watch("salary_min")
  const watchSalaryMax = watch("salary_max")
  const watchCurrency = watch("currency", "USD")
  const watchDescription = watch("description", "")

  // Combine database data and official mock seed data
  const allVacancies = React.useMemo(() => {
    const parsedDB: Vacancy[] = vacancies.map((v) => ({
      ...v,
      skills: Array.isArray(v.skills) ? v.skills : (v.skills ? String(v.skills).split(",") : []),
    }))

    if (parsedDB.length === 0 && !isLoading) {
      return [
        {
          id: "mock-draft-1",
          title: "Sr. UI/UX Designer",
          description: "Design Operations Team. Responsable del diseño e interactividad en portales.",
          modality: "Híbrido" as const,
          status: "Draft",
          location: "Híbrido / Oficina",
          category: "Tecnología",
          seniority: "Avanzado",
          applicants: 0,
          matchScore: "—",
          lastSaved: "hace 2 horas",
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          skills: ["Figma", "Design Systems", "Framer"],
        },
        {
          id: "mock-active-1",
          title: "Full Stack Engineer",
          description: "Platform Infrastructure. Desarrollo de backend estructurado y despliegues automáticos.",
          modality: "Remoto" as const,
          status: "Active",
          location: "Remoto",
          category: "Tecnología",
          seniority: "Avanzado",
          applicants: 42,
          matchScore: "88%",
          trend: "+12 esta semana",
          created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          skills: ["React", "TypeScript", "Node.js"],
        },
        {
          id: "mock-active-2",
          title: "Data Scientist",
          description: "Core AI Research. Modelación predictiva e implementaciones de LLMs avanzados.",
          modality: "Remoto" as const,
          status: "Active",
          location: "Remoto",
          category: "Tecnología",
          seniority: "Avanzado",
          applicants: 18,
          matchScore: "94%",
          closingIn: "Cierra en 4d",
          created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
          skills: ["Python", "Tensorflow", "SQL"],
        },
        {
          id: "mock-paused-1",
          title: "Product Manager",
          description: "Expansion Team. Liderazgo en el despliegue del portal internacional.",
          modality: "Híbrido" as const,
          status: "Paused",
          location: "Híbrido",
          category: "Administración",
          seniority: "Liderazgo",
          applicants: 56,
          matchScore: "72%",
          tag: "Revisión Interna",
          created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
          skills: ["Agile", "Scrum", "Roadmaps"],
        },
        {
          id: "mock-closed-1",
          title: "Account Executive",
          description: "Contratada: María García. Proceso acelerado y con alta tasa de efectividad.",
          modality: "Presencial" as const,
          status: "Closed",
          location: "Oficina Central",
          category: "Comercial",
          seniority: "Intermedio",
          applicants: 14,
          matchScore: "Verified",
          cycleTime: "14 Días",
          filledDate: "Llena el 24 Ago, 2023",
          created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          skills: ["Salesforce", "Negociación B2B", "Outbound"],
        },
      ]
    }

    return parsedDB
  }, [vacancies, isLoading])

  // Filter roster based on search text
  const filteredVacancies = React.useMemo(() => {
    if (!searchQuery) return allVacancies
    const query = searchQuery.toLowerCase()
    return allVacancies.filter(
      (v) =>
        v.title.toLowerCase().includes(query) ||
        (v.category && v.category.toLowerCase().includes(query)) ||
        (v.location && v.location.toLowerCase().includes(query))
    )
  }, [allVacancies, searchQuery])

  // Categorize vacancies
  const draftColumn = React.useMemo(() => 
    filteredVacancies.filter((v) => v.status === "Draft" || v.status === "Borrador"), 
  [filteredVacancies])

  const activeColumn = React.useMemo(() => 
    filteredVacancies.filter((v) => v.status === "Active" || v.status === "Activa" || !v.status), 
  [filteredVacancies])

  const pausedColumn = React.useMemo(() => 
    filteredVacancies.filter((v) => v.status === "Paused" || v.status === "Pausada" || v.status === "Pausa"), 
  [filteredVacancies])

  const closedColumn = React.useMemo(() => 
    filteredVacancies.filter((v) => v.status === "Closed" || v.status === "Cerrada"), 
  [filteredVacancies])

  return (
    <div className="flex-grow min-h-screen bg-background px-4 md:px-10 lg:px-12 py-10 flex flex-col gap-8 overflow-hidden h-[calc(100vh-64px)] selection:bg-primary-container selection:text-on-primary animate-in fade-in duration-500">
      
      {isCreating ? (
        
        /* ================= REDESIGNED TWO-COLUMN CREATION WORKSPACE ================= */
        <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-y-auto hide-scrollbar pb-16">
          
          {/* Left Column: Form Section */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight md:text-4xl">
                Publicar una Nueva Vacante
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-medium">
                Completa los detalles para encontrar a tu próximo profesional.
              </p>
            </div>

            {/* Steps Visual Indicator */}
            <div className="flex items-center gap-4 py-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">1</span>
                <span className="text-xs font-bold text-foreground">Info General</span>
              </div>
              <div className="h-[2px] w-12 bg-border/80"></div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">2</span>
                <span className="text-xs font-bold text-muted-foreground">Descripción</span>
              </div>
              <div className="h-[2px] w-12 bg-border/80"></div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">3</span>
                <span className="text-xs font-bold text-muted-foreground">Beneficios & Salario</span>
              </div>
            </div>

            {/* Form Fields Card */}
            <section className="glass-card rounded-[28px] p-8 md:p-10 flex flex-col gap-8 shadow-sm bg-background/80 backdrop-blur-md border border-border/50">
              <form onSubmit={onSubmit} method="POST" className="space-y-6">
                
                {/* General Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Job Title */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Título de la Vacante *
                    </Label>
                    <Input 
                      id="title"
                      placeholder="Ej. Desarrollador React Senior" 
                      className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                      {...register("title")}
                    />
                    {errors.title && (
                      <p className="text-xs font-semibold text-destructive px-1">{errors.title.message?.toString()}</p>
                    )}
                  </div>

                  {/* Category select */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Categoría
                    </Label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none shadow-none">
                            <SelectValue placeholder="Selecciona Categoría" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/60">
                            <SelectItem value="Tecnología">Tecnología & Software</SelectItem>
                            <SelectItem value="Diseño">Diseño & Creatividad</SelectItem>
                            <SelectItem value="Comercial">Comercial & Ventas</SelectItem>
                            <SelectItem value="Administración">Administración & Operaciones</SelectItem>
                            <SelectItem value="Atención al cliente">Atención al cliente</SelectItem>
                            <SelectItem value="Finanzas">Finanzas & Banca</SelectItem>
                            <SelectItem value="Logística">Logística & Distribución</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Job Type select */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Modalidad
                    </Label>
                    <Controller
                      control={control}
                      name="modality"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none shadow-none">
                            <SelectValue placeholder="Selecciona Modalidad" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/60">
                            <SelectItem value="Remoto">Remoto</SelectItem>
                            <SelectItem value="Híbrido">Híbrido</SelectItem>
                            <SelectItem value="Presencial">Presencial</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Location input */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Ubicación
                    </Label>
                    <div className="relative">
                      <Input 
                        id="location"
                        placeholder="Ej. Madrid / Remoto" 
                        className="w-full h-12 bg-muted/30 border-none rounded-xl pl-12 pr-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                        {...register("location")}
                      />
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">location_on</span>
                    </div>
                  </div>

                  {/* Positions count */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vacancies_count" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Número de puestos *
                    </Label>
                    <Input
                      id="vacancies_count"
                      type="number"
                      min={1}
                      className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                      {...register("vacancies_count")}
                    />
                    {errors.vacancies_count && (
                      <p className="text-xs font-semibold text-destructive px-1">{errors.vacancies_count.message?.toString()}</p>
                    )}
                  </div>

                </div>

                <div className="h-px bg-border/40 w-full"></div>

                {/* Description & Rich Text simulation */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Descripción del Puesto *
                  </Label>
                  
                  <div className="w-full border border-border/60 rounded-2xl overflow-hidden shadow-sm bg-card">
                    {/* Simulated Text Formatting Bar */}
                    <div className="bg-muted/40 p-2 flex gap-1.5 border-b border-border/40">
                      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground">
                        <Bold className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground">
                        <Italic className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground">
                        <List className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground">
                        <LinkIcon className="size-4" />
                      </Button>
                    </div>

                    <Textarea 
                      id="description"
                      placeholder="Describe el rol, responsabilidades y requisitos clave..."
                      className="w-full min-h-48 border-none p-5 text-sm font-semibold transition-all resize-none shadow-none bg-card focus-visible:ring-0 focus-visible:ring-offset-0"
                      {...register("description")}
                    />
                  </div>
                  {errors.description && (
                    <p className="text-xs font-semibold text-destructive px-1">{errors.description.message?.toString()}</p>
                  )}
                </div>

                <div className="h-px bg-border/40 w-full"></div>

                {/* Perks & Salary fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  {/* Min salary */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="salary_min" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Salario Mínimo (Anual)
                    </Label>
                    <Input 
                      id="salary_min"
                      type="number"
                      placeholder="Min" 
                      className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                      {...register("salary_min")}
                    />
                  </div>

                  {/* Max salary */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="salary_max" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Salario Máximo (Anual)
                    </Label>
                    <Input 
                      id="salary_max"
                      type="number"
                      placeholder="Max" 
                      className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                      {...register("salary_max")}
                    />
                  </div>

                  {/* Currency */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Moneda
                    </Label>
                    <Controller
                      control={control}
                      name="currency"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none shadow-none">
                            <SelectValue placeholder="Moneda" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/60">
                            {currencies.map((currencyOption) => (
                              <SelectItem key={currencyOption} value={currencyOption}>
                                {currencyOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                </div>

                {/* Key Skills */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="skills" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Habilidades Requeridas * (Separadas por comas)
                  </Label>
                  <Input 
                    id="skills"
                    placeholder="Ej. React, TypeScript, Node.js, TailwindCSS"
                    className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                    {...register("skills")}
                  />
                  {errors.skills && (
                    <p className="text-xs font-semibold text-destructive px-1">{errors.skills.message?.toString()}</p>
                  )}
                </div>

                {/* Benefits */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="benefits" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                    Beneficios & Perks (Separados por comas)
                  </Label>
                  <Input 
                    id="benefits"
                    placeholder="Ej. Seguro Médico, Trabajo Remoto, Presupuesto de Aprendizaje"
                    className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                    {...register("benefits")}
                  />
                </div>

                {/* Action Buttons inside Left Column */}
                <div className="flex items-center justify-between mt-8 pt-4">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => { setIsCreating(false); form.reset(); }}
                    className="px-6 py-5 rounded-xl font-bold text-muted-foreground hover:bg-muted text-xs md:text-sm active:scale-95 transition-all shadow-none flex items-center gap-2"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                    Descartar
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="px-6 py-5 rounded-xl font-bold border-primary text-primary hover:bg-primary/5 text-xs md:text-sm active:scale-95 transition-all shadow-none"
                    >
                      Guardar Borrador
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-5 rounded-xl font-bold bg-primary hover:bg-primary/95 text-on-primary text-xs md:text-sm active:scale-95 transition-all shadow-lg shadow-primary/10 hover:shadow-primary/25"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin mr-2" />
                      ) : (
                        <Save className="size-4 mr-2" />
                      )}
                      Publicar Vacante
                    </Button>
                  </div>
                </div>

              </form>
            </section>
          </div>

          {/* Right Column: Sticky Sidebar Preview */}
          <aside className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 relative">
            <div className="sticky top-6">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Vista Previa en Vivo
                </h3>
                <span className="px-3 py-1 bg-secondary-container/20 text-secondary text-[10px] font-bold rounded-full uppercase font-sans tracking-wide">
                  Vista del Candidato
                </span>
              </div>

              {/* Preview Card */}
              <div className="liquid-card bg-card border border-border/50 rounded-[28px] overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                
                {/* Banner Header gradient */}
                <div className="h-24 bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-10" 
                    style={{
                      backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                      backgroundSize: "16px 16px"
                    }}
                  />
                  {/* Floating Company Logo Container */}
                  <div className="absolute -bottom-6 left-8 h-16 w-16 bg-background rounded-2xl shadow-md flex items-center justify-center border border-border/40 overflow-hidden">
                    <Briefcase className="w-8 h-8 text-primary" />
                  </div>
                </div>

                {/* Preview details */}
                <div className="p-8 pt-12 flex flex-col gap-6">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h2 
                      id="preview-title" 
                      className="text-lg md:text-xl font-extrabold text-foreground tracking-tight truncate cursor-default"
                    >
                      {watchTitle || "Título de la Oferta"}
                    </h2>
                    <p className="text-primary font-bold text-xs md:text-sm">
                      Tu Empresa
                    </p>
                  </div>

                  {/* Reactive pill badges */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-muted px-3.5 py-1.5 rounded-full text-muted-foreground font-bold text-[11px] font-sans uppercase">
                      <Briefcase className="size-3.5" />
                      <span id="preview-type">{watchModality || "Remoto"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted px-3.5 py-1.5 rounded-full text-muted-foreground font-bold text-[11px] font-sans uppercase max-w-40 truncate">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      <span id="preview-location">{watchLocation || "Ubicación"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted px-3.5 py-1.5 rounded-full text-muted-foreground font-bold text-[11px] font-sans uppercase">
                      <span className="material-symbols-outlined text-[15px]">payments</span>
                      <span>
                        {watchSalaryMin || watchSalaryMax ? (
                          `${watchCurrency} ${Number(watchSalaryMin || 0).toLocaleString()} - ${Number(watchSalaryMax || 0).toLocaleString()}`
                        ) : (
                          "Rango Salarial"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-border/40"></div>

                  {/* Role descriptions */}
                  <div className="flex flex-col gap-3 min-w-0">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider font-sans">
                      Acerca del puesto
                    </p>
                    <p 
                      id="preview-desc" 
                      className="text-xs text-muted-foreground font-medium leading-relaxed font-sans line-clamp-4 select-none whitespace-pre-line"
                    >
                      {watchDescription || "Completa la descripción a la izquierda para ver un resumen de cómo los postulantes verán tu anuncio en K'anPro."}
                    </p>
                  </div>

                  <button className="w-full py-4 bg-muted text-muted-foreground rounded-xl font-bold text-xs md:text-sm opacity-55 cursor-not-allowed uppercase tracking-wider font-sans border border-border/50 shadow-inner mt-2">
                    Postularse Ahora
                  </button>
                </div>

              </div>

              {/* Helper tip Lightbulb card */}
              <div className="mt-6 p-6 bg-secondary-container/10 border border-secondary/15 rounded-3xl flex gap-4 animate-in slide-in-from-bottom-2 duration-700">
                <Lightbulb className="size-6 text-secondary shrink-0" />
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-extrabold text-sm text-foreground tracking-tight">Consejo Pro</p>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed font-sans">
                    Las vacantes locales con especificación clara de salarios obtienen un 40% más de respuestas.
                  </p>
                </div>
              </div>

            </div>
          </aside>

        </div>
        
      ) : (
        
        /* ================= live KANBAN BOARD VIEW (isCreating is false) ================= */
        <div className="flex-grow flex flex-col gap-8 overflow-hidden h-full">
          
          {/* Header Controls Area */}
          <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 shrink-0">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
                Gestor de Vacantes
              </h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 font-medium">
                Sigue el progreso de tu selección local arrastrando vacantes entre fases.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => toast.info("Filtros avanzados activos", { description: "Próximamente podrás ordenar por nivel de score de afinidad." })}
                className="flex-1 sm:flex-none px-6 py-5 rounded-full border border-border/60 bg-card hover:bg-muted font-bold text-xs md:text-sm shadow-sm transition-all"
              >
                <Filter className="size-4 mr-2" />
                Filtros
              </Button>
              <Button 
                onClick={handleExportReport}
                disabled={isExporting}
                className="flex-1 sm:flex-none px-6 py-5 rounded-full bg-primary text-on-primary hover:bg-primary/95 font-bold text-xs md:text-sm shadow-lg shadow-primary/10 hover:shadow-primary/25 active:scale-95 transition-all"
              >
                {isExporting ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileDown className="size-4 mr-2" />}
                Exportar Reporte
              </Button>
            </div>
          </section>

          {/* Search Bar */}
          <section className="shrink-0 flex items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 bg-card border-border/60 rounded-full text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow shadow-sm"
                placeholder="Buscar vacantes por título, categoría o palabra clave..."
              />
            </div>
          </section>

          {/* Kanban Columns Scroller */}
          <div className="flex-1 flex gap-6 overflow-x-auto pb-6 hide-scrollbar items-start">
            
            {/* COLUMN: DRAFT */}
            <div 
              onDragOver={(e) => handleDragOver(e, "Draft")}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop("Draft", (window as any).currentlyDraggedVacancyId || "")}
              className={`kanban-column flex flex-col gap-4 rounded-3xl p-2 transition-colors duration-300 w-72 shrink-0 ${dragOverColumn === "Draft" ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[12px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  Borradores
                </span>
                <span className="bg-muted/80 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-slate-600">
                  {draftColumn.length}
                </span>
              </div>

              {/* Dotted trigger card to enter Create Vacancy view */}
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full p-8 rounded-[24px] border-2 border-dashed border-border/80 hover:border-indigo-500 hover:bg-indigo-500/5 group transition-all flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-indigo-600 active:scale-98 shrink-0"
              >
                <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-indigo-650 group-hover:text-white transition-all shadow-sm">
                  <Plus className="size-6 transition-transform group-hover:scale-110" />
                </div>
                <span className="font-extrabold text-sm group-hover:text-indigo-600 tracking-wide">
                  Nueva Vacante
                </span>
              </button>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-340px)] hide-scrollbar pr-0.5">
                {draftColumn.map((v) => (
                  <div 
                    key={v.id} 
                    draggable
                    onDragStart={() => { (window as any).currentlyDraggedVacancyId = v.id }}
                    className="glass-card liquid-card rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer bg-background/80 border border-border/50"
                    onClick={() => toast.info(`Borrador: ${v.title}`, { description: "Puedes editar los detalles o publicarla." })}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <FileEdit className="size-5" />
                      </div>
                      <MoreVertical className="size-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-1 group-hover:text-indigo-600 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-550 font-medium">
                        {v.category || "General"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-muted/60 p-2.5 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold mb-0.5">Postulantes</p>
                        <p className="text-md font-extrabold text-slate-900">{v.applicants ?? 0}</p>
                      </div>
                      <div className="bg-muted/60 p-2.5 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold mb-0.5">Afinidad</p>
                        <p className="text-md font-extrabold text-slate-900">{v.matchScore ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: ACTIVE */}
            <div 
              onDragOver={(e) => handleDragOver(e, "Active")}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop("Active", (window as any).currentlyDraggedVacancyId || "")}
              className={`kanban-column flex flex-col gap-4 rounded-3xl p-2 transition-colors duration-300 w-72 shrink-0 ${dragOverColumn === "Active" ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  Activas
                </span>
                <span className="bg-indigo-500/10 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-indigo-600">
                  {activeColumn.length}
                </span>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-260px)] hide-scrollbar pr-0.5">
                {activeColumn.map((v) => (
                  <div 
                    key={v.id} 
                    draggable
                    onDragStart={() => { (window as any).currentlyDraggedVacancyId = v.id }}
                    className="glass-card liquid-card rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer bg-background/80 border border-border/50 shadow-sm"
                    onClick={() => toast.info(`Detalles de vacante: ${v.title}`, { description: "Consultando candidatos inscritos." })}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 relative z-10">
                        <Briefcase className="size-5" />
                      </div>
                      <MoreVertical className="size-4 text-slate-500 cursor-pointer hover:text-foreground transition-colors z-10" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-1 group-hover:text-indigo-600 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-550 font-medium">
                        {v.category || "General"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-indigo-500/5 p-2.5 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-indigo-600 font-bold mb-0.5">Postulantes</p>
                        <p className="text-md font-extrabold text-indigo-600">{v.applicants ?? 0}</p>
                      </div>
                      <div className="bg-violet-500/5 p-2.5 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-violet-650 font-bold mb-0.5">Afinidad Prom</p>
                        <p className="text-md font-extrabold text-violet-600">{v.matchScore ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: PAUSED */}
            <div 
              onDragOver={(e) => handleDragOver(e, "Paused")}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop("Paused", (window as any).currentlyDraggedVacancyId || "")}
              className={`kanban-column flex flex-col gap-4 rounded-3xl p-2 transition-colors duration-300 w-72 shrink-0 ${dragOverColumn === "Paused" ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[12px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Pausadas
                </span>
                <span className="bg-amber-500/10 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-amber-700">
                  {pausedColumn.length}
                </span>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-260px)] hide-scrollbar pr-0.5">
                {pausedColumn.map((v) => (
                  <div 
                    key={v.id} 
                    draggable
                    onDragStart={() => { (window as any).currentlyDraggedVacancyId = v.id }}
                    className="glass-card liquid-card rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer bg-background/80 border border-border/50 opacity-80 hover:opacity-100 transition-all"
                    onClick={() => toast.info(`Oferta en pausa: ${v.title}`, { description: "Puedes reactivarla arrastrándola a Activas." })}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <PauseCircle className="size-5" />
                      </div>
                      <MoreVertical className="size-4 text-slate-500 cursor-pointer hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-1 group-hover:text-amber-600 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-550 font-medium">
                        {v.category || "General"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-muted/60 p-2.5 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-650 font-bold mb-0.5">Postulantes</p>
                        <p className="text-md font-extrabold text-slate-900">{v.applicants ?? 0}</p>
                      </div>
                      <div className="bg-muted/60 p-2.5 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-650 font-bold mb-0.5">Afinidad</p>
                        <p className="text-md font-extrabold text-slate-900">{v.matchScore ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN: CLOSED */}
            <div 
              onDragOver={(e) => handleDragOver(e, "Closed")}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop("Closed", (window as any).currentlyDraggedVacancyId || "")}
              className={`kanban-column flex flex-col gap-4 rounded-3xl p-2 transition-colors duration-300 w-72 shrink-0 ${dragOverColumn === "Closed" ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[12px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  Cerradas
                </span>
                <span className="bg-muted/80 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-slate-600">
                  {closedColumn.length}
                </span>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-260px)] hide-scrollbar pr-0.5">
                {closedColumn.map((v) => (
                  <div 
                    key={v.id} 
                    draggable
                    onDragStart={() => { (window as any).currentlyDraggedVacancyId = v.id }}
                    className="glass-card liquid-card rounded-[24px] p-6 flex flex-col gap-4 bg-muted/20 relative overflow-hidden group cursor-pointer border border-border/50"
                    onClick={() => toast.info(`Historial: ${v.title}`, { description: "Revisando métricas de contratación finalizadas." })}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-600">
                        <CheckCircle2 className="size-5" />
                      </div>
                      <MoreVertical className="size-4 text-slate-500 cursor-pointer hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-1">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-550 font-medium">
                        {v.category || "General"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Decorative bottom background elements */}
          <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
          <div className="fixed top-1/2 -left-32 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
        </div>
      )}

    </div>
  )
}
