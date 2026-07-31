"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  Plus, 
  Lightbulb, 
  Camera as CameraIcon, 
  Image as GalleryIcon, 
  Trash2, 
  CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { candidateProfileService } from "../services/candidate-profile";
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

export function EditPublicProfileView({ onBack }: EditPublicProfileViewProps) {
  const router = useRouter();
  const supabase = createClient();

  // Form Controllers / States
  const [name, setName] = React.useState<string>("");
  const [phone, setPhone] = React.useState<string>("");
  const [bio, setBio] = React.useState<string>("");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [hasCustomAvatar, setHasCustomAvatar] = React.useState<boolean>(false);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);

  // Error messages & Loading
  const [nameError, setNameError] = React.useState<string>("");
  const [phoneError, setPhoneError] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState<boolean>(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = React.useState<boolean>(false);
  const [newSkillText, setNewSkillText] = React.useState<string>("");

  // Load existing candidate profile securely from Supabase using candidateProfileService
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profile = await candidateProfileService.getProfile(user.id);

          if (profile) {
            setName(profile.full_name || "");
            setPhone(profile.whatsapp_number || "");
            setBio(profile.experience_summary || "");
            if (profile.skills) setSkills(profile.skills);
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
  }, [supabase]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleSimulatePhotoSelect = (fromCamera: boolean) => {
    setIsPhotoModalOpen(false);
    showToast(fromCamera ? "Abriendo cámara..." : "Abriendo galería de fotos...");
    setTimeout(() => {
      setHasCustomAvatar(true);
      showToast("¡Foto de perfil seleccionada!");
    }, 900);
  };

  const handleDeletePhoto = () => {
    setIsPhotoModalOpen(false);
    setHasCustomAvatar(false);
    setAvatarUrl(null);
    showToast("Foto de perfil eliminada");
  };

  const handleAddSkill = () => {
    const clean = newSkillText.trim();
    if (clean && !skills.includes(clean)) {
      setSkills((prev) => [...prev, clean]);
    }
    setNewSkillText("");
    setIsAddSkillOpen(false);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSave = async () => {
    // Validations
    let valid = true;
    if (!name.trim()) {
      setNameError("El nombre es requerido");
      valid = false;
    } else {
      setNameError("");
    }

    if (!phone.trim()) {
      setPhoneError("El teléfono es requerido");
      valid = false;
    } else {
      setPhoneError("");
    }

    if (!valid) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sesión no válida");
        return;
      }

      await candidateProfileService.updateProfile(user.id, {
        full_name: name.trim(),
        whatsapp_number: phone.trim(),
        experience_summary: bio.trim(),
        skills: skills,
        avatar_url: avatarUrl,
      });

      showToast("¡Perfil guardado exitosamente!");
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

  const initialLetter = name.trim().length > 0 ? name.trim()[0].toUpperCase() : "C";

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-6 sm:px-10 lg:px-14 pt-4 pb-28 md:pb-8 max-w-3xl mx-auto w-full animate-in fade-in duration-300 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[14px] text-sm font-bold shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

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
        <div className="pt-6 space-y-8">
          
          {/* 0. Profile Photo Section */}
          <div className="flex flex-col items-center justify-center text-center">
            <div
              onClick={() => setIsPhotoModalOpen(true)}
              className="relative cursor-pointer group"
            >
              <div className="p-1 rounded-full border-2 border-[#d2dbe5] dark:border-zinc-700">
                <div className="w-[110px] h-[110px] rounded-full bg-[#ebeef3] dark:bg-zinc-800 flex items-center justify-center text-[#1f2732] dark:text-zinc-100 text-[42px] font-[800] overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
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
          <div className="space-y-2.5">
            <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
              Nombre Completo
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameError("");
              }}
              placeholder="Ingresa tu nombre"
              className="h-14 bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[16px] px-4 text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 focus-visible:ring-2 focus-visible:ring-[#1f2732]"
            />
            {nameError && (
              <p className="text-xs sm:text-sm font-semibold text-rose-500">{nameError}</p>
            )}
          </div>

          {/* 2. Teléfono / WhatsApp input */}
          <div className="space-y-2.5">
            <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
              Teléfono / WhatsApp de contacto
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (e.target.value.trim()) setPhoneError("");
              }}
              placeholder="Ej. +52 998 123 4567"
              className="h-14 bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[16px] px-4 text-[15px] sm:text-[16px] font-[600] text-[#1f2732] dark:text-zinc-100 focus-visible:ring-2 focus-visible:ring-[#1f2732]"
            />
            {phoneError && (
              <p className="text-xs sm:text-sm font-semibold text-rose-500">{phoneError}</p>
            )}
          </div>

          {/* 3. Extracto / Biografía profesional input */}
          <div className="space-y-2.5">
            <label className="block text-[14px] sm:text-[15px] font-extrabold text-[#3e546d] dark:text-zinc-200">
              Extracto / Biografía profesional
            </label>
            <Textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Escribe un breve resumen de tu experiencia o aptitudes..."
              className="bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[16px] p-4 text-[15px] sm:text-[16px] font-[600] leading-relaxed text-[#1f2732] dark:text-zinc-100 focus-visible:ring-2 focus-visible:ring-[#1f2732] resize-none"
            />
          </div>

          {/* 4. Skills tags area */}
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

          {/* 5. Save Button */}
          <div className="pt-6">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-[54px] bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[18px] text-[16px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 border-none"
            >
              {isSaving ? "Guardando..." : "Guardar Perfil"}
            </Button>
          </div>

        </div>
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
