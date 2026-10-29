"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  Plus, 
  Trash2, 
  Briefcase,
  GraduationCap,
  Loader2,
  BadgeCheck,
  Globe,
  Sparkles,
  Phone,
  User,
  ExternalLink
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
import { candidateDocumentsService } from "../services/candidate-documents";
import { candidateProfileSchema } from "../schemas/candidate.schema";
import { formatPhoneDisplay, normalizePhone } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditPublicProfileViewProps {
  onBack?: () => void;
}

// Sub-component for isolated reactive Experience field array
const ExperienceFieldArray = React.memo(({
  control,
  register,
  errors,
}: {
  control: any;
  register: any;
  errors: any;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience",
  });

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <div className="p-4 bg-muted/30 border border-border/60 rounded-xl text-xs text-muted-foreground text-center">
          No has registrado experiencias aún. Toca &quot;Añadir empleo&quot; para agregar tu historial.
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-muted/20 border border-border/60 rounded-2xl space-y-3.5 relative shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 size-7 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                aria-label="Eliminar experiencia"
              >
                <Trash2 className="size-3.5" />
              </Button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pr-8">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Puesto / Cargo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...register(`experience.${index}.role`)}
                    placeholder="Ej. Chef Ejecutivo, Mesero, Recepcionista"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                  />
                  {errors.experience?.[index]?.role && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">{errors.experience[index]?.role?.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Empresa / Negocio <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...register(`experience.${index}.company`)}
                    placeholder="Ej. Hotel Riviera Grand"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                  />
                  {errors.experience?.[index]?.company && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">{errors.experience[index]?.company?.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Período <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...register(`experience.${index}.period`)}
                    placeholder="Ej. 2022 - 2024"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                  />
                  {errors.experience?.[index]?.period && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">{errors.experience[index]?.period?.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Descripción / Funciones</Label>
                  <Input
                    {...register(`experience.${index}.description`)}
                    placeholder="Resumen de responsabilidades principales..."
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ role: "", company: "", period: "", description: "" })}
        className="h-8 px-3.5 text-xs font-medium gap-1.5 rounded-xl cursor-pointer"
      >
        <Plus className="size-3.5" />
        <span>Añadir empleo</span>
      </Button>
    </div>
  );
});
ExperienceFieldArray.displayName = "ExperienceFieldArray";

// Sub-component for isolated reactive Education field array
const EducationFieldArray = React.memo(({
  control,
  register,
  errors,
}: {
  control: any;
  register: any;
  errors: any;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <div className="p-4 bg-muted/30 border border-border/60 rounded-xl text-xs text-muted-foreground text-center">
          No has registrado estudios aún. Toca &quot;Añadir formación&quot; para sumar tus grados.
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-muted/20 border border-border/60 rounded-2xl space-y-3.5 relative shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 size-7 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                aria-label="Eliminar educación"
              >
                <Trash2 className="size-3.5" />
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pr-8">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Institución / Escuela <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...register(`education.${index}.institution`)}
                    placeholder="Ej. Universidad del Caribe, CONALEP"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                  />
                  {errors.education?.[index]?.institution && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">{errors.education[index]?.institution?.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Título / Carrera <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...register(`education.${index}.degree`)}
                    placeholder="Ej. Licenciatura en Gastronomía, Técnico Hotelero"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                  />
                  {errors.education?.[index]?.degree && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">{errors.education[index]?.degree?.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">
                    Período / Año de Egreso <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...register(`education.${index}.period`)}
                    placeholder="Ej. 2018 - 2022"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                  />
                  {errors.education?.[index]?.period && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">{errors.education[index]?.period?.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Detalles adicionales</Label>
                  <Input
                    {...register(`education.${index}.description`)}
                    placeholder="Ej. Graduado con honores..."
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ institution: "", degree: "", period: "", description: "" })}
        className="h-8 px-3.5 text-xs font-medium gap-1.5 rounded-xl cursor-pointer"
      >
        <Plus className="size-3.5" />
        <span>Añadir formación</span>
      </Button>
    </div>
  );
});
EducationFieldArray.displayName = "EducationFieldArray";

export function EditPublicProfileView({ onBack }: EditPublicProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const avatarInputRef = React.useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [candidateEmail, setCandidateEmail] = React.useState<string>("");

  // Skill Dialog state
  const [isAddSkillOpen, setIsAddSkillOpen] = React.useState<boolean>(false);
  const [newSkillText, setNewSkillText] = React.useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<any>({
    resolver: zodResolver(candidateProfileSchema) as any,
    defaultValues: {
      full_name: "",
      whatsapp_number: "",
      experience_summary: "",
      headline: "",
      skills: [],
      experience: [],
      education: [],
      portfolio_links: [],
      show_phone: true,
    }
  });

  const skills = watch("skills") || [];
  const fullName = watch("full_name") || "";
  const showPhone = watch("show_phone") ?? true;
  const experienceList = watch("experience") || [];

  // Fetch initial profile from Supabase on mount
  React.useEffect(() => {
    async function loadCandidateProfile() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCandidateEmail(user.email || "");
          const profile = await candidateProfileService.getProfile(user.id);
          if (profile) {
            reset({
              full_name: profile.full_name || "",
              whatsapp_number: profile.whatsapp_number || "",
              experience_summary: profile.experience_summary || "",
              headline: profile.headline || "",
              skills: profile.skills || [],
              experience: (profile.experience as any) || [],
              education: (profile.education as any) || [],
              portfolio_links: (profile.portfolio_links as any) || [],
              show_phone: profile.show_phone ?? true,
            });

            if (profile.avatar_url) {
              setAvatarUrl(profile.avatar_url);
            }
          }
        }
      } catch (err) {
        console.error("Error loading candidate profile for edit:", err);
        toast.error("Error al cargar la información del perfil");
      } finally {
        setIsLoading(false);
      }
    }

    loadCandidateProfile();
  }, [supabase, reset]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/candidate/profile");
    }
  };

  // Add / Remove Skills
  const handleAddSkill = () => {
    const trimmed = newSkillText.trim();
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.info("Esa habilidad ya está en tu lista");
      return;
    }
    setValue("skills", [...skills, trimmed], { shouldValidate: true });
    setNewSkillText("");
    setIsAddSkillOpen(false);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setValue(
      "skills",
      skills.filter((s: string) => s !== skillToRemove),
      { shouldValidate: true }
    );
  };

  // Photo Upload Handler
  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Formato no válido", { description: "Por favor selecciona un archivo JPG, PNG o WebP." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Archivo muy pesado", { description: "La foto debe pesar menos de 5MB." });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay sesión de usuario activa");

      const publicUrl = await candidateDocumentsService.uploadAvatar(user.id, file);
      setAvatarUrl(publicUrl);
      toast.success("Foto de perfil cargada con éxito");
    } catch (err: any) {
      console.error("Error uploading avatar:", err);
      toast.error("No se pudo subir la foto", { description: err.message || "Intenta nuevamente." });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await candidateProfileService.updateProfile(user.id, { avatar_url: null });
      }
      setAvatarUrl(null);
      toast.success("Foto de perfil eliminada");
    } catch (err) {
      console.error("Error deleting avatar:", err);
    }
  };

  // Save Form Handler
  const onSubmit = async (values: any) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sesión no válida");
        return;
      }

      await candidateProfileService.updateProfile(user.id, {
        full_name: values.full_name.trim(),
        whatsapp_number: values.whatsapp_number.trim(),
        experience_summary: values.experience_summary?.trim() || "",
        headline: values.headline?.trim() || "",
        skills: values.skills,
        experience: values.experience,
        education: values.education,
        portfolio_links: values.portfolio_links,
        show_phone: values.show_phone ?? true,
        avatar_url: avatarUrl,
      });

      toast.success("¡Perfil guardado exitosamente!");
      setTimeout(() => {
        handleBack();
      }, 400);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Error al guardar los datos en la base de datos");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate dynamic completion percentage (0 - 100%)
  const completionPercentage = React.useMemo(() => {
    let score = 0;
    if (fullName.trim() && fullName !== "Candidato K'anPro") score += 25;
    if (candidateEmail.trim()) score += 15;
    if (watch("whatsapp_number")?.trim()) score += 20;
    if (watch("experience_summary")?.trim()) score += 15;
    if (skills.length > 0) score += 15;
    if (avatarUrl) score += 10;
    return Math.min(score, 100);
  }, [fullName, candidateEmail, watch("whatsapp_number"), watch("experience_summary"), skills, avatarUrl]);

  const initialLetter = fullName.trim().length > 0 ? fullName.trim()[0].toUpperCase() : "C";

  return (
    <div className="flex-1 min-h-full bg-transparent px-3 sm:px-6 lg:px-8 pt-2 pb-24 max-w-4xl mx-auto w-full animate-in fade-in duration-200">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handlePhotoFileSelected}
      />

      {isLoading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader2 className="size-7 text-primary animate-spin" />
        </div>
      ) : (
        /* Main Profile Card matching Reference */
        <div className="rounded-3xl border border-border/60 bg-card shadow-sm overflow-hidden">
          
          {/* 1. Hero Cover Banner */}
          <div className="h-32 sm:h-44 bg-gradient-to-r from-sky-200/50 via-teal-100/40 to-emerald-100/50 dark:from-sky-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 relative">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleBack}
              aria-label="Regresar"
              className="absolute top-4 left-4 size-8.5 rounded-full bg-background/80 hover:bg-background backdrop-blur-md shadow-xs cursor-pointer"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </div>

          {/* 2. Avatar Row */}
          <div className="px-6 sm:px-8 flex items-end justify-between -mt-12 sm:-mt-14 relative z-10">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="relative cursor-pointer group"
            >
              <Avatar className="size-22 sm:size-26 rounded-full border-4 border-card ring-1 ring-border/50 overflow-hidden bg-muted shadow-md">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                  {initialLetter}
                </AvatarFallback>
              </Avatar>

              {/* Camera Hover Badge */}
              <div className="absolute bottom-1 right-1 size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md ring-2 ring-card hover:scale-105 transition-transform">
                {isUploadingPhoto ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
              </div>
            </div>
          </div>

          {/* 3. User Name & Contact Header */}
          <div className="px-6 sm:px-8 pt-3 sm:pt-4 space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {fullName || "Tu Nombre Completo"}
              </h1>
              <BadgeCheck className="size-5 text-sky-500 fill-sky-500/20" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {candidateEmail}
            </p>
          </div>

          {/* 4. Metrics Bar (4 Indicators like Reference) */}
          <div className="px-6 sm:px-8 py-4 border-y border-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground font-medium">Completitud</span>
              <p className="text-sm sm:text-base font-bold text-foreground">{completionPercentage}%</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground font-medium">Habilidades</span>
              <p className="text-sm sm:text-base font-bold text-foreground">{skills.length} agregadas</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground font-medium">Experiencia</span>
              <p className="text-sm sm:text-base font-bold text-foreground">{experienceList.length} puestos</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs text-muted-foreground font-medium">Visibilidad</span>
              <p className="text-sm sm:text-base font-bold text-foreground">{showPhone ? "Público" : "Protegido"}</p>
            </div>
          </div>

          {/* 5. Form Sections (Side-by-side on desktop: Title on Left, Inputs on Right) */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-6 sm:px-8 pb-8 divide-y divide-border/60">
            
            {/* Section 1: Public profile */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pt-2 pb-7">
              <div className="md:col-span-4 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Perfil público</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Esta información se mostrará en tu tarjeta de candidato ante reclutadores y empresas.
                </p>
              </div>

              <div className="md:col-span-8 space-y-4">
                {/* Nombre Completo */}
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold text-foreground">
                    Nombre Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="Tu nombre completo como aparecerá en el perfil"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                    {...register("full_name")}
                  />
                  {errors.full_name && (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">
                      {errors.full_name?.message as string}
                    </p>
                  )}
                </div>

                {/* WhatsApp Directo */}
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp_number" className="text-xs font-semibold text-foreground">
                    Número de WhatsApp Directo <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-9.5 px-3 rounded-xl bg-muted/50 border border-border/70 text-xs font-semibold text-muted-foreground shrink-0 select-none">
                      <span className="mr-1.5">🇲🇽</span> +52
                    </div>
                    <div className="relative flex-1">
                      <Input
                        id="whatsapp_number"
                        type="tel"
                        placeholder="10 dígitos (ej. 999 123 4567)"
                        value={formatPhoneDisplay(watch("whatsapp_number") || "")}
                        onChange={(e) => setValue("whatsapp_number", normalizePhone(e.target.value), { shouldValidate: true })}
                        className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm pr-9"
                      />
                      <Phone className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  {errors.whatsapp_number ? (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">
                      {errors.whatsapp_number?.message as string}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Las empresas te contactarán a este número para entrevistas.
                    </p>
                  )}
                </div>

                {/* Titular Profesional */}
                <div className="space-y-1.5">
                  <Label htmlFor="headline" className="text-xs font-semibold text-foreground">
                    Titular Profesional / Puesto Buscado <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="headline"
                    placeholder="Ej. Chef Especialista en Cocina de Mar | Barman Bilingüe"
                    className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
                    {...register("headline")}
                  />
                  {errors.headline ? (
                    <p className="text-[11px] font-medium text-destructive mt-0.5">
                      {errors.headline?.message as string}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Una línea descriptiva que verán los reclutadores en el Radar de talento.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: About me / Biography */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-7">
              <div className="md:col-span-4 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Acerca de ti</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Describe brevemente tu trayectoria laboral, tus fortalezas principales y tus metas.
                </p>
              </div>

              <div className="md:col-span-8 space-y-1.5">
                <Label htmlFor="experience_summary" className="text-xs font-semibold text-foreground">
                  Biografía y Resumen
                </Label>
                <Textarea
                  id="experience_summary"
                  {...register("experience_summary")}
                  placeholder="Describe brevemente tu trayectoria, tus fortalezas principales y lo que buscas en tu próximo empleo..."
                  rows={4}
                  className="w-full resize-none rounded-xl bg-background border-border/70 text-xs sm:text-sm leading-relaxed p-3 min-h-24"
                />
              </div>
            </div>

            {/* Section 3: Skills & Badges */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-7">
              <div className="md:col-span-4 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Habilidades y Destrezas</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Palabras clave destacadas para aparecer en las búsquedas especializadas del Radar.
                </p>
              </div>

              <div className="md:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 min-h-11 p-3 bg-muted/20 border border-border/60 rounded-2xl">
                  {skills.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      No has agregado habilidades aún. Haz clic en añadir para sumar aptitudes.
                    </span>
                  ) : (
                    skills.map((skill: string) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs font-medium px-2.5 py-1 gap-1.5 rounded-lg bg-background border border-border/60 shadow-2xs"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                          aria-label={`Eliminar ${skill}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddSkillOpen(true)}
                  className="h-8 px-3.5 text-xs font-medium gap-1.5 rounded-xl cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Añadir habilidad</span>
                </Button>
              </div>
            </div>

            {/* Section 4: Work Experience */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-7">
              <div className="md:col-span-4 space-y-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Experiencia Laboral</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tus empleos anteriores, empresas y funciones desempeñadas.
                </p>
              </div>

              <div className="md:col-span-8">
                <ExperienceFieldArray
                  control={control}
                  register={register}
                  errors={errors}
                />
              </div>
            </div>

            {/* Section 5: Education */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-7">
              <div className="md:col-span-4 space-y-1">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Educación y Grados</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Estudios académicos, cursos concluidos o carreras técnicas.
                </p>
              </div>

              <div className="md:col-span-8">
                <EducationFieldArray
                  control={control}
                  register={register}
                  errors={errors}
                />
              </div>
            </div>

            {/* Section 6: Support Access / Contact Visibility Switch (Style matching reference) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 py-7 items-center">
              <div className="md:col-span-8 space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Visibilidad de contacto directo</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Permite a las empresas y reclutadores contactarte directamente a tu número de WhatsApp para agendar entrevistas.
                </p>
              </div>

              <div className="md:col-span-4 flex justify-start md:justify-end">
                <Switch
                  checked={showPhone}
                  onCheckedChange={(val) => setValue("show_phone", val)}
                  aria-label="Permitir contacto directo"
                />
              </div>
            </div>

            {/* Section 7: Action Footer (Cancel / Save Changes) */}
            <div className="pt-7 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="rounded-xl h-9.5 px-4 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl h-9.5 px-5 text-xs font-medium gap-2 min-w-32 cursor-pointer shadow-xs"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar cambios</span>
                )}
              </Button>
            </div>

          </form>

        </div>
      )}

      {/* Add Skill Modal Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl border-border bg-card p-5 space-y-3">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-bold text-foreground">
              Agregar Habilidad o Destreza
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa una competencia técnica o destreza profesional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-1">
            <Label htmlFor="skill_input" className="text-xs font-semibold text-foreground">
              Habilidad
            </Label>
            <Input
              id="skill_input"
              type="text"
              autoFocus
              value={newSkillText}
              onChange={(e) => setNewSkillText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Ej. Cocina Caliente, Proactivo, Inglés..."
              className="h-9.5 rounded-xl bg-background border-border/70 text-xs sm:text-sm"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddSkillOpen(false)}
              className="rounded-xl h-8.5 px-3.5 text-xs font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddSkill}
              className="rounded-xl h-8.5 px-3.5 text-xs font-medium shadow-xs"
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

