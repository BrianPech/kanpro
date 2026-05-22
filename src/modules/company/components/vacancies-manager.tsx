"use client"

import * as React from "react"
import { Plus, Search, Filter, Briefcase, Calendar, Users, MoreVertical, Edit, ExternalLink, DollarSign, ArrowRight } from "lucide-react"
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
  modality: z.enum(["Remoto", "Híbrido", "Presencial"]),
  salary: z.string().optional(),
  skills: z.string().min(1, "Ingresa al menos una habilidad (separadas por comas)"),
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
    resolver: zodResolver(vacancySchema as any),
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
    <div className="p-6 md:p-12 lg:p-16 max-w-[1200px] mx-auto w-full animate-in fade-in duration-700 bg-[#ffffff]">
      {/* Cabecera del Gestor */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 pb-8 border-b border-[#e2e2e7]">
        <div>
          <h1 className="text-[40px] font-semibold tracking-tight text-[#191c1f] leading-none mb-3">
            Gestor de Vacantes
          </h1>
          <p className="text-[16px] text-[#505a63] font-normal tracking-wide">
            Administra tus ofertas de empleo y encuentra el mejor talento.
          </p>
        </div>
        
        {!isCreating && (
          <Button 
            onClick={() => setIsCreating(true)}
            className="rounded-full bg-[#000000] hover:bg-[#191c1f] text-white font-semibold px-6 py-3 h-12 flex items-center gap-2 transition-all duration-300 shadow-none text-[15px]"
          >
            <Plus className="size-4" /> Nueva Vacante
          </Button>
        )}
      </div>

      {isCreating ? (
        /* Formulario de Creación (feature-card-light) */
        <div className="bg-[#ffffff] border border-[#e2e2e7] rounded-[20px] p-8 md:p-10 shadow-none animate-in zoom-in-95 duration-300">
          <div className="mb-8">
            <h2 className="text-[24px] font-semibold tracking-tight text-[#191c1f] mb-2">Crear Nueva Vacante</h2>
            <p className="text-[14px] text-[#505a63]">Completa los detalles de la oferta de empleo.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-[#505a63] mb-1">
                  Título de la Vacante
                </Label>
                <Input 
                  id="title" 
                  placeholder="Ej. Frontend Developer" 
                  className="rounded-[12px] border-[#e2e2e7] text-[#191c1f] bg-[#ffffff] h-12 focus-visible:ring-[#494fdf] focus-visible:border-[#494fdf] transition-all"
                  {...register("title")}
                />
                {errors.title && <p className="text-xs text-[#e23b4a] font-medium">{errors.title.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="modality" className="text-xs font-semibold uppercase tracking-wider text-[#505a63] mb-1">
                  Modalidad
                </Label>
                <select 
                  id="modality" 
                  className="flex h-12 w-full rounded-[12px] border border-[#e2e2e7] bg-[#ffffff] px-3 py-2 text-sm text-[#191c1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#494fdf] focus-visible:border-[#494fdf] transition-all"
                  {...register("modality")}
                >
                  <option value="Remoto">Remoto</option>
                  <option value="Híbrido">Híbrido</option>
                  <option value="Presencial">Presencial</option>
                </select>
                {errors.modality && <p className="text-xs text-[#e23b4a] font-medium">{errors.modality.message}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-[#505a63] mb-1">
                Descripción del Puesto
              </Label>
              <Textarea 
                id="description" 
                placeholder="Describe las responsabilidades, requisitos y beneficios..." 
                className="rounded-[12px] border-[#e2e2e7] text-[#191c1f] bg-[#ffffff] min-h-[150px] focus-visible:ring-[#494fdf] focus-visible:border-[#494fdf] transition-all"
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-[#e23b4a] font-medium">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="salary" className="text-xs font-semibold uppercase tracking-wider text-[#505a63] mb-1">
                  Presupuesto / Sueldo (Opcional)
                </Label>
                <Input 
                  id="salary" 
                  placeholder="Ej. $2,000 - $3,000" 
                  className="rounded-[12px] border-[#e2e2e7] text-[#191c1f] bg-[#ffffff] h-12 focus-visible:ring-[#494fdf] focus-visible:border-[#494fdf] transition-all"
                  {...register("salary")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="skills" className="text-xs font-semibold uppercase tracking-wider text-[#505a63] mb-1">
                  Habilidades requeridas (separadas por comas)
                </Label>
                <Input 
                  id="skills" 
                  placeholder="Ej. React, TypeScript, Figma" 
                  className="rounded-[12px] border-[#e2e2e7] text-[#191c1f] bg-[#ffffff] h-12 focus-visible:ring-[#494fdf] focus-visible:border-[#494fdf] transition-all"
                  {...register("skills")}
                />
                {errors.skills && <p className="text-xs text-[#e23b4a] font-medium">{errors.skills.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button 
                type="button" 
                onClick={() => {
                  setIsCreating(false)
                  reset()
                }}
                className="rounded-full bg-[#f4f4f4] hover:bg-[#e2e2e7] text-[#191c1f] font-semibold px-6 h-11 transition-all shadow-none border-none"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-full bg-[#000000] hover:bg-[#191c1f] text-white font-semibold px-6 h-11 transition-all shadow-none"
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
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full md:max-w-[400px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8d969e]" />
              <Input 
                placeholder="Buscar vacantes..." 
                className="pl-10 rounded-full border-[#e2e2e7] bg-[#ffffff] text-[#191c1f] h-11 focus-visible:ring-[#494fdf] focus-visible:border-[#494fdf] transition-all"
              />
            </div>
            <Button 
              variant="outline" 
              className="rounded-full h-11 border border-[#191c1f] bg-[#ffffff] text-[#191c1f] hover:bg-[#f4f4f4] transition-all flex items-center justify-center gap-2 w-full md:w-auto px-6 font-semibold"
            >
              <Filter className="size-4" /> Filtros
            </Button>
          </div>

          {/* Cargando */}
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-[#8d969e] text-sm font-medium">Cargando vacantes...</p>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="text-center py-16 bg-[#f4f4f4] border border-[#e2e2e7] rounded-[20px] shadow-none">
              <p className="text-[#505a63] text-sm font-medium">No tienes vacantes publicadas aún.</p>
            </div>
          ) : (
            /* Tarjetas de Vacantes (feature-card-light) */
            <div className="flex flex-col gap-6">
              {vacancies.map((vacancy) => (
                <div 
                  key={vacancy.id} 
                  className="bg-[#ffffff] border border-[#e2e2e7] rounded-[20px] p-8 transition-colors duration-300 hover:border-[#494fdf] shadow-none group"
                >
                  <div className="flex flex-col gap-6">
                    {/* Fila Superior: Título, Modalidad y Estado */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-[20px] font-semibold tracking-tight text-[#191c1f] group-hover:text-[#494fdf] transition-colors duration-300 cursor-pointer">
                            {vacancy.title}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                            vacancy.status === "Activa" 
                              ? "bg-[#00a87e]/10 text-[#006400] border-[#00a87e]/20" 
                              : "bg-[#ec7e00]/10 text-[#ec7e00] border-[#ec7e00]/20"
                          }`}>
                            {vacancy.status === "Activa" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00a87e]" />
                            )}
                            {vacancy.status}
                          </span>
                        </div>
                        
                        {vacancy.salary && (
                          <div className="inline-flex items-center gap-1 w-fit text-[12px] font-semibold text-[#006400] bg-[#00a87e]/10 border border-[#00a87e]/15 px-3 py-0.5 rounded-full">
                            <DollarSign className="size-3.5" />
                            {vacancy.salary}
                          </div>
                        )}
                      </div>

                      {/* Modalidad como Badge Principal (badge-tag) */}
                      <span className="text-[12px] px-3.5 py-1 bg-[#f4f4f4] text-[#191c1f] rounded-full font-semibold border border-[#e2e2e7]/40 uppercase tracking-wider shrink-0">
                        {vacancy.modality}
                      </span>
                    </div>

                    {/* Descripción */}
                    <p className="text-[14px] text-[#505a63] font-normal leading-relaxed max-w-[850px] line-clamp-3">
                      {vacancy.description}
                    </p>

                    {/* Habilidades / Skills (badge-tag) */}
                    <div className="flex flex-wrap gap-2">
                      {vacancy.skills.map((tag, i) => (
                        <span 
                          key={i} 
                          className="text-[12px] px-3 py-1 bg-[#f4f4f4] text-[#191c1f] rounded-full font-semibold border border-transparent hover:bg-[#e2e2e7] hover:border-[#191c1f]/10 transition-all duration-200 cursor-default"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Separador e Información de Pie de Tarjeta */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-[#e2e2e7] mt-2">
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[12px] text-[#8d969e] font-medium">
                        <span className="flex items-center gap-1.5 text-[#505a63]">
                          <Briefcase className="size-4 text-[#8d969e]" />
                          {vacancy.modality}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-4 text-[#8d969e]" />
                          Publicado el {new Date(vacancy.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1.5 bg-[#494fdf]/5 text-[#494fdf] px-3 py-0.5 rounded-full border border-[#494fdf]/15 font-semibold">
                          <Users className="size-4" />
                          0 candidatos
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full h-9 text-[13px] font-semibold px-5 border-[#191c1f] text-[#191c1f] hover:bg-[#f4f4f4] transition-all flex items-center gap-1.5"
                        >
                          <Edit className="size-4" /> Editar
                        </Button>
                        <Button 
                          size="sm" 
                          className="rounded-full h-9 text-[13px] font-semibold px-5 bg-[#000000] text-[#ffffff] hover:bg-[#191c1f] transition-all shadow-none flex items-center gap-1.5"
                        >
                          Ver Postulantes <ExternalLink className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-full text-[#8d969e] hover:text-[#191c1f] shrink-0"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
