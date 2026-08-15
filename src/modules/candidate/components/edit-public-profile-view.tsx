"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Control, UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  Plus, 
  Lightbulb, 
  Camera as CameraIcon, 
  Image as GalleryIcon, 
  Trash2, 
  CheckCircle2,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
import { candidateProfileSchema, type CandidateProfileFormValues } from "../schemas/candidate.schema";
import { FormTextField, FormPhoneField } from "@/components/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface EditPublicProfileViewProps {
  onBack?: () => void;
}

// Sub-component for isolated reactive Experience field array without full-tree re-renders
const ExperienceFieldArray = React.memo(({
  control,
  register,
  errors,
}: {
  control: Control<CandidateProfileFormValues>;
  register: UseFormRegister<CandidateProfileFormValues>;
  errors: FieldErrors<CandidateProfileFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200 flex items-center gap-2">
          <Briefcase className="w-4.5 h-4.5 text-[#5c7c9b]" />
          <span>Experiencia Laboral</span>
        </label>
        <button
          type="button"
          onClick={() => append({ role: "", company: "", period: "", description: "" })}
          className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#344558] dark:text-zinc-200 hover:text-[#1f2732] transition-colors cursor-pointer py-1 px-2"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>Añadir Experiencia</span>
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="w-full p-4 bg-[#f5f7fa] dark:bg-zinc-900 rounded-[16px] border border-[#ebeef3] dark:border-zinc-800 text-xs text-[#5c7c9b]">
          No has registrado experiencias aún. Toca "Añadir Experiencia" para agregar empleos anteriores.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-[#f5f7fa] dark:bg-zinc-900/80 border border-[#ebeef3] dark:border-zinc-800 rounded-[18px] space-y-3 relative">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                aria-label="Eliminar experiencia"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Puesto / Cargo *</label>
                  <Input
                    {...register(`experience.${index}.role`)}
                    placeholder="Ej. Chef Ejecutivo, Mesero"
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
                  {errors.experience?.[index]?.role && (
                    <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.experience[index]?.role?.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Empresa / Negocio *</label>
                  <Input
                    {...register(`experience.${index}.company`)}
                    placeholder="Ej. Hotel Xcaret"
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
                  {errors.experience?.[index]?.company && (
                    <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.experience[index]?.company?.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Período *</label>
                  <Input
                    {...register(`experience.${index}.period`)}
                    placeholder="Ej. 2022 - 2024"
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
                  {errors.experience?.[index]?.period && (
                    <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.experience[index]?.period?.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Descripción *</label>
                  <Input
                    {...register(`experience.${index}.description`)}
                    placeholder="Resumen de funciones principal..."
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
                  {errors.experience?.[index]?.description && (
                    <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.experience[index]?.description?.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
ExperienceFieldArray.displayName = "ExperienceFieldArray";

// Sub-component for isolated reactive Education field array without full-tree re-renders
const EducationFieldArray = React.memo(({
  control,
  register,
  errors,
}: {
  control: Control<CandidateProfileFormValues>;
  register: UseFormRegister<CandidateProfileFormValues>;
  errors: FieldErrors<CandidateProfileFormValues>;
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200 flex items-center gap-2">
          <GraduationCap className="w-4.5 h-4.5 text-[#5c7c9b]" />
          <span>Educación y Formación</span>
        </label>
        <button
          type="button"
          onClick={() => append({ institution: "", degree: "", period: "", description: "" })}
          className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#344558] dark:text-zinc-200 hover:text-[#1f2732] transition-colors cursor-pointer py-1 px-2"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>Añadir Educación</span>
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="w-full p-4 bg-[#f5f7fa] dark:bg-zinc-900 rounded-[16px] border border-[#ebeef3] dark:border-zinc-800 text-xs text-[#5c7c9b]">
          No has registrado formación educativa aún.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-[#f5f7fa] dark:bg-zinc-900/80 border border-[#ebeef3] dark:border-zinc-800 rounded-[18px] space-y-3 relative">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 p-1.5 text-rose-500 hover:text-rose-700 transition-colors"
                aria-label="Eliminar educación"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Institución *</label>
                  <Input
                    {...register(`education.${index}.institution`)}
                    placeholder="Ej. Universidad Tecnológica"
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
                  {errors.education?.[index]?.institution && (
                    <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.education[index]?.institution?.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Título / Certificado *</label>
                  <Input
                    {...register(`education.${index}.degree`)}
                    placeholder="Ej. Licenciatura en Gastronomía"
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
                  {errors.education?.[index]?.degree && (
                    <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.education[index]?.degree?.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#5c7c9b]">Período *</label>
                <Input
                  {...register(`education.${index}.period`)}
                  placeholder="Ej. 2018 - 2022"
                  className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                />
                {errors.education?.[index]?.period && (
                  <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.education[index]?.period?.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
EducationFieldArray.displayName = "EducationFieldArray";

export function EditPublicProfileView({ onBack }: EditPublicProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  // Profile photo state
  const [hasCustomAvatar, setHasCustomAvatar] = React.useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  // Modals state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState<boolean>(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = React.useState<boolean>(false);
  const [newSkillText, setNewSkillText] = React.useState<string>("");

  // Reactive React Hook Form setup with Zod 4 field-level validation
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CandidateProfileFormValues>({
    resolver: zodResolver(candidateProfileSchema),
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
    },
  });

  const skills = watch("skills") || [];
  const fullName = watch("full_name") || "";

  // Load existing candidate profile securely from Supabase using candidateProfileService
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profile = await candidateProfileService.getProfile(user.id);

          if (profile) {
            const rawExperience = Array.isArray(profile.experience) ? profile.experience : [];
            const rawEducation = (profile as any).education && Array.isArray((profile as any).education)
              ? (profile as any).education
              : [];

            reset({
              full_name: profile.full_name || "",
              whatsapp_number: profile.whatsapp_number || "",
              experience_summary: profile.experience_summary || "",
              headline: profile.headline || "",
              skills: profile.skills || [],
              experience: rawExperience as any,
              education: rawEducation as any,
              portfolio_links: Array.isArray(profile.portfolio_links) ? (profile.portfolio_links as any) : [],
              show_phone: profile.show_phone ?? true,
            });

            if (profile.avatar_url) {
              setHasCustomAvatar(true);
              setAvatarUrl(profile.avatar_url);
            }
          }
        }
      } catch (err) {
        console.error("Error loading candidate profile for edit:", err);
        toast.error("Error al cargar los datos del perfil");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [supabase, reset]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleSimulatePhotoSelect = (fromCamera: boolean) => {
    setIsPhotoModalOpen(false);
    toast.info(fromCamera ? "Abriendo cámara..." : "Abriendo galería de fotos...");
    setTimeout(() => {
      setHasCustomAvatar(true);
      toast.success("¡Foto de perfil seleccionada!");
    }, 900);
  };

  const handleDeletePhoto = () => {
    setIsPhotoModalOpen(false);
    setHasCustomAvatar(false);
    setAvatarUrl(null);
    toast.info("Foto de perfil eliminada");
  };

  const handleAddSkill = () => {
    const clean = newSkillText.trim();
    if (clean && !skills.includes(clean)) {
      setValue("skills", [...skills, clean], { shouldValidate: true });
    }
    setNewSkillText("");
    setIsAddSkillOpen(false);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setValue("skills", skills.filter((s) => s !== skillToRemove), { shouldValidate: true });
  };

  const onSubmit = async (values: CandidateProfileFormValues) => {
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
        avatar_url: avatarUrl,
      });

      toast.success("¡Perfil guardado exitosamente!");
      setTimeout(() => {
        handleBack();
      }, 700);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Error al guardar los datos en la base de datos");
    } finally {
      setIsSaving(false);
    }
  };

  const initialLetter = fullName.trim().length > 0 ? fullName.trim()[0].toUpperCase() : "C";

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-6 sm:px-10 lg:px-14 pt-4 pb-28 md:pb-8 max-w-3xl mx-auto w-full animate-in fade-in duration-300 relative">
      
      {/* AppBar */}
      <div className="flex items-center justify-between py-4 border-b border-transparent">
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-11 h-11 bg-[#f5f7fa] dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#1f2732] dark:text-zinc-100 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
        </button>

        <h1 className="text-[20px] sm:text-[24px] font-[800] text-[#1f2732] dark:text-zinc-100 text-center">
          Editar Perfil Público
        </h1>

        <div className="w-11" />
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Form Area */
        <form onSubmit={handleSubmit(onSubmit)} className="pt-6 space-y-8">
          
          {/* 0. Profile Photo Section */}
          <div className="flex flex-col items-center justify-center text-center">
            <div
              onClick={() => setIsPhotoModalOpen(true)}
              className="relative cursor-pointer group"
            >
              <div className="p-1 rounded-full border-2 border-[#d2dbe5] dark:border-zinc-700">
                <div className="w-[110px] h-[110px] rounded-full bg-[#ebeef3] dark:bg-zinc-800 flex items-center justify-center text-[#1f2732] dark:text-zinc-100 text-[42px] font-[800] overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    initialLetter
                  )}
                </div>
              </div>

              {/* Camera Icon Badge */}
              <div className="absolute bottom-1 right-1 w-[38px] h-[38px] bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full border-[2.5px] border-white dark:border-zinc-950 flex items-center justify-center shadow-md">
                <Camera className="w-[18px] h-[18px] stroke-[2.2]" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="mt-3 text-[14px] sm:text-[15px] font-extrabold text-[#344558] dark:text-zinc-300 hover:text-[#1f2732] transition-colors cursor-pointer py-1 px-2"
            >
              Cambiar foto de perfil
            </button>
          </div>

          {/* 1. Nombre Completo input */}
          <FormTextField
            id="candidate_full_name"
            label="Nombre Completo"
            required
            registerProps={register("full_name")}
            hintText="Ingresa tu nombre completo"
            error={errors.full_name?.message}
          />

          {/* 2. Teléfono / WhatsApp input */}
          <FormPhoneField
            id="candidate_whatsapp_number"
            label="Teléfono / WhatsApp de contacto"
            required
            value={watch("whatsapp_number")}
            onChange={(val) => setValue("whatsapp_number", val, { shouldValidate: true })}
            error={errors.whatsapp_number?.message}
          />

          {/* 3. Extracto / Biografía profesional input */}
          <div className="space-y-2.5">
            <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
              Extracto / Biografía profesional
            </label>
            <Textarea
              rows={4}
              {...register("experience_summary")}
              placeholder="Escribe un breve resumen de tu experiencia o aptitudes..."
              className="bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[16px] p-4 text-[15px] sm:text-[16px] font-[600] leading-relaxed text-[#1f2732] dark:text-zinc-100 focus-visible:ring-2 focus-visible:ring-[#1f2732] resize-none"
            />
            {errors.experience_summary && (
              <p className="text-xs sm:text-sm font-semibold text-rose-500">{errors.experience_summary.message}</p>
            )}
          </div>

          {/* 4. Dynamic Skills tags area */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
                Habilidades
              </label>
              <button
                type="button"
                onClick={() => setIsAddSkillOpen(true)}
                className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#344558] dark:text-zinc-200 hover:text-[#1f2732] transition-colors cursor-pointer py-1 px-2"
              >
                <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>Añadir</span>
              </button>
            </div>

            {skills.length === 0 ? (
              <div className="w-full p-5 bg-[#f5f7fa] dark:bg-zinc-900 rounded-[16px] border border-[#ebeef3] dark:border-zinc-800 flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-[#5c7c9b] shrink-0" />
                <p className="text-[14px] text-[#5c7c9b] dark:text-zinc-400 font-medium">
                  No has agregado habilidades aún. Toca "Añadir" para registrar tus conocimientos.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-4 py-2.5 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px] flex items-center gap-2"
                  >
                    <span className="text-[13px] sm:text-[14px] font-bold text-[#344558] dark:text-zinc-200">
                      {skill}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="p-1 text-[#7d99b3] hover:text-[#1f2732] dark:hover:text-zinc-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Dynamic Experience JSONB Structure */}
          <ExperienceFieldArray
            control={control}
            register={register}
            errors={errors}
          />

          {/* 6. Dynamic Education JSONB Structure */}
          <EducationFieldArray
            control={control}
            register={register}
            errors={errors}
          />

          {/* 7. Save Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full h-[54px] bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[18px] text-[16px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 border-none"
            >
              {isSaving ? "Guardando..." : "Guardar Perfil"}
            </Button>
          </div>

        </form>
      )}

      {/* Photo Picker Modal Bottom Sheet */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-t-[32px] sm:rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 sm:p-8">
          <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#ebeef3] dark:border-zinc-800">
            <DialogTitle className="text-[20px] font-bold text-[#1f2732] dark:text-zinc-50">
              Foto de Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <button
              onClick={() => handleSimulatePhotoSelect(true)}
              className="w-full p-4 rounded-[18px] flex items-center gap-4 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#f5f7fa] dark:bg-zinc-800 flex items-center justify-center text-[#1f2732] dark:text-zinc-100 shrink-0">
                <CameraIcon className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[15px] font-bold text-[#1f2732] dark:text-zinc-100">
                Tomar foto con la cámara
              </span>
            </button>

            <button
              onClick={() => handleSimulatePhotoSelect(false)}
              className="w-full p-4 rounded-[18px] flex items-center gap-4 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#f5f7fa] dark:bg-zinc-800 flex items-center justify-center text-[#1f2732] dark:text-zinc-100 shrink-0">
                <GalleryIcon className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-[15px] font-bold text-[#1f2732] dark:text-zinc-100">
                Elegir de la galería
              </span>
            </button>

            {hasCustomAvatar && (
              <button
                onClick={handleDeletePhoto}
                className="w-full p-4 rounded-[18px] flex items-center gap-4 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[#FEE4E2] dark:bg-rose-900/30 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-[15px] font-bold text-rose-600">
                  Eliminar foto actual
                </span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Skill Modal Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[28px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 sm:p-8 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold text-[#1f2732] dark:text-zinc-50">
              Agregar Habilidad
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <Input
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
              className="h-13 bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[14px] px-4 text-[15px]"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsAddSkillOpen(false)}
              className="text-[#5c7c9b] font-bold text-sm h-11 px-5 cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddSkill}
              className="bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm rounded-[14px] px-6 h-11 cursor-pointer"
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
