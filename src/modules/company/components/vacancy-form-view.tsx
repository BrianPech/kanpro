"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ArrowLeft,
  Plus,
  MapPin,
  Sparkles,
  Briefcase,
  Phone,
  Check,
  X,
  PlusCircle,
  Building,
  Edit2,
  Save,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { revalidateVacancies } from "../actions/vacancies";

// Standard categories for operatives/comerciales in local market
const categories = [
  "Alimentos y Bebidas",
  "Hotelería y Turismo",
  "Mantenimiento y Limpieza",
  "Ventas y Comercio",
  "Administración y Operaciones",
  "Atención al Cliente",
  "Otro",
] as const;

// Zod Schema matching requirements
const vacancySchema = z
  .object({
    title: z.string().min(3, "El título del puesto debe tener al menos 3 caracteres"),
    category: z.string().min(1, "Selecciona una categoría para el puesto"),
    employment_type: z.enum([
      "Tiempo Completo",
      "Medio Tiempo",
      "Turno Rotativo",
      "Eventual",
    ]),
    salary_min: z
      .string()
      .optional()
      .refine(
        (val) => !val || (!isNaN(Number(val)) && Number(val) > 0),
        "El salario mínimo debe ser mayor a 0"
      ),
    salary_max: z
      .string()
      .optional()
      .refine(
        (val) => !val || (!isNaN(Number(val)) && Number(val) > 0),
        "El salario máximo debe ser mayor a 0"
      ),
    description: z
      .string()
      .min(10, "Describe las funciones y requisitos (mínimo 10 caracteres)"),
    use_alternative_location: z.boolean(),
    alternative_location: z.string().optional(),
    benefits: z.array(z.string()),
  })
  .refine(
    (data) => {
      if (data.salary_min && data.salary_max) {
        return Number(data.salary_max) >= Number(data.salary_min);
      }
      return true;
    },
    {
      message: "El salario máximo debe ser mayor o igual al salario mínimo",
      path: ["salary_max"],
    }
  )
  .refine(
    (data) => {
      if (data.use_alternative_location) {
        return (
          !!data.alternative_location &&
          data.alternative_location.trim().length >= 3
        );
      }
      return true;
    },
    {
      message: "Especifica la dirección o sucursal alternativa",
      path: ["alternative_location"],
    }
  );

export type VacancyFormValues = z.infer<typeof vacancySchema>;

export interface VacancyFormViewProps {
  userId: string;
  vacancyId?: string; // If provided, mode is EDITing an existing vacancy; otherwise CREATE
}

export function VacancyFormView({ userId, vacancyId }: VacancyFormViewProps) {
  const router = useRouter();
  const isEditMode = Boolean(vacancyId);

  const DRAFT_KEY = `kanpro_vacancy_draft_${userId}`;
  const isSubmittingRef = React.useRef(false);

  const [draftLoaded, setDraftLoaded] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [loadingVacancy, setLoadingVacancy] = React.useState(isEditMode);
  const [profile, setProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [customBenefitText, setCustomBenefitText] = React.useState("");

  // Initialize React Hook Form
  const form = useForm<VacancyFormValues>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: "",
      category: "",
      employment_type: "Tiempo Completo",
      description: "",
      salary_min: "",
      salary_max: "",
      use_alternative_location: false,
      alternative_location: "",
      benefits: [],
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = form;

  const useAlternativeLocation = watch("use_alternative_location");
  const selectedBenefits = watch("benefits") || [];
  const currentEmploymentType = watch("employment_type");

  // Helper to clear draft and reset form completely
  const handleClearDraft = React.useCallback(() => {
    isSubmittingRef.current = true;
    if (typeof window !== "undefined") {
      localStorage.removeItem(DRAFT_KEY);
    }
    reset({
      title: "",
      category: "",
      employment_type: "Tiempo Completo",
      description: "",
      salary_min: "",
      salary_max: "",
      use_alternative_location: false,
      alternative_location: "",
      benefits: [],
    });
    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 100);
    toast.info("Formulario limpiado", {
      description: "Se ha descartado el borrador anterior.",
    });
  }, [DRAFT_KEY, reset]);

  // Load company profile values
  const loadProfile = React.useCallback(async () => {
    try {
      setLoadingProfile(true);
      const supabase = createClient();

      const { data: baseProfile } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", userId)
        .single();

      const { data: rawCompProfile } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const compProfile = rawCompProfile as any;

      const company_name = compProfile?.company_name || baseProfile?.full_name || "";
      const phone = compProfile?.contact_phone || "configurado";
      const location = compProfile?.fiscal_address || baseProfile?.location || "";

      setProfile({
        company_name,
        phone,
        logo_url: compProfile?.logo_url || null,
        location,
        address_details: compProfile?.address_details || "",
        operation_hours: compProfile?.operation_hours || "",
      });
    } catch (err) {
      console.error("Error loading company profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  // Load existing vacancy in EDIT mode
  const loadVacancy = React.useCallback(async () => {
    if (!vacancyId) return;
    try {
      setLoadingVacancy(true);
      const supabase = createClient();

      // Ensure create draft is cleared in EDIT mode
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_KEY);
      }

      const { data, error } = await supabase
        .from("vacancies")
        .select("*")
        .eq("id", vacancyId)
        .single();

      if (error) throw error;
      if (data) {
        const perks: string[] = Array.isArray(data.benefits)
          ? data.benefits
          : typeof data.benefits === "string"
          ? (data.benefits as any).split(",").map((b: string) => b.trim()).filter(Boolean)
          : [];

        const isAltLoc = Boolean(data.zone && data.location && data.zone !== data.location);

        reset({
          title: data.title || "",
          category: data.category || "",
          employment_type: (data.employment_type as any) || "Tiempo Completo",
          description: data.description || data.requirements || "",
          salary_min: data.salary_min != null ? String(data.salary_min) : "",
          salary_max: data.salary_max != null ? String(data.salary_max) : "",
          use_alternative_location: isAltLoc,
          alternative_location: isAltLoc ? data.zone || "" : "",
          benefits: perks,
        });
      }
    } catch (err: any) {
      console.error("Error loading vacancy:", err);
      toast.error("Error al cargar datos de la vacante", {
        description: err.message,
      });
    } finally {
      setLoadingVacancy(false);
    }
  }, [vacancyId, reset, DRAFT_KEY]);

  React.useEffect(() => {
    loadProfile();
    if (isEditMode) {
      loadVacancy();
    } else {
      // In CREATE mode: reset form first
      reset({
        title: "",
        category: "",
        employment_type: "Tiempo Completo",
        description: "",
        salary_min: "",
        salary_max: "",
        use_alternative_location: false,
        alternative_location: "",
        benefits: [],
      });

      // Restore draft if present
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(DRAFT_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === "object" && (parsed.title || parsed.description)) {
              reset({
                title: parsed.title || "",
                category: parsed.category || "",
                employment_type: parsed.employment_type || "Tiempo Completo",
                description: parsed.description || "",
                salary_min: parsed.salary_min || "",
                salary_max: parsed.salary_max || "",
                use_alternative_location: Boolean(parsed.use_alternative_location),
                alternative_location: parsed.alternative_location || "",
                benefits: Array.isArray(parsed.benefits) ? parsed.benefits : [],
              });
            }
          }
        } catch (e) {
          console.error("Error restoring vacancy draft:", e);
        }
      }
      setDraftLoaded(true);
    }
  }, [loadProfile, isEditMode, loadVacancy, reset, DRAFT_KEY]);

  // Load default benefits for CREATE mode IF no draft existed
  React.useEffect(() => {
    if (!isEditMode && profile && draftLoaded) {
      const saved = typeof window !== "undefined" ? localStorage.getItem(DRAFT_KEY) : null;
      if (!saved) {
        const defaultPerks: string[] = [];
        if (profile.benefit_imss) defaultPerks.push("Prestaciones de Ley");
        if (profile.benefit_tips) defaultPerks.push("Propinas");
        if (profile.benefit_canteen) defaultPerks.push("Comedor de empleados");
        if (profile.benefit_uniforms) defaultPerks.push("Uniformes");
        if (profile.benefit_growth) defaultPerks.push("Capacitación / Crecimiento");
        if (profile.has_transport) defaultPerks.push("Transporte de personal");
        setValue("benefits", defaultPerks);
      }
    }
  }, [profile, draftLoaded, setValue, DRAFT_KEY, isEditMode]);

  // Auto-save draft ONLY in CREATE mode, when NOT submitting, and when form has actual title/description
  const allValues = watch();
  React.useEffect(() => {
    if (isEditMode || !draftLoaded || isSubmittingRef.current || typeof window === "undefined") return;

    const hasContent = Boolean(allValues.title?.trim() || allValues.description?.trim());
    if (!hasContent) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(allValues));
    } catch (e) {
      console.error("Error saving vacancy draft:", e);
    }
  }, [allValues, draftLoaded, DRAFT_KEY, isEditMode]);

  // Toggle benefit pill
  const handleToggleBenefit = (perk: string) => {
    const active = selectedBenefits.includes(perk);
    if (active) {
      setValue(
        "benefits",
        selectedBenefits.filter((b) => b !== perk)
      );
    } else {
      setValue("benefits", [...selectedBenefits, perk]);
    }
  };

  // Add custom benefit item
  const handleAddCustomBenefit = () => {
    const text = customBenefitText.trim();
    if (!text) return;

    if (selectedBenefits.includes(text)) {
      toast.error("Este beneficio ya está agregado");
      return;
    }

    setValue("benefits", [...selectedBenefits, text]);
    setCustomBenefitText("");
    toast.success("Beneficio adicional agregado");
  };

  const onSubmit = async (values: VacancyFormValues) => {
    setPublishing(true);
    isSubmittingRef.current = true;
    try {
      const supabase = createClient();

      const resolvedZone = values.use_alternative_location
        ? values.alternative_location
        : `${profile?.location || ""}${
            profile?.address_details ? ` (${profile.address_details})` : ""
          }`;

      const numMin = values.salary_min && !isNaN(Number(values.salary_min)) ? Number(values.salary_min) : null;
      const numMax = values.salary_max && !isNaN(Number(values.salary_max)) ? Number(values.salary_max) : null;

      if (isEditMode && vacancyId) {
        // Update Mode
        const { error } = await supabase
          .from("vacancies")
          .update({
            title: values.title,
            category: values.category,
            employment_type: values.employment_type,
            salary_min: numMin,
            salary_max: numMax,
            requirements: values.description,
            description: values.description,
            zone: resolvedZone,
            benefits: values.benefits,
            updated_at: new Date().toISOString(),
          })
          .eq("id", vacancyId);

        if (error) {
          console.error("Database update error:", error);
          throw error;
        }

        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_KEY);
        }

        toast.success("¡Vacante actualizada!", {
          description: `Se guardaron los cambios para "${values.title}".`,
        });
      } else {
        // Insert Mode
        const { error } = await supabase.from("vacancies").insert({
          company_id: userId,
          recruiter_id: userId,
          title: values.title,
          category: values.category,
          employment_type: values.employment_type,
          salary_min: numMin,
          salary_max: numMax,
          currency: "MXN",
          requirements: values.description,
          description: values.description,
          modality: "Presencial",
          status: "Activa" as any,
          is_active: true,
          zone: resolvedZone || "Mérida - Centro",
          location: profile?.location || "Mérida - Centro",
          benefits: values.benefits,
        });

        if (error) {
          console.error("Database insert error:", error);
          throw error;
        }

        // Purge draft from localStorage irrevocably
        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_KEY);
        }

        toast.success("¡Vacante publicada!", {
          description: `Se registró "${values.title}" en tus puestos activos.`,
        });
      }

      await revalidateVacancies();
      router.push("/dashboard/company/vacancies");
    } catch (err: any) {
      isSubmittingRef.current = false;
      toast.error(isEditMode ? "Error al actualizar la vacante" : "Error al publicar la vacante", {
        description: err.message || "No se pudieron guardar los cambios",
      });
    } finally {
      setPublishing(false);
    }
  };

  const isProfileIncomplete = React.useMemo(() => {
    if (loadingProfile) return false;
    if (!profile) return false;

    const name = profile.company_name?.trim() || "";
    const addr = profile.location?.trim() || "";

    return !name || name === "Nueva Empresa" || !addr;
  }, [profile, loadingProfile]);

  if (loadingVacancy) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
      {/* Header back button row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="rounded-xl border border-fiord-100/80 dark:border-fiord-800/80 bg-white dark:bg-fiord-900/10 hover:bg-fiord-50 dark:hover:bg-fiord-900/40 text-xs sm:text-sm font-bold flex items-center gap-2 px-4 h-10"
          >
            <Link href="/dashboard/company/vacancies">
              <ArrowLeft className="size-4 text-fiord-700 dark:text-fiord-350" />
              <span>Volver a Vacantes</span>
            </Link>
          </Button>
        </div>

        {!isEditMode && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearDraft}
            className="rounded-xl h-9 px-3.5 text-xs font-bold border-fiord-200 dark:border-fiord-800 text-fiord-700 dark:text-fiord-300 hover:bg-fiord-50 gap-1.5"
          >
            <RotateCcw className="size-3.5 text-fiord-500" />
            Limpiar borrador
          </Button>
        )}
      </div>

      {isProfileIncomplete && !loadingProfile && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Perfil de Empresa Incompleto
              </h4>
              <p className="text-xs font-semibold leading-relaxed text-amber-600 dark:text-amber-350">
                Para gestionar ofertas express, completa la información de tu negocio (Nombre, WhatsApp y Dirección) en Mi Perfil.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="w-full sm:w-fit h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shrink-0 border-none"
          >
            <Link href="/dashboard/company/profile">Completar Perfil</Link>
          </Button>
        </div>
      )}

      {/* FORM CONTENT CONTAINER */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* BLOCK 1: DETALLES DE LA VACANTE */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] overflow-hidden shadow-xs">
          <CardHeader className="p-6 md:p-8 border-b border-fiord-100/40 dark:border-fiord-800/30">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-fiord-50 dark:bg-fiord-900/40 text-fiord-950 dark:text-fiord-50 flex items-center justify-center shrink-0">
                {isEditMode ? <Edit2 className="size-4.5" /> : <Briefcase className="size-4.5" />}
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold text-fiord-900 dark:text-fiord-50">
                  {isEditMode ? "Editar Detalles de Vacante" : "Información de la Vacante"}
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-fiord-450 dark:text-fiord-500 mt-0.5">
                  Campos obligatorios relativos a la oferta de trabajo.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Título del Puesto *
              </Label>
              <Input
                id="title"
                placeholder="Ej. Ayudante de Cocina, Recepcionista, Mesero(a)"
                {...register("title")}
                disabled={isProfileIncomplete}
                className="h-12 rounded-xl text-xs font-semibold border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all px-4"
              />
              {errors.title && (
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Categoría *
              </Label>
              <Select
                value={watch("category")}
                onValueChange={(val) => setValue("category", val)}
                disabled={isProfileIncomplete}
              >
                <SelectTrigger id="category" className="w-full h-12 rounded-xl text-xs font-semibold border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-900 dark:text-fiord-100 focus:ring-1 focus:ring-fiord-300 dark:focus:ring-fiord-700 transition-all px-4">
                  <SelectValue placeholder="Selecciona una categoría comercial" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-fiord-100 dark:border-fiord-800 bg-white dark:bg-fiord-950">
                  {categories.map((cat, i) => (
                    <SelectItem key={i} value={cat} className="text-xs font-semibold">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Employment Type Radio/Pills */}
            <div className="space-y-2.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Tipo de Jornada *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  "Tiempo Completo",
                  "Medio Tiempo",
                  "Turno Rotativo",
                  "Eventual",
                ].map((type) => {
                  const active = currentEmploymentType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isProfileIncomplete}
                      onClick={() => setValue("employment_type", type as any)}
                      className={cn(
                        "h-11 rounded-xl text-xs font-bold transition-all border flex items-center justify-center px-3",
                        active
                          ? "bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 border-fiord-950 dark:border-fiord-50 shadow-xs"
                          : "bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-700 dark:text-fiord-300 border-fiord-100 dark:border-fiord-800 hover:bg-fiord-50 dark:hover:bg-fiord-900/40"
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Salary Range (Min and Max) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="salary_min" className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                  Salario Mínimo Mensual (MXN)
                </Label>
                <div className="relative rounded-xl border border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 flex items-center overflow-hidden">
                  <span className="pl-3.5 pr-2.5 py-3 text-[11px] font-bold text-fiord-450 dark:text-fiord-500 border-r border-fiord-100/50 dark:border-fiord-800/40 select-none shrink-0">
                    $ MXN
                  </span>
                  <input
                    id="salary_min"
                    type="number"
                    min="0"
                    placeholder="Ej. 10000"
                    {...register("salary_min")}
                    disabled={isProfileIncomplete}
                    className="w-full h-11 px-3 text-xs font-semibold bg-transparent border-none outline-none text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500"
                  />
                </div>
                {errors.salary_min && (
                  <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                    {errors.salary_min.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_max" className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                  Salario Máximo Mensual (MXN)
                </Label>
                <div className="relative rounded-xl border border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 flex items-center overflow-hidden">
                  <span className="pl-3.5 pr-2.5 py-3 text-[11px] font-bold text-fiord-450 dark:text-fiord-500 border-r border-fiord-100/50 dark:border-fiord-800/40 select-none shrink-0">
                    $ MXN
                  </span>
                  <input
                    id="salary_max"
                    type="number"
                    min="0"
                    placeholder="Ej. 15000"
                    {...register("salary_max")}
                    disabled={isProfileIncomplete}
                    className="w-full h-11 px-3 text-xs font-semibold bg-transparent border-none outline-none text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500"
                  />
                </div>
                {errors.salary_max && (
                  <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                    {errors.salary_max.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Funciones y Requisitos del Puesto *
              </Label>
              <Textarea
                id="description"
                placeholder="Ej. Se solicita mesero con experiencia de 6 meses en hotelería, inglés conversacional básico, manejo de charolas y buena actitud de servicio..."
                {...register("description")}
                disabled={isProfileIncomplete}
                className="min-h-32 rounded-xl text-xs font-semibold border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all resize-none shadow-none leading-relaxed px-5 py-4"
              />
              {errors.description && (
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BLOCK 2: SUBCONSULTA / UBICACIÓN */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] overflow-hidden shadow-xs">
          <CardHeader className="p-6 md:p-8 border-b border-fiord-100/40 dark:border-fiord-800/30">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-fiord-50 dark:bg-fiord-900/40 text-fiord-950 dark:text-fiord-50 flex items-center justify-center shrink-0">
                <MapPin className="size-4.5 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold text-fiord-900 dark:text-fiord-50">
                  Ubicación de Trabajo
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-fiord-450 dark:text-fiord-500 mt-0.5">
                  Lugar donde se prestarán las funciones laborales.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="p-4 rounded-xl bg-fiord-50/40 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fiord-900 dark:text-fiord-100">
                  📍 Ubicación de la Empresa Registrada:
                </span>
              </div>
              <p className="text-xs font-semibold text-fiord-600 dark:text-fiord-400">
                {profile?.location || "Mérida - Centro"}{" "}
                {profile?.address_details ? `(${profile.address_details})` : ""}
              </p>
            </div>

            {/* Checkbox para dirección alternativa */}
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="use_alternative_location"
                checked={useAlternativeLocation}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  setValue("use_alternative_location", Boolean(checked))
                }
                disabled={isProfileIncomplete}
                className="mt-0.5 rounded-md border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50"
              />
              <div className="space-y-1">
                <Label
                  htmlFor="use_alternative_location"
                  className="text-xs font-bold text-fiord-900 dark:text-fiord-100 cursor-pointer"
                >
                  Especificar una sucursal o dirección diferente
                </Label>
                <p className="text-[11px] font-semibold text-fiord-450 dark:text-fiord-500 leading-snug">
                  Activa esta casilla si la vacante es para una sucursal o lugar distinto a tu dirección principal.
                </p>
              </div>
            </div>

            {useAlternativeLocation && (
              <div className="pt-2 space-y-2 animate-in fade-in duration-200">
                <Label
                  htmlFor="alternative_location"
                  className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1"
                >
                  Dirección o Sucursal Alternativa *
                </Label>
                <Input
                  id="alternative_location"
                  placeholder="Ej. Sucursal Altabrisa, Calle 7 #123 x 24 y 26"
                  {...register("alternative_location")}
                  disabled={isProfileIncomplete}
                  className="h-12 rounded-xl text-xs font-semibold border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 transition-all px-4"
                />
                {errors.alternative_location && (
                  <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                    {errors.alternative_location.message}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BLOCK 3: BENEFICIOS Y PRESTACIONES */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] overflow-hidden shadow-xs">
          <CardHeader className="p-6 md:p-8 border-b border-fiord-100/40 dark:border-fiord-800/30">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="size-4.5" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold text-fiord-900 dark:text-fiord-50">
                  Beneficios e Incentivos de la Oferta
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-fiord-450 dark:text-fiord-500 mt-0.5">
                  Incentiva la postulación destacando los beneficios del puesto.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Standard Benefits Pills */}
            <div className="space-y-3">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Selecciona los beneficios incluidos
              </Label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  "Prestaciones de Ley",
                  "Propinas",
                  "Comedor de empleados",
                  "Uniformes",
                  "Capacitación / Crecimiento",
                  "Transporte de personal",
                  "Seguro de Vida",
                  "Bono de Puntualidad",
                ].map((perk) => {
                  const active = selectedBenefits.includes(perk);
                  return (
                    <button
                      key={perk}
                      type="button"
                      disabled={isProfileIncomplete}
                      onClick={() => handleToggleBenefit(perk)}
                      className={cn(
                        "h-10 px-4 rounded-xl text-xs font-bold transition-all border flex items-center gap-2",
                        active
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-700 dark:text-fiord-300 border-fiord-100 dark:border-fiord-800 hover:bg-fiord-50"
                      )}
                    >
                      <Check
                        className={cn(
                          "size-3.5 transition-opacity",
                          active ? "opacity-100 text-emerald-600" : "opacity-0"
                        )}
                      />
                      <span>{perk}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Benefit Input */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="custom_benefit" className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                Agregar otro beneficio personalizado
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="custom_benefit"
                  value={customBenefitText}
                  onChange={(e) => setCustomBenefitText(e.target.value)}
                  placeholder="Ej. Descuento en productos de la tienda"
                  disabled={isProfileIncomplete}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomBenefit();
                    }
                  }}
                  className="h-11 rounded-xl text-xs font-semibold border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomBenefit}
                  disabled={isProfileIncomplete || !customBenefitText.trim()}
                  className="h-11 rounded-xl px-4 bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 font-bold text-xs shrink-0"
                >
                  <Plus className="size-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Active Benefits List */}
            {selectedBenefits.length > 0 && (
              <div className="p-4 rounded-xl bg-fiord-50/30 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-fiord-400">
                  Beneficios seleccionados ({selectedBenefits.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedBenefits.map((item, idx) => (
                    <Badge
                      key={idx}
                      className="bg-white dark:bg-fiord-900 text-fiord-900 dark:text-fiord-100 border border-fiord-200 dark:border-fiord-700 px-3 py-1 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleBenefit(item)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SUBMIT BUTTON ROW */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="ghost"
            asChild
            className="h-12 rounded-xl px-6 text-xs font-bold text-fiord-600 dark:text-fiord-400 hover:text-fiord-950 dark:hover:text-fiord-50"
          >
            <Link href="/dashboard/company/vacancies">Cancelar</Link>
          </Button>

          <Button
            type="submit"
            disabled={publishing || isProfileIncomplete}
            className="h-12 rounded-xl px-8 bg-fiord-950 hover:bg-fiord-900 dark:bg-fiord-50 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {publishing ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                {isEditMode ? "Guardando cambios..." : "Publicando vacante..."}
              </>
            ) : isEditMode ? (
              <>
                <Save className="size-4 mr-2" />
                Guardar Cambios
              </>
            ) : (
              <>
                <PlusCircle className="size-4 mr-2" />
                Publicar Vacante
              </>
            )}
          </Button>
        </div>

      </form>
    </motion.div>
  );
}
