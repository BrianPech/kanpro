"use client"

import * as React from "react"
import { Plus, Search, Filter, Briefcase, Calendar, Users, MoreVertical, Edit, Trash, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { companyService } from "@/modules/company/services/company-service"

// Esquema de validación con Zod
const vacancySchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  modality: z.enum(["Remoto", "Híbrido", "Presencial"], {
    errorMap: () => ({ message: "Selecciona una modalidad válida" }),
  }),
  salary: z.string().optional(),
  skills: z.string().min(1, "Ingresa al menos una habilidad (separadas por comas)"),
})

type VacancyFormValues = z.infer<typeof vacancySchema>

interface Vacancy {
  id: string
  title: string
  description: string
  modality: string
  salary?: string
  skills: string[]
  status: string
  created_at: string
}

export function VacanciesManager({ userId }: { userId: string }) {
  const searchParams = useSearchParams()
  const shouldCreate = searchParams.get("create") === "true"
  
  const [isCreating, setIsCreating] = React.useState(shouldCreate)
  const [vacancies, setVacancies] = React.useState<Vacancy[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadVacancies() {
      try {
        const data = await companyService.getVacancies(userId)
        setVacancies(data || [])
      } catch (error) {
        console.error("Error loading vacancies:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVacancies()
  }, [userId])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: "",
      description: "",
      modality: "Remoto",
      salary: "",
      skills: "",
    },
  })

  const onSubmit = async (data: VacancyFormValues) => {
    try {
      await companyService.createVacancy(userId, data)
      
      // Recargar vacantes
      const updatedVacancies = await companyService.getVacancies(userId)
      setVacancies(updatedVacancies || [])
      
      setIsCreating(false)
      reset()
    } catch (error) {
      console.error("Error creating vacancy:", error)
    }
  }

  return (
    <div className="p-6 md:p-12 lg:p-16 max-w-[1200px] mx-auto w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <h1 className="text-[40px] font-medium tracking-tight text-foreground mb-2">Gestor de Vacantes</h1>
          <p className="text-[16px] text-muted-foreground">Administra tus ofertas de empleo y encuentra el mejor talento.</p>
        </div>
        
        {!isCreating && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="rounded-full px-6 flex items-center gap-2"
          >
            <Plus className="size-4" /> Nueva Vacante
          </Button>
        )}
      </div>

      {isCreating ? (
        /* Formulario de Creación */
        <div className="bg-card border border-border/50 rounded-[24px] p-8 md:p-10 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="mb-8">
            <h2 className="text-[24px] font-medium tracking-tight mb-1">Crear Nueva Vacante</h2>
            <p className="text-sm text-muted-foreground">Completa los detalles de la oferta de empleo.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title" className="text-sm font-medium">Título de la Vacante</Label>
                <Input 
                  id="title" 
                  placeholder="Ej. Frontend Developer" 
                  className="rounded-xl"
                  {...register("title")}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="modality" className="text-sm font-medium">Modalidad</Label>
                <select 
                  id="modality" 
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("modality")}
                >
                  <option value="Remoto">Remoto</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Presencial">Presencial</option>
                </select>
                {errors.modality && <p className="text-xs text-destructive">{errors.modality.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-sm font-medium">Descripción del Puesto</Label>
              <Textarea 
                id="description" 
                placeholder="Describe las responsabilidades, requisitos y beneficios..." 
                className="rounded-xl min-h-[150px]"
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="salary" className="text-sm font-medium">Presupuesto / Sueldo (Opcional)</Label>
                <Input 
                  id="salary" 
                  placeholder="Ej. $2,000 - $3,000" 
                  className="rounded-xl"
                  {...register("salary")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="skills" className="text-sm font-medium">Habilidades requeridas (separadas por comas)</Label>
                <Input 
                  id="skills" 
                  placeholder="Ej. React, TypeScript, Figma" 
                  className="rounded-xl"
                  {...register("skills")}
                />
                {errors.skills && <p className="text-xs text-destructive">{errors.skills.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="rounded-full px-6"
                onClick={() => {
                  setIsCreating(false)
                  reset()
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="rounded-full px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Publicar Vacante"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        /* Lista de Vacantes */
        <div className="flex flex-col gap-6">
          {/* Barra de búsqueda y filtros */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-2">
            <div className="relative w-full md:max-w-[400px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar vacantes..." 
                className="pl-10 rounded-full bg-card/50"
              />
            </div>
            <Button variant="outline" className="rounded-full flex items-center gap-2 w-full md:w-auto">
              <Filter className="size-4" /> Filtros
            </Button>
          </div>

          {/* Cargando */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando vacantes...</p>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 border border-dashed border-border rounded-[24px]">
              <p className="text-muted-foreground">No tienes vacantes publicadas aún.</p>
            </div>
          ) : (
            /* Tarjetas de Vacantes */
            vacancies.map((vacancy) => (
              <div 
                key={vacancy.id} 
                className="bg-card border border-border/50 rounded-[24px] p-6 md:p-8 hover:border-border transition-all duration-300 group shadow-sm"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[20px] font-medium tracking-tight text-foreground group-hover:text-primary transition-colors cursor-pointer">
                        {vacancy.title}
                      </h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        vacancy.status === "Activa" 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {vacancy.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground max-w-[700px] line-clamp-2">
                      {vacancy.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {vacancy.skills.map((tag, i) => (
                        <span key={i} className="text-[11px] px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="size-3.5" />
                        {vacancy.modality}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5" />
                        Publicado el {new Date(vacancy.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        0 postulantes
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-between items-end gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                      <MoreVertical className="size-4" />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="rounded-full text-xs font-medium flex items-center gap-1.5">
                        <Edit className="size-3.5" /> Editar
                      </Button>
                      <Button size="sm" className="rounded-full text-xs font-medium flex items-center gap-1.5">
                        Ver Postulantes <ExternalLink className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
