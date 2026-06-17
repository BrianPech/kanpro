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
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { companyService } from "@/modules/company/services/company-service"
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

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined
  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? undefined : parsedValue
}, z.number().positive().optional())

const vacancySchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  modality: z.enum(modalities),
  location: z.string().optional(),
  category: z.string().optional(),
  seniority: z.string().optional(),
  contract_type: z.string().optional(),
  employment_type: z.string().optional(),
  vacancies_count: z.coerce
    .number()
    .int()
    .min(1, "Debe haber al menos 1 vacante"),
  application_deadline: z.string().optional(),
  salary_min: optionalNumber,
  salary_max: optionalNumber,
  currency: z.enum(currencies),
  skills: z
    .string()
    .min(1, "Ingresa al menos una habilidad (separadas por comas)"),
  benefits: z.string().optional(),
})

type VacancyFormValues = z.infer<typeof vacancySchema>

interface Vacancy {
  id: string
  title: string
  description: string
  modality: string
  salary?: string | null
  skills: string[]
  status: string
  location?: string | null
  category?: string | null
  seniority?: string | null
  contract_type?: string | null
  employment_type?: string | null
  vacancies_count?: number | null
  application_deadline?: string | null
  benefits?: string[] | null
  salary_min?: number | null
  salary_max?: number | null
  currency?: string | null
  created_at: string
  applicants?: number
  matchScore?: string
  lastSaved?: string
  trend?: string
  closingIn?: string
  tag?: string
  cycleTime?: string
  filledDate?: string
}

export function VacanciesManager({ userId }: { userId: string }) {
  const searchParams = useSearchParams()
  const shouldCreate = searchParams.get("create") === "true"

  const [isCreating, setIsCreating] = React.useState(shouldCreate)
  const [vacancies, setVacancies] = React.useState<Vacancy[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  // Fetch live vacancies
  const fetchVacancies = React.useCallback(async () => {
    try {
      const data = await companyService.getVacancies(userId)
      const formattedData = (data || []).map(item => ({
        ...item,
        skills: item.skills || [],
      })) as Vacancy[]
      setVacancies(formattedData)
    } catch (error) {
      console.error("Error loading vacancies:", error)
      toast.error("Error al cargar las vacantes", {
        description: "Hubo un problema al cargar los datos desde la base de datos.",
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    fetchVacancies()
  }, [fetchVacancies])

  // Setup react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(vacancySchema as any),
    defaultValues: {
      title: "",
      description: "",
      modality: "Remoto",
      location: "",
      category: "Tecnología",
      seniority: "Intermedio",
      contract_type: "Indefinido",
      employment_type: "Tiempo completo",
      vacancies_count: 1,
      application_deadline: "",
      salary_min: undefined,
      salary_max: undefined,
      currency: "USD",
      skills: "",
      benefits: "",
    },
  })

  // Watch form fields for live preview synchronization
  const watchTitle = watch("title", "")
  const watchCategory = watch("category", "Tecnología")
  const watchModality = watch("modality", "Remoto")
  const watchLocation = watch("location", "")
  const watchSalaryMin = watch("salary_min")
  const watchSalaryMax = watch("salary_max")
  const watchCurrency = watch("currency", "USD")
  const watchDescription = watch("description", "")

  // Save vacancy to Supabase
  const onSubmit = async (data: any) => {
    try {
      await companyService.createVacancy(userId, data)
      toast.success("¡Vacante publicada con éxito!", {
        description: `Se ha registrado "${data.title}" en la columna de ofertas Activas.`,
      })
      await fetchVacancies()
      setIsCreating(false)
      reset()
    } catch (error) {
      console.error("Error creating vacancy:", error)
      toast.error("Error al publicar la vacante", {
        description: "Revisa la conexión o los campos obligatorios.",
      })
    }
  }

  // Save Draft simulated handler
  const handleSaveDraft = () => {
    toast.success("Borrador guardado", {
      description: `Se ha guardado tu borrador para "${watchTitle || "Vacante sin título"}".`,
    })
    setIsCreating(false)
    reset()
  }

  // Simulated Report Export
  const handleExportReport = () => {
    setIsExporting(true)
    toast.info("Generando reporte completo...", {
      description: "Compilando estadísticas de vacantes y postulantes.",
    })
    
    setTimeout(() => {
      setIsExporting(false)
      toast.success("¡Reporte exportado con éxito!", {
        description: "Se ha guardado el archivo PDF con las métricas de selección.",
      })
    }, 1500)
  }

  // Combine database data and official mock seed data
  const allVacancies = React.useMemo(() => {
    const parsedDB: Vacancy[] = vacancies.map((v) => ({
      ...v,
      skills: Array.isArray(v.skills) ? v.skills : (v.skills ? String(v.skills).split(",") : []),
    }))

    if (parsedDB.length === 0) {
      return [
        {
          id: "mock-draft-1",
          title: "Sr. UI/UX Designer",
          description: "Design Operations Team. Responsable del diseño e interactividad en portales.",
          modality: "Híbrido",
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
          modality: "Remoto",
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
          modality: "Remoto",
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
          modality: "Híbrido",
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
          modality: "Presencial",
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
  }, [vacancies])

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

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent, colName: string) => {
    e.preventDefault()
    setDragOverColumn(colName)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (colName: string) => {
    setDragOverColumn(null)
    toast.success("Estado de vacante actualizado", {
      description: `La vacante ha sido trasladada a la columna de ${colName}.`,
    })
  }

  return (
    <div className="flex-grow min-h-screen bg-background px-4 md:px-10 lg:px-12 py-10 flex flex-col gap-8 overflow-hidden h-[calc(100vh-64px)] selection:bg-primary-container selection:text-on-primary animate-in fade-in duration-500">
      
      {isCreating ? (
        
        /* ================= REDESIGNED TWO-COLUMN CREATION WORKSPACE ================= */
        <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-y-auto hide-scrollbar pb-16">
          
          {/* Left Column: Form Section */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight md:text-4xl">
                Post a New Vacancy
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-medium">
                Fill in the details to find your next elite professional. Your draft is saved automatically.
              </p>
            </div>

            {/* Steps Visual Indicator */}
            <div className="flex items-center gap-4 py-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">1</span>
                <span className="text-xs font-bold text-foreground">General Info</span>
              </div>
              <div className="h-[2px] w-12 bg-border/80"></div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">2</span>
                <span className="text-xs font-bold text-muted-foreground">Detailed Description</span>
              </div>
              <div className="h-[2px] w-12 bg-border/80"></div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-xs text-muted-foreground">3</span>
                <span className="text-xs font-bold text-muted-foreground">Perks & Salary</span>
              </div>
            </div>

            {/* Form Fields Card */}
            <section className="glass-card rounded-[28px] p-8 md:p-10 flex flex-col gap-8 shadow-sm">
              <form onSubmit={handleSubmit(onSubmit)} method="POST" className="space-y-6">
                
                {/* General Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Job Title */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Job Title
                    </Label>
                    <Input 
                      id="title"
                      placeholder="e.g. Senior Cloud Architect" 
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
                      Category
                    </Label>
                    <Controller
                      control={control}
                      name="category"
                      render={({ field }) => (
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none shadow-none">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/60">
                            <SelectItem value="Tecnología">Engineering & Software</SelectItem>
                            <SelectItem value="Diseño">Creative & UX Design</SelectItem>
                            <SelectItem value="Comercial">Sales & Marketing</SelectItem>
                            <SelectItem value="Administración">Product & Business Management</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Job Type select */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Job Type
                    </Label>
                    <Controller
                      control={control}
                      name="modality"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none shadow-none">
                            <SelectValue placeholder="Select Modality" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/60">
                            <SelectItem value="Remoto">Full-time (Remoto)</SelectItem>
                            <SelectItem value="Híbrido">Hybrid (Híbrido)</SelectItem>
                            <SelectItem value="Presencial">Presencial (On-Site)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Location input */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Location
                    </Label>
                    <div className="relative">
                      <Input 
                        id="location"
                        placeholder="e.g. Remote or San Francisco" 
                        className="w-full h-12 bg-muted/30 border-none rounded-xl pl-12 pr-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                        {...register("location")}
                      />
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">location_on</span>
                    </div>
                  </div>

                  {/* Positions count */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vacancies_count" className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                      Number of positions
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
                    Job Description
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
                      placeholder="Tell us about the role, responsibilities, and qualifications..."
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
                      Min Salary (Annual USD)
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
                      Max Salary (Annual USD)
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
                      Currency
                    </Label>
                    <Controller
                      control={control}
                      name="currency"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-primary focus:bg-background transition-all outline-none shadow-none">
                            <SelectValue placeholder="Currency" />
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
                    Key Requirements (Skills, comma separated)
                  </Label>
                  <Input 
                    id="skills"
                    placeholder="e.g. Cloud Security, AWS, Kubernetes, Terraform"
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
                    Perks & Benefits
                  </Label>
                  <Input 
                    id="benefits"
                    placeholder="e.g. Health Insurance, Gym Membership, Remote Budget"
                    className="w-full h-12 bg-muted/30 border-none rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background text-sm font-semibold transition-all outline-none"
                    {...register("benefits")}
                  />
                </div>

                {/* Action Buttons inside Left Column */}
                <div className="flex items-center justify-between mt-8 pt-4">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => { setIsCreating(false); reset(); }}
                    className="px-6 py-5 rounded-xl font-bold text-muted-foreground hover:bg-muted text-xs md:text-sm active:scale-95 transition-all shadow-none flex items-center gap-2"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                    Discard
                  </Button>
                  <div className="flex gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      className="px-6 py-5 rounded-xl font-bold border-primary text-primary hover:bg-primary/5 text-xs md:text-sm active:scale-95 transition-all shadow-none"
                    >
                      Save Draft
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
                      Publish Vacancy
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
                  Live Preview
                </h3>
                <span className="px-3 py-1 bg-secondary-container/20 text-secondary text-[10px] font-bold rounded-full uppercase font-sans tracking-wide">
                  Candidate View
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
                    <img 
                      alt="Company Logo" 
                      className="w-10 h-10 object-contain" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFyiPd__ATPfBuUqsEw18TXwJuAY6NEJmU1TKVD3E5aEyRayQ57EexnLBr0qzVGUwyOTIoIviE0R0thxb8yR2ubCXak1Xhs7cqzixQcktH9CSQhZ4QGRmr5kCOM9gWaB4EHrNQgWq8Z0sfQIINm9pZg8AKNRbVGlyv8wMDo8H0y1JvG47ABZFdJTas9_WWTXPHKLLgrsQHlnv07ktL4IuziXjzh_KbCnAGH7F9Z3S1Xmz84MWDkzWqiQuENmpPZK0I9KTfOcT-xRQ" 
                    />
                  </div>
                </div>

                {/* Preview details */}
                <div className="p-8 pt-12 flex flex-col gap-6">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h2 
                      id="preview-title" 
                      className="text-lg md:text-xl font-extrabold text-foreground tracking-tight truncate cursor-default"
                    >
                      {watchTitle || "Cloud Architect"}
                    </h2>
                    <p className="text-primary font-bold text-xs md:text-sm">
                      K&apos;anPro Systems
                    </p>
                  </div>

                  {/* Reactive pill badges */}
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-muted px-3.5 py-1.5 rounded-full text-muted-foreground font-bold text-[11px] font-sans uppercase">
                      <Briefcase className="size-3.5" />
                      <span id="preview-type">{watchModality || "Full-time"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted px-3.5 py-1.5 rounded-full text-muted-foreground font-bold text-[11px] font-sans uppercase max-w-40 truncate">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      <span id="preview-location">{watchLocation || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted px-3.5 py-1.5 rounded-full text-muted-foreground font-bold text-[11px] font-sans uppercase">
                      <span className="material-symbols-outlined text-[15px]">payments</span>
                      <span>
                        {watchSalaryMin || watchSalaryMax ? (
                          `${watchCurrency} ${Number(watchSalaryMin || 0).toLocaleString()} - ${Number(watchSalaryMax || 0).toLocaleString()}`
                        ) : (
                          "$140k - $180k"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-border/40"></div>

                  {/* Role descriptions */}
                  <div className="flex flex-col gap-3 min-w-0">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider font-sans">
                      About the role
                    </p>
                    <p 
                      id="preview-desc" 
                      className="text-xs text-muted-foreground font-medium leading-relaxed font-sans line-clamp-4 select-none whitespace-pre-line"
                    >
                      {watchDescription || "Join our elite engineering team to build the future of decentralized infrastructure. We are looking for a visionary architect who can bridge the gap between complex cloud systems and user-centric applications..."}
                    </p>
                  </div>

                  <button className="w-full py-4 bg-muted text-muted-foreground rounded-xl font-bold text-xs md:text-sm opacity-55 cursor-not-allowed uppercase tracking-wider font-sans border border-border/50 shadow-inner mt-2">
                    Apply Now
                  </button>
                </div>

              </div>

              {/* Helper tip Lightbulb card */}
              <div className="mt-6 p-6 bg-secondary-container/10 border border-secondary/15 rounded-3xl flex gap-4 animate-in slide-in-from-bottom-2 duration-700">
                <Lightbulb className="size-6 text-secondary shrink-0" />
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="font-extrabold text-sm text-foreground tracking-tight">Pro Tip</p>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed font-sans">
                    Roles with specific salary ranges receive 40% more high-quality applications.
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
                Vacancy Manager
              </h2>
              <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-2 font-medium">
                Efficiently track your recruitment workflow and candidate matching scores.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => toast.info("Filtros avanzados activos", { description: "Próximamente podrás ordenar por nivel de score de afinidad." })}
                className="flex-1 sm:flex-none px-6 py-5 rounded-full border border-border/60 bg-card hover:bg-muted font-bold text-xs md:text-sm shadow-sm transition-all"
              >
                <Filter className="size-4 mr-2" />
                Filters
              </Button>
              <Button 
                onClick={handleExportReport}
                disabled={isExporting}
                className="flex-1 sm:flex-none px-6 py-5 rounded-full bg-primary text-on-primary hover:bg-primary/95 font-bold text-xs md:text-sm shadow-lg shadow-primary/10 hover:shadow-primary/25 active:scale-95 transition-all"
              >
                {isExporting ? <Clock className="size-4 animate-spin mr-2" /> : <FileDown className="size-4 mr-2" />}
                Export Report
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
                placeholder="Search vacancies by title, category, keywords..."
              />
            </div>
          </section>

          {/* Kanban Columns Scroller */}
          <div className="flex-1 flex gap-6 overflow-x-auto pb-6 hide-scrollbar items-start">
            
            {/* COLUMN: DRAFT */}
            <div 
              onDragOver={(e) => handleDragOver(e, "Draft")}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop("Draft")}
              className={`kanban-column flex flex-col gap-4 rounded-3xl p-2 transition-colors duration-300 ${dragOverColumn === "Draft" ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[12px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                  Draft
                </span>
                <span className="bg-muted/80 dark:bg-muted/40 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                  {draftColumn.length}
                </span>
              </div>

              {/* Dotted trigger card to enter Create Vacancy view */}
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full p-8 rounded-[24px] border-2 border-dashed border-border/80 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-500/5 group transition-all flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 active:scale-98 shrink-0 animate-in fade-in duration-350"
              >
                <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-indigo-600 dark:group-hover:bg-indigo-450 group-hover:text-white transition-all shadow-sm">
                  <Plus className="size-6 transition-transform group-hover:scale-110" />
                </div>
                <span className="font-extrabold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-300 tracking-wide">
                  Create New Vacancy
                </span>
              </button>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-340px)] hide-scrollbar pr-0.5">
                {draftColumn.map((v) => (
                  <div 
                    key={v.id} 
                    className="glass-card liquid-card rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer"
                    onClick={() => toast.info(`Borrador: ${v.title}`, { description: "Puedes editar los detalles o publicarla." })}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                        <FileEdit className="size-5" />
                      </div>
                      <MoreVertical className="size-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-650 dark:text-slate-400 font-medium">
                        {v.category || "Design Operations Team"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-muted/60 dark:bg-muted/20 p-3 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold mb-0.5">Applicants</p>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{v.applicants ?? 0}</p>
                      </div>
                      <div className="bg-muted/60 dark:bg-muted/20 p-3 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold mb-0.5">Match Score</p>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{v.matchScore ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-1">
                      <span className="text-[11px] text-slate-650 dark:text-slate-400 font-medium">
                        {v.lastSaved ?? "Borrador guardado"}
                      </span>
                      <div className="w-6 h-6 rounded-full border border-border bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-600 dark:text-indigo-300">
                        AR
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
              onDrop={() => handleDrop("Active")}
              className={`kanban-column flex flex-col gap-4 rounded-3xl p-2 transition-colors duration-300 ${dragOverColumn === "Active" ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  Active
                </span>
                <span className="bg-indigo-500/10 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-indigo-600 dark:text-indigo-300">
                  {activeColumn.length}
                </span>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-260px)] hide-scrollbar pr-0.5">
                {activeColumn.map((v) => (
                  <div 
                    key={v.id} 
                    className="glass-card liquid-card rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group cursor-pointer"
                    onClick={() => toast.info(`Detalles de vacante: ${v.title}`, { description: "Consultando candidatos inscritos." })}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300 relative z-10">
                        <Briefcase className="size-5 fill-indigo-500/10" />
                      </div>
                      <MoreVertical className="size-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-foreground transition-colors z-10" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-650 dark:text-slate-400 font-medium">
                        {v.category || "Platform Infrastructure"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-indigo-500/5 dark:bg-indigo-500/10 p-3 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-indigo-600 dark:text-indigo-300 font-bold mb-0.5">Applicants</p>
                        <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-300">{v.applicants ?? 42}</p>
                      </div>
                      <div className="bg-violet-500/5 dark:bg-violet-500/10 p-3 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-violet-600 dark:text-violet-300 font-bold mb-0.5">Avg Match</p>
                        <p className="text-lg font-extrabold text-violet-600 dark:text-violet-300">{v.matchScore ?? "88%"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-1">
                      {v.trend ? (
                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-300">
                          <TrendingUp className="size-3.5" />
                          <span className="text-[11px] font-bold">{v.trend}</span>
                        </div>
                      ) : v.closingIn ? (
                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Clock className="size-3.5 text-slate-500 dark:text-slate-450" />
                          <span className="text-[11px] font-medium">{v.closingIn}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-600 dark:text-slate-450 font-medium">
                          Activa hace poco
                        </span>
                      )}
                      
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <img 
                          alt="recruiter 1" 
                          className="w-6 h-6 rounded-full border-2 border-background object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCokxJw5lfwrwJ5-JgWnXk-0y-J0jOSavmDD1CSTQIIkYFHD2ChWbr8JmwrUG2AYcjQlwjrd-ChysqU4ZNj6ABGxqdwF9hn1HxzDYkuV1FbM9P47LNQPmcYkyAzAk2nVFVsi-aFNgvvbNhS0QrcF7iHjKlcV1X9D5koEH-xTGa0OrwT3zs_L0IvQONCZfNqYRTSoGjd3Diz2sXidqlXJjewiko5YtsU0y2ZbX4VOrfiZBzs3wOy7ko4ZTD9R-RDPxPJrg4TOEKsDQY" 
                        />
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
              onDrop={() => handleDrop("Paused")}
              className={`kanban-column flex flex-col gap-4 rounded-3xl p-2 transition-colors duration-300 ${dragOverColumn === "Paused" ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[12px] font-bold text-amber-700 dark:text-amber-450 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Paused
                </span>
                <span className="bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                  {pausedColumn.length}
                </span>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-260px)] hide-scrollbar pr-0.5">
                {pausedColumn.map((v) => (
                  <div 
                    key={v.id} 
                    className="glass-card liquid-card rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden grayscale-[0.3] opacity-80 hover:grayscale-0 hover:opacity-100 transition-all group cursor-pointer"
                    onClick={() => toast.info(`Oferta en pausa: ${v.title}`, { description: "Puedes reactivarla haciendo clic en el menú contextual." })}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <PauseCircle className="size-5" />
                      </div>
                      <MoreVertical className="size-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-650 dark:text-slate-400 font-medium">
                        {v.category || "Expansion Team"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-muted/60 dark:bg-muted/20 p-3 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold mb-0.5">Applicants</p>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{v.applicants ?? 56}</p>
                      </div>
                      <div className="bg-muted/60 dark:bg-muted/20 p-3 rounded-xl text-center">
                        <p className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-bold mb-0.5">Match Score</p>
                        <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{v.matchScore ?? "72%"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-1">
                      <span className="px-2.5 py-0.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-lg text-[9px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        {v.tag ?? "Internal Review"}
                      </span>
                      <div className="w-6 h-6 rounded-full border border-border bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-[9px] font-bold text-amber-700 dark:text-amber-300">
                        +2
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
              onDrop={() => handleDrop("Closed")}
              className={`kanban-column flex flex-col gap-4 rounded-3xl p-2 transition-colors duration-300 ${dragOverColumn === "Closed" ? "bg-primary/5 border border-dashed border-primary/20" : ""}`}
            >
              <div className="flex items-center justify-between px-2 mb-2 shrink-0">
                <span className="text-[12px] font-bold text-slate-600 dark:text-slate-350 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>
                  Closed
                </span>
                <span className="bg-muted/80 dark:bg-muted/40 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                  {closedColumn.length}
                </span>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-260px)] hide-scrollbar pr-0.5">
                {closedColumn.map((v) => (
                  <div 
                    key={v.id} 
                    className="glass-card liquid-card rounded-[24px] p-6 flex flex-col gap-4 bg-muted/20 relative overflow-hidden group cursor-pointer"
                    onClick={() => toast.info(`Historial: ${v.title}`, { description: "Revisando métricas de contratación finalizadas." })}
                  >
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-xl bg-slate-500/10 dark:bg-slate-500/20 flex items-center justify-center text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="size-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <MoreVertical className="size-4 text-slate-500 dark:text-slate-400 cursor-pointer hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-foreground mb-1">
                        {v.title}
                      </h3>
                      <p className="text-xs text-slate-650 dark:text-slate-400 font-medium">
                        {v.description.includes("Contratada") ? v.description.split(".")[0] : `Hired: ${v.category || "Maria Garcia"}`}
                      </p>
                    </div>
                    
                    <div className="bg-indigo-500/5 dark:bg-indigo-500/10 p-4 rounded-xl flex items-center justify-between mt-1">
                      <div className="flex flex-col">
                        <p className="text-[9px] uppercase tracking-wider text-indigo-650 dark:text-indigo-350 font-bold mb-0.5">Hiring Cycle</p>
                        <p className="text-xs md:text-sm font-extrabold text-indigo-600 dark:text-indigo-300">{v.cycleTime ?? "14 Days"}</p>
                      </div>
                      <Award className="size-5 text-indigo-600 dark:text-indigo-300 fill-indigo-500/10" />
                    </div>
 
                    <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-1">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold italic">
                        {v.filledDate ?? "Cerrada recientemente"}
                      </span>
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
