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
  Camera as CameraIcon, 
  Image as GalleryIcon, 
  Trash2, 
  Briefcase,
  GraduationCap,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
import { candidateDocumentsService } from "../services/candidate-documents";
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
          No has registrado experiencias aún. Toca &quot;Añadir Experiencia&quot; para agregar empleos anteriores.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-[#f5f7fa] dark:bg-zinc-900/80 border border-[#ebeef3] dark:border-zinc-800 rounded-[18px] space-y-3 relative">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 p-1.5 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Eliminar experiencia"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Puesto / Cargo *</label>
                  <Input
                    {...register(`experience.${index}.role`)}
                    placeholder="Ej. Chef Ejecutivo, Mesero, Recepcionista"
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
                    placeholder="Ej. Hotel Riviera Grand"
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
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Descripción / Funciones</label>
                  <Input
                    {...register(`experience.${index}.description`)}
                    placeholder="Resumen de responsabilidades..."
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
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
          <span>Educación y Grados Académicos</span>
        </label>
        <button
          type="button"
          onClick={() => append({ institution: "", degree: "", period: "", description: "" })}
          className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#344558] dark:text-zinc-200 hover:text-[#1f2732] transition-colors cursor-pointer py-1 px-2"
        >
          <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>Añadir Formación</span>
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="w-full p-4 bg-[#f5f7fa] dark:bg-zinc-900 rounded-[16px] border border-[#ebeef3] dark:border-zinc-800 text-xs text-[#5c7c9b]">
          No has registrado formación académica aún.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-[#f5f7fa] dark:bg-zinc-900/80 border border-[#ebeef3] dark:border-zinc-800 rounded-[18px] space-y-3 relative">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 p-1.5 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                aria-label="Eliminar educación"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Institución o Escuela *</label>
                  <Input
                    {...register(`education.${index}.institution`)}
                    placeholder="Ej. Universidad Tecnológica, Conalep"
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
                  {errors.education?.[index]?.institution && (
                    <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.education[index]?.institution?.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#5c7c9b]">Grado o Carrera *</label>
                  <Input
                    {...register(`education.${index}.degree`)}
                    placeholder="Ej. Licenciatura en Gastronomía, Técnico"
                    className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                  />
                  {errors.education?.[index]?.degree && (
                    <p className="text-[11px] font-medium text-rose-500 mt-0.5">{errors.education[index]?.degree?.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-[#5c7c9b]">Período (Opcional)</label>
                <Input
                  {...register(`education.${index}.period`)}
                  placeholder="Ej. 2018 - 2022"
                  className="h-10 text-xs mt-1 bg-white dark:bg-zinc-900 rounded-xl"
                />
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
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState<boolean>(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  // Profile photo state
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  // Modals state
  const [isAddSkillOpen, setIsAddSkillOpen] = React.useState<boolean>(false);
  const [newSkillText, setNewSkillText] = React.useState<string>("");

  // Reactive React Hook Form setup with Zod field-level validation
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

  // Load existing candidate profile from Supabase
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const profile = await candidateProfileService.getProfile(user.id);

          if (profile) {
            const rawExperience = Array.isArray(profile.experience) ? profile.experience : [];
            const rawEducation = Array.isArray(profile.education) ? profile.education : [];

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
      router.push("/dashboard/candidate/profile");
    }
  };

  // Real Photo Upload
  const handlePhotoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;

    setIsUploadingPhoto(true);
    try {
      const publicUrl = await candidateDocumentsService.uploadAvatar(userId, file);
      setAvatarUrl(publicUrl);
      toast.success("Foto de perfil actualizada correctamente.");
    } catch (err: any) {
      toast.error(err.message || "Error al subir la fotografía.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!userId) return;
    try {
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
      setAvatarUrl(null);
      toast.success("Foto de perfil eliminada.");
    } catch (e) {
      toast.error("Error al eliminar la foto.");
    }
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
      }, 500);
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
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handlePhotoFileSelected}
      />

      {/* AppBar */}
      <div className="flex items-center justify-between py-4 border-b border-transparent">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Regresar"
          className="w-11 h-11 bg-[#f5f7fa] dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#1f2732] dark:text-zinc-100 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
        </button>

        <h1 className="text-[20px] sm:text-[24px] font-[800] text-[#1f2732] dark:text-zinc-100 text-center">
          Información Laboral Pública
        </h1>

        <div className="w-11" />
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        /* Form Area */
        <form onSubmit={handleSubmit(onSubmit)} className="pt-6 space-y-8">
          
          {/* 0. Profile Photo Section */}
          <div className="flex flex-col items-center justify-center text-center">
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="relative cursor-pointer group"
            >
              <div className="p-1 rounded-full border-2 border-[#d2dbe5] dark:border-zinc-700">
                <div className="w-[110px] h-[110px] rounded-full bg-[#ebeef3] dark:bg-zinc-800 flex items-center justify-center text-[#1f2732] dark:text-zinc-100 text-[42px] font-[800] overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    initialLetter
                  )}
                </div>
              </div>

              {/* Camera Icon Badge */}
              <div className="absolute bottom-1 right-1 w-[38px] h-[38px] bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full border-[2.5px] border-white dark:border-zinc-950 flex items-center justify-center shadow-md">
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-[18px] h-[18px] stroke-[2.2]" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="text-[14px] sm:text-[15px] font-extrabold text-[#344558] dark:text-zinc-300 hover:text-[#1f2732] transition-colors cursor-pointer py-1 px-2"
              >
                {avatarUrl ? "Cambiar fotografía" : "Subir fotografía"}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  className="text-[13px] font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer py-1 px-2"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>

          {/* 1. Datos Principales */}
          <div className="space-y-4">
            <FormTextField
              id="full_name"
              label="Nombre Completo *"
              hintText="Tu nombre como aparecerá en el perfil público"
              registerProps={register("full_name")}
              error={errors.full_name?.message}
            />

            <FormPhoneField
              id="whatsapp_number"
              label="Número de WhatsApp Directo *"
              value={watch("whatsapp_number") || ""}
              onChange={(val) => setValue("whatsapp_number", val, { shouldValidate: true })}
              error={errors.whatsapp_number?.message}
              helperText="Las empresas te contactarán a este número para entrevistas."
            />

            <FormTextField
              id="headline"
              label="Titular Profesional / Puesto Buscado *"
              hintText="Ej. Chef Especialista en Cocina de Mar | Barman Bilingüe"
              registerProps={register("headline")}
              error={errors.headline?.message}
              helperText="Una línea descriptiva que verán los reclutadores en el Radar de talento."
            />
          </div>

          {/* 2. Biografía y Resumen */}
          <div className="space-y-2">
            <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
              Acerca de ti / Resumen Profesional
            </label>
            <Textarea
              {...register("experience_summary")}
              placeholder="Describe brevemente tu trayectoria, tus fortalezas principales y lo que buscas en tu próximo empleo..."
              rows={4}
              className="w-full bg-[#f8fafc] dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[18px] p-4 text-xs sm:text-sm font-medium leading-relaxed resize-none focus:bg-white dark:focus:bg-zinc-900"
            />
          </div>

          {/* 3. Habilidades Técnicas y Destrezas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
                Habilidades y Destrezas
              </label>
              <button
                type="button"
                onClick={() => setIsAddSkillOpen(true)}
                className="flex items-center gap-1.5 text-[14px] font-extrabold text-[#344558] dark:text-zinc-200 hover:text-[#1f2732] transition-colors cursor-pointer py-1 px-2"
              >
                <Plus className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>Añadir Habilidad</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.length === 0 ? (
                <div className="w-full p-4 bg-[#f5f7fa] dark:bg-zinc-900 rounded-[16px] border border-[#ebeef3] dark:border-zinc-800 text-xs text-[#5c7c9b]">
                  No has agregado habilidades aún. Toca &quot;Añadir Habilidad&quot; para sumar palabras clave a tu perfil.
                </div>
              ) : (
                skills.map((skill) => (
                  <div
                    key={skill}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-[14px] shadow-2xs"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-white/70 hover:text-white dark:text-zinc-700 dark:hover:text-zinc-900 cursor-pointer"
                      aria-label={`Eliminar ${skill}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. Historial Laboral */}
          <div className="pt-2 border-t border-[#ebeef3] dark:border-zinc-800">
            <ExperienceFieldArray
              control={control}
              register={register}
              errors={errors}
            />
          </div>

          {/* 5. Educación y Formación */}
          <div className="pt-2 border-t border-[#ebeef3] dark:border-zinc-800">
            <EducationFieldArray
              control={control}
              register={register}
              errors={errors}
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#ebeef3] dark:border-zinc-800 flex justify-end gap-3 sticky bottom-4 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 rounded-2xl shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="h-12 px-6 rounded-[16px] font-bold text-sm"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-12 px-8 bg-[#1f2732] hover:bg-[#2f3c4b] dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-extrabold text-sm rounded-[16px] shadow-sm cursor-pointer active:scale-98 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Add Skill Modal Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[28px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 sm:p-8 space-y-5">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold text-[#1f2732] dark:text-zinc-50">
              Agregar Habilidad o Destreza
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
              className="h-12 bg-[#f8fafc] dark:bg-zinc-800 border-[#ebeef3] dark:border-zinc-700 rounded-[14px] px-4 text-sm"
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
              type="button"
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
