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
const newVacancySchema = z
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
    // Alternative branch/location toggle
    use_alternative_location: z.boolean(),
    alternative_location: z.string().optional(),
    // Toggleable benefits array
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

type NewVacancyFormValues = z.infer<typeof newVacancySchema>;

export function VacancyFormView({ userId }: { userId: string }) {
  const router = useRouter();
  const [publishing, setPublishing] = React.useState(false);
  const [profile, setProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [customBenefitText, setCustomBenefitText] = React.useState("");

  // Initialize React Hook Form
  const form = useForm<NewVacancyFormValues>({
    resolver: zodResolver(newVacancySchema),
    defaultValues: {
      title: "",
      category: "",
      employment_type: "Tiempo Completo",
      description: "",
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
    formState: { errors },
  } = form;

  const useAlternativeLocation = watch("use_alternative_location");
  const selectedBenefits = watch("benefits");
  const currentEmploymentType = watch("employment_type");

  // Load profile values
  const loadProfile = React.useCallback(async () => {
    try {
      setLoadingProfile(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("profiles_view")
        .select(`
          company_name, 
          phone, 
          logo_url, 
          location, 
          is_validated, 
          address_details, 
          has_transport, 
          benefit_canteen, 
          benefit_tips, 
          benefit_imss, 
          benefit_uniforms, 
          benefit_growth, 
          operation_hours
        `)
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error loading company profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load default benefits once profile is ready
  React.useEffect(() => {
    if (profile) {
      const defaultPerks: string[] = [];
      if (profile.benefit_imss) defaultPerks.push("Prestaciones de Ley");
      if (profile.benefit_tips) defaultPerks.push("Propinas");
      if (profile.benefit_canteen) defaultPerks.push("Comedor de empleados");
      if (profile.benefit_uniforms) defaultPerks.push("Uniformes");
      if (profile.benefit_growth) defaultPerks.push("Capacitación / Crecimiento");
      if (profile.has_transport) defaultPerks.push("Transporte de personal");
      setValue("benefits", defaultPerks);
    }
  }, [profile, setValue]);

  // Toggle standard perk checkbox in pills list
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

  // Add custom benefit item to list
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

  const onSubmit = async (values: NewVacancyFormValues) => {
    setPublishing(true);
    try {
      const supabase = createClient();

      // Resolve final zone/location based on alternative address toggle
      const resolvedZone = values.use_alternative_location
        ? values.alternative_location
        : `${profile?.location || ""}${
            profile?.address_details ? ` (${profile.address_details})` : ""
          }`;

      const { error } = await supabase.from("vacancies").insert({
        company_id: userId,
        recruiter_id: userId,
        title: values.title,
        category: values.category,
        employment_type: values.employment_type,
        salary_min: values.salary_min ?? null,
        salary_max: values.salary_max ?? null,
        requirements: values.description,
        description: values.description,
        modality: "Presencial",
        status: "Activa",
        is_active: true,
        zone: resolvedZone,
        location: profile?.location || "Mérida - Centro",
        benefits: values.benefits,
      });

      if (error) throw error;

      toast.success("¡Vacante publicada!", {
        description: `Se registró "${values.title}" en tus puestos activos.`,
      });

      await revalidateVacancies();
      router.push("/dashboard/company/vacancies");
    } catch (err: any) {
      toast.error("Error al publicar la vacante", {
        description: err.message,
      });
    } finally {
      setPublishing(false);
    }
  };

  const isProfileIncomplete = React.useMemo(() => {
    if (loadingProfile) return false;
    if (!profile) return true;

    const name = profile.company_name?.trim() || "";
    const wp = profile.phone?.trim() || "";
    const addr = profile.location?.trim() || "";

    return !name || !wp || !addr;
  }, [profile, loadingProfile]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
      {/* Header back button row */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="rounded-xl border border-fiord-100/80 dark:border-fiord-800/80 bg-white dark:bg-fiord-900/10 hover:bg-fiord-50 dark:hover:bg-fiord-900/40"
        >
          <Link href="/dashboard/company/vacancies">
            <ArrowLeft className="size-4 text-fiord-700 dark:text-fiord-350" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-fiord-900 dark:text-fiord-50 tracking-tight">
            Crear Nueva Vacante
          </h1>
          <p className="text-xs text-fiord-450 dark:text-fiord-500 font-semibold mt-0.5">
            Publica puestos activos heredando la información de la sucursal.
          </p>
        </div>
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
                Para comenzar a publicar ofertas express, completa la información de tu negocio (Nombre, WhatsApp y Dirección) en la sección de Mi Perfil.
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

      {/* ========================================== */}
      {/* FORM CONTENT CONTAINER                     */}
      {/* ========================================== */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* BLOCK 1: DETALLES DE LA VACANTE */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] overflow-hidden shadow-xs">
          <CardHeader className="p-6 md:p-8 border-b border-fiord-100/40 dark:border-fiord-800/30">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-fiord-50 dark:bg-fiord-900/40 text-fiord-950 dark:text-fiord-50 flex items-center justify-center shrink-0">
                <Briefcase className="size-4.5" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold text-fiord-900 dark:text-fiord-50">
                  Información de la Vacante
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-fiord-450 dark:text-fiord-500 mt-0.5">
                  Campos obligatorios relativos a la oferta de trabajo actual.
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
                placeholder="Ej. Mesero / Mesera - Turno Matutino"
                {...register("title")}
                disabled={isProfileIncomplete}
                className="h-12 rounded-xl text-xs font-semibold border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-900 dark:text-fiord-100 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all outline-none"
              />
              {errors.title && (
                <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Select */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                  Categoría / Sector *
                </Label>
                <Select
                  value={watch("category") || ""}
                  onValueChange={(val) => setValue("category", val, { shouldValidate: true })}
                  disabled={isProfileIncomplete}
                >
                  <SelectTrigger id="category" className="w-full h-11 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl px-4 text-xs font-semibold text-fiord-900 dark:text-fiord-100 focus:ring-1 focus:ring-fiord-300 dark:focus:ring-fiord-700 focus:border-fiord-300 transition-all outline-none shadow-none">
                    <SelectValue placeholder="Selecciona el sector" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-fiord-100 dark:border-fiord-800 bg-popover text-xs">
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
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

              {/* Employment Type Selector (Pills) */}
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                  Tipo de Jornada *
                </Label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {["Tiempo Completo", "Medio Tiempo", "Turno Rotativo", "Eventual"].map((type) => {
                    const isActive = currentEmploymentType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue("employment_type", type as any)}
                        disabled={isProfileIncomplete}
                        className={cn(
                          "px-4.5 py-2.5 text-[11px] font-bold rounded-full transition-all duration-200 cursor-pointer select-none border-none outline-none",
                          isActive
                            ? "bg-fiord-950 text-white dark:bg-fiord-50 dark:text-fiord-950 shadow-xs"
                            : "bg-fiord-50/50 hover:bg-fiord-100/70 text-fiord-700 dark:bg-fiord-900/40 dark:text-fiord-300 dark:hover:bg-fiord-900/70"
                        )}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
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

        {/* BLOCK 2: HERENCIA DE DATOS DE LA EMPRESA */}
        <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] overflow-hidden shadow-xs">
          <CardHeader className="p-6 md:p-8 border-b border-fiord-100/40 dark:border-fiord-800/30 flex flex-row items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-fiord-50 dark:bg-fiord-900/40 text-fiord-950 dark:text-fiord-50 flex items-center justify-center shrink-0">
                <Building className="size-4.5" />
              </div>
              <div>
                <CardTitle className="text-[15px] font-bold text-fiord-900 dark:text-fiord-50">
                  Ubicación y Beneficios
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-fiord-450 dark:text-fiord-500 mt-0.5">
                  Datos cargados automáticamente desde tu perfil de empresa.
                </CardDescription>
              </div>
            </div>
            
            <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 font-bold text-[9.5px] uppercase tracking-wider rounded-md py-1 px-2.5">
              Heredado del perfil
            </Badge>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            
            {/* Main Location Info Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Inherited Location Block */}
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                  Ubicación Predeterminada
                </Label>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-fiord-50/30 dark:bg-fiord-950/10 border border-fiord-100/50 dark:border-fiord-800/40">
                  <MapPin className="size-4.5 text-fiord-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-fiord-800 dark:text-fiord-200">
                    <p className="font-bold">{profile?.location || "Mérida, Yucatán"}</p>
                    {profile?.address_details && (
                      <p className="text-[11px] text-fiord-450 dark:text-fiord-500 font-semibold mt-1">
                        Ref: {profile.address_details}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Inherited Phone Block */}
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                  WhatsApp de Contacto
                </Label>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-fiord-50/30 dark:bg-fiord-950/10 border border-fiord-100/50 dark:border-fiord-800/40">
                  <Phone className="size-4.5 text-fiord-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-fiord-800 dark:text-fiord-200">
                    <p className="font-bold">{profile?.phone || "No registrado"}</p>
                    <p className="text-[11px] text-fiord-450 dark:text-fiord-500 font-semibold mt-1">
                      Los candidatos conectarán a este número al postularse.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Switch for alternative location */}
            <div className="flex items-start gap-3 p-4 bg-fiord-50/20 dark:bg-fiord-950/20 rounded-2xl border border-fiord-100/30 dark:border-fiord-850/10 mt-2">
              <Checkbox
                id="use_alternative_location"
                checked={useAlternativeLocation}
                onCheckedChange={(checked) =>
                  setValue("use_alternative_location", !!checked, { shouldValidate: true })
                }
                className="mt-0.5 border-fiord-300 dark:border-fiord-700 data-[state=checked]:bg-fiord-950 dark:data-[state=checked]:bg-fiord-50"
              />
              <div className="space-y-1">
                <label
                  htmlFor="use_alternative_location"
                  className="text-xs font-bold text-fiord-900 dark:text-fiord-50 cursor-pointer select-none"
                >
                  ¿Esta vacante es en otra sucursal u ubicación alternativa?
                </label>
                <p className="text-[11px] text-fiord-450 dark:text-fiord-500 font-semibold leading-relaxed">
                  Activa esta opción si el lugar de trabajo difiere de tu dirección comercial predeterminada.
                </p>
              </div>
            </div>

            {/* Alternative Location input */}
            {useAlternativeLocation && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="alternative_location" className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                  Ubicación / Dirección Específica de esta Vacante *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-fiord-400 dark:text-fiord-500" />
                  <Input
                    id="alternative_location"
                    placeholder="Ej. Sucursal Quinta Avenida, entre Calle 10 y 12, Playa del Carmen"
                    {...register("alternative_location")}
                    className="h-11 rounded-xl text-xs font-semibold border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all outline-none pl-11 pr-4"
                  />
                </div>
                {errors.alternative_location && (
                  <p className="text-[11px] font-semibold text-red-500 dark:text-red-400 px-1">
                    {errors.alternative_location.message}
                  </p>
                )}
              </div>
            )}

            <div className="h-px bg-fiord-100/50 dark:bg-fiord-800/40 w-full"></div>

            {/* Toggleable Benefits Section */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500 px-1">
                  Prestaciones y Beneficios para esta Oferta
                </Label>
                <p className="text-[11.5px] text-fiord-450 dark:text-fiord-500 font-semibold leading-relaxed px-1">
                  Selecciona qué beneficios heredados de tu perfil aplican a este puesto específico, o agrega prestaciones adicionales.
                </p>
              </div>

              {/* Standard pills to toggle */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  "Prestaciones de Ley",
                  "Propinas",
                  "Comedor de empleados",
                  "Uniformes",
                  "Capacitación / Crecimiento",
                  "Transporte de personal",
                ].map((perk) => {
                  const isActive = selectedBenefits.includes(perk);
                  return (
                    <button
                      key={perk}
                      type="button"
                      onClick={() => handleToggleBenefit(perk)}
                      className={cn(
                        "px-4 py-2 text-[11px] font-bold rounded-full transition-all duration-200 cursor-pointer select-none border flex items-center gap-1.5",
                        isActive
                          ? "bg-fiord-50 border-fiord-300 text-fiord-950 dark:bg-fiord-900/60 dark:border-fiord-700 dark:text-fiord-100"
                          : "bg-transparent border-fiord-100 text-fiord-450 hover:bg-fiord-50/50 dark:border-fiord-800/50 dark:text-fiord-400 dark:hover:bg-fiord-900/20"
                      )}
                    >
                      {isActive ? (
                        <Check className="size-3.5 text-fiord-550 shrink-0" />
                      ) : (
                        <Plus className="size-3.5 text-fiord-400 shrink-0" />
                      )}
                      <span>{perk}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add custom perks input */}
              <div className="flex gap-2 max-w-md pt-2">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    value={customBenefitText}
                    onChange={(e) => setCustomBenefitText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomBenefit();
                      }
                    }}
                    placeholder="Agregar otra prestación..."
                    className="h-10 rounded-xl text-xs font-semibold border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-fiord-900 dark:text-fiord-100 placeholder-fiord-400 dark:placeholder-fiord-500 focus-visible:ring-1 focus-visible:ring-fiord-300 dark:focus-visible:ring-fiord-700 focus-visible:border-fiord-300 dark:focus-visible:border-fiord-750 transition-all outline-none pr-4"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddCustomBenefit}
                  variant="outline"
                  className="h-10 rounded-xl font-bold bg-white dark:bg-fiord-900/10 hover:bg-fiord-50 dark:hover:bg-fiord-900/40 text-fiord-700 dark:text-fiord-300 border border-fiord-100/80 dark:border-fiord-800/80 text-xs px-4 flex items-center gap-1.5 transition-all shadow-none"
                >
                  <PlusCircle className="size-4" />
                  <span>Añadir</span>
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* FOOTER ACTIONS BAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            asChild
            className="h-10 rounded-xl font-bold bg-white dark:bg-fiord-900/10 hover:bg-fiord-50 dark:hover:bg-fiord-900/40 text-fiord-700 dark:text-fiord-300 border border-fiord-100/80 dark:border-fiord-800/80 text-xs px-5 transition-all shadow-none"
          >
            <Link href="/dashboard/company/vacancies">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={publishing || isProfileIncomplete}
            className="h-10 rounded-xl font-bold bg-fiord-950 dark:bg-fiord-50 hover:bg-fiord-900 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 text-xs px-6 transition-all border-none"
          >
            {publishing ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <Plus className="size-3.5 mr-1.5" />
                <span>Publicar Vacante</span>
              </>
            )}
          </Button>
        </div>

      </form>
    </motion.div>
  );
}
