"use client";

import * as React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { companyService } from "@/modules/company/services/company-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const modalities = ["Remoto", "Híbrido", "Presencial"] as const;
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
] as const;
const seniorities = [
  "Inicial",
  "Intermedio",
  "Avanzado",
  "Especialista",
  "Liderazgo",
] as const;
const contractTypes = [
  "Indefinido",
  "Temporal",
  "Freelance",
  "Prácticas",
] as const;
const employmentTypes = [
  "Tiempo completo",
  "Tiempo parcial",
  "Por proyecto",
] as const;
const currencies = ["USD", "EUR", "MXN", "ARS", "COP"] as const;

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsedValue = Number(value);
  return Number.isNaN(parsedValue) ? undefined : parsedValue;
}, z.number().positive().optional());

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
});

type VacancyFormValues = z.infer<typeof vacancySchema>;

interface Vacancy {
  id: string;
  title: string;
  description: string;
  modality: string;
  salary?: string | null;
  skills: string[];
  status: string;
  location?: string | null;
  category?: string | null;
  seniority?: string | null;
  contract_type?: string | null;
  employment_type?: string | null;
  vacancies_count?: number | null;
  application_deadline?: string | null;
  benefits?: string[] | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  created_at: string;
}

export function VacanciesManager({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const shouldCreate = searchParams.get("create") === "true";

  const [isCreating, setIsCreating] = React.useState(shouldCreate);
  const [vacancies, setVacancies] = React.useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadVacancies() {
      try {
        const data = await companyService.getVacancies(userId);
        setVacancies(data || []);
      } catch (error) {
        console.error("Error loading vacancies:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadVacancies();
  }, [userId]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancySchema as any),
    defaultValues: {
      title: "",
      description: "",
      modality: "Remoto",
      location: "",
      category: "",
      seniority: "",
      contract_type: "",
      employment_type: "",
      vacancies_count: 1,
      application_deadline: "",
      salary_min: undefined,
      salary_max: undefined,
      currency: "USD",
      skills: "",
      benefits: "",
    },
  });

  const onSubmit = async (data: VacancyFormValues) => {
    try {
      await companyService.createVacancy(userId, data);

      const updatedVacancies = await companyService.getVacancies(userId);
      setVacancies(updatedVacancies || []);

      setIsCreating(false);
      reset();
    } catch (error) {
      console.error("Error creating vacancy:", error);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl animate-in fade-in bg-background p-6 duration-700 md:p-12 lg:p-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 pb-8 border-b border-border">
        <div>
          <h1 className="mb-3 text-[40px] font-semibold leading-none tracking-tight text-foreground">
            Gestor de Vacantes
          </h1>
          <p className="text-[16px] font-normal tracking-wide text-muted-foreground">
            Publica y administra oportunidades laborales para cualquier sector.
          </p>
        </div>

        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            className="rounded-full font-semibold px-6 py-3 h-12 flex items-center gap-2 transition-all duration-300 shadow-none text-[15px]"
          >
            <Plus className="size-4" /> Nueva Vacante
          </Button>
        )}
      </div>

      {isCreating ? (
        <div className="animate-in zoom-in-95 duration-300 rounded-3xl border border-border bg-card p-8 shadow-none md:p-10">
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Crear Nueva Vacante
            </h2>
            <p className="text-sm text-muted-foreground">
              Completa los detalles clave para publicar una oferta clara y fácil
              de filtrar.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <section className="grid gap-6 rounded-2xl border border-border/60 bg-background p-6">
              <div className="grid gap-2">
                <Label
                  htmlFor="title"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Título del puesto
                </Label>
                <Input
                  id="title"
                  placeholder="Ej. Coordinador de operaciones"
                  className="h-12 rounded-2xl border-border bg-background text-foreground shadow-none"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="location"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Ubicación
                  </Label>
                  <Input
                    id="location"
                    placeholder="Ej. Ciudad de México, remoto o híbrido"
                    className="h-12 rounded-2xl border-border bg-background text-foreground shadow-none"
                    {...register("location")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Modalidad de trabajo
                  </Label>
                  <Controller
                    control={control}
                    name="modality"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl border-border bg-background text-foreground shadow-none">
                          <SelectValue placeholder="Selecciona una modalidad" />
                        </SelectTrigger>
                        <SelectContent>
                          {modalities.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.modality && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.modality.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Sector
                  </Label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl border-border bg-background text-foreground shadow-none">
                          <SelectValue placeholder="Selecciona un sector" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Nivel de experiencia
                  </Label>
                  <Controller
                    control={control}
                    name="seniority"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl border-border bg-background text-foreground shadow-none">
                          <SelectValue placeholder="Selecciona el nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          {seniorities.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-6 rounded-2xl border border-border/60 bg-background p-6">
              <div className="grid gap-2">
                <Label
                  htmlFor="description"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Descripción de la oportunidad
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe responsabilidades, objetivos, entorno de trabajo, requisitos y beneficios..."
                  className="min-h-40 rounded-2xl border-border bg-background text-foreground shadow-none"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Tipo de contratación
                  </Label>
                  <Controller
                    control={control}
                    name="contract_type"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl border-border bg-background text-foreground shadow-none">
                          <SelectValue placeholder="Selecciona un contrato" />
                        </SelectTrigger>
                        <SelectContent>
                          {contractTypes.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Jornada laboral
                  </Label>
                  <Controller
                    control={control}
                    name="employment_type"
                    render={({ field }) => (
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl border-border bg-background text-foreground shadow-none">
                          <SelectValue placeholder="Selecciona la jornada" />
                        </SelectTrigger>
                        <SelectContent>
                          {employmentTypes.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="vacancies_count"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Número de posiciones
                  </Label>
                  <Input
                    id="vacancies_count"
                    type="number"
                    min={1}
                    className="h-12 rounded-2xl border-border bg-background text-foreground shadow-none"
                    {...register("vacancies_count")}
                  />
                  {errors.vacancies_count && (
                    <p className="text-xs font-medium text-destructive">
                      {errors.vacancies_count.message?.toString()}
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="application_deadline"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Fecha límite de postulación
                  </Label>
                  <Input
                    id="application_deadline"
                    type="date"
                    className="h-12 rounded-2xl border-border bg-background text-foreground shadow-none"
                    {...register("application_deadline")}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-6 rounded-2xl border border-border/60 bg-background p-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label
                    htmlFor="salary_min"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Rango mínimo
                  </Label>
                  <Input
                    id="salary_min"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Ej. 2000"
                    className="h-12 rounded-2xl border-border bg-background text-foreground shadow-none"
                    {...register("salary_min")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="salary_max"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Rango máximo
                  </Label>
                  <Input
                    id="salary_max"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Ej. 3000"
                    className="h-12 rounded-2xl border-border bg-background text-foreground shadow-none"
                    {...register("salary_max")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Moneda
                  </Label>
                  <Controller
                    control={control}
                    name="currency"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-12 w-full rounded-2xl border-border bg-background text-foreground shadow-none">
                          <SelectValue placeholder="Moneda" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="skills"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Requisitos clave
                </Label>
                <Input
                  id="skills"
                  placeholder="Ej. comunicación, organización, atención al detalle"
                  className="h-12 rounded-2xl border-border bg-background text-foreground shadow-none"
                  {...register("skills")}
                />
                {errors.skills && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.skills.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="benefits"
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                >
                  Beneficios o condiciones
                </Label>
                <Input
                  id="benefits"
                  placeholder="Ej. seguro médico, comedor, formación, flexibilidad horaria"
                  className="h-12 rounded-2xl border-border bg-background text-foreground shadow-none"
                  {...register("benefits")}
                />
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsCreating(false);
                  reset();
                }}
                className="h-11 rounded-full px-6 font-semibold shadow-none"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-full px-6 font-semibold shadow-none"
              >
                {isSubmitting ? "Guardando..." : "Publicar Vacante"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vacantes..."
                className="pl-10 rounded-full h-11 transition-all"
              />
            </div>
            <Button
              variant="outline"
              className="rounded-full h-11 flex items-center justify-center gap-2 w-full md:w-auto px-6 font-semibold"
            >
              <Filter className="size-4" /> Filtros
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm font-medium">
                Cargando vacantes...
              </p>
            </div>
          ) : vacancies.length === 0 ? (
            <div className="rounded-3xl border border-border bg-muted px-6 py-16 text-center shadow-none">
              <p className="text-muted-foreground text-sm font-medium">
                No tienes vacantes publicadas aún.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {vacancies.map((vacancy) => (
                <div
                  key={vacancy.id}
                  className="group rounded-3xl border border-border bg-card p-8 shadow-none transition-colors duration-300 hover:border-primary"
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-[20px] font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-300 cursor-pointer">
                            {vacancy.title}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                              vacancy.status === "Activa"
                                ? "border-primary/20 bg-primary/10 text-primary"
                                : "border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {vacancy.status === "Activa" && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                            {vacancy.status}
                          </span>
                        </div>

                        {vacancy.salary && (
                          <div className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-muted px-3 py-0.5 text-[12px] font-semibold text-foreground">
                            <DollarSign className="size-3.5" />
                            {vacancy.salary}
                          </div>
                        )}
                      </div>

                      <span className="shrink-0 rounded-full border border-border bg-muted px-3.5 py-1 text-[12px] font-semibold uppercase tracking-wider text-foreground">
                        {vacancy.modality}
                      </span>
                    </div>

                    <p className="max-w-4xl text-sm font-normal leading-relaxed text-muted-foreground line-clamp-3">
                      {vacancy.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {vacancy.skills.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[12px] px-3 py-1 bg-muted text-foreground rounded-full font-semibold border border-transparent hover:bg-accent hover:border-foreground/10 transition-all duration-200 cursor-default"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-border mt-2">
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[12px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Briefcase className="size-4 text-muted-foreground" />
                          {vacancy.modality}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-4 text-muted-foreground" />
                          Publicado el{" "}
                          {new Date(vacancy.created_at).toLocaleDateString(
                            "es-ES",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </span>
                        <span className="flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-0.5 rounded-full border border-primary/15 font-semibold">
                          <Users className="size-4" />0 candidatos
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full h-9 text-[13px] font-semibold px-5 flex items-center gap-1.5"
                        >
                          <Edit className="size-4" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-full h-9 text-[13px] font-semibold px-5 shadow-none flex items-center gap-1.5"
                        >
                          Ver Postulantes <ExternalLink className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground shrink-0"
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
  );
}
