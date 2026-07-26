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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

  // Error messages
  const [nameError, setNameError] = React.useState<string>("");
  const [phoneError, setPhoneError] = React.useState<string>("");
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Modals state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState<boolean>(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = React.useState<boolean>(false);
  const [newSkillText, setNewSkillText] = React.useState<string>("");

  // Load existing candidate profile from Supabase
  React.useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, whatsapp_number, experience_summary, skills, avatar_url")
            .eq("id", user.id)
            .single();

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
        console.error("Error loading profile:", err);
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
      if (user) {
        await supabase
          .from("profiles")
          .update({
            full_name: name.trim(),
            whatsapp_number: phone.trim(),
            experience_summary: bio.trim(),
            skills: skills,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      showToast("¡Perfil guardado exitosamente!");
      setTimeout(() => {
        handleBack();
      }, 700);
    } catch (err) {
      console.error("Error saving profile:", err);
      showToast("Error al guardar en la base de datos");
    } finally {
      setIsSaving(false);
    }
  };

  const initialLetter = name.trim().length > 0 ? name.trim()[0].toUpperCase() : "C";

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-5 sm:px-8 lg:px-12 pt-3 pb-24 md:pb-4 max-w-2xl mx-auto w-full animate-in fade-in duration-300 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[12px] text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AppBar */}
      <div className="flex items-center justify-between py-3 border-b border-transparent">
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1f2732] dark:text-zinc-100 hover:bg-[#f5f7fa] dark:hover:bg-zinc-900 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <h1 className="text-[17px] font-bold text-[#1f2732] dark:text-zinc-100 text-center">
          Editar Perfil Público
        </h1>

        <div className="w-10" />
      </div>

      {/* Form Area */}
      <div className="pt-5 space-y-7">
        
        {/* 0. Profile Photo Section */}
        <div className="flex flex-col items-center justify-center text-center">
          <div
            onClick={() => setIsPhotoModalOpen(true)}
            className="relative cursor-pointer group"
          >
            <div className="p-[4px] rounded-full border-2 border-[#d2dbe5] dark:border-zinc-700">
              <div className="w-[96px] h-[96px] rounded-full bg-[#ebeef3] dark:bg-zinc-800 flex items-center justify-center text-[#1f2732] dark:text-zinc-100 text-[36px] font-[800]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  initialLetter
                )}
              </div>
            </div>

            {/* Camera Icon Badge */}
            <div className="absolute bottom-0.5 right-0.5 w-[34px] h-[34px] bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full border-[2.5px] border-white dark:border-zinc-950 flex items-center justify-center shadow-md">
              <Camera className="w-[16px] h-[16px] stroke-[2.2]" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            className="mt-2.5 text-[13px] font-bold text-[#344558] dark:text-zinc-300 hover:text-[#1f2732] transition-colors cursor-pointer"
          >
            Cambiar foto de perfil
          </button>
        </div>

        {/* 1. Nombre Completo input */}
        <div className="space-y-2">
          <label className="block text-[13px] font-bold text-[#3e546d] dark:text-zinc-300">
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
            className="h-12 bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[14px] text-[14px] font-[600] text-[#1f2732] dark:text-zinc-100 focus-visible:ring-1 focus-visible:ring-[#1f2732]"
          />
          {nameError && (
            <p className="text-xs font-semibold text-rose-500">{nameError}</p>
          )}
        </div>

        {/* 2. Teléfono / WhatsApp input */}
        <div className="space-y-2">
          <label className="block text-[13px] font-bold text-[#3e546d] dark:text-zinc-300">
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
            className="h-12 bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[14px] text-[14px] font-[600] text-[#1f2732] dark:text-zinc-100 focus-visible:ring-1 focus-visible:ring-[#1f2732]"
          />
          {phoneError && (
            <p className="text-xs font-semibold text-rose-500">{phoneError}</p>
          )}
        </div>

        {/* 3. Extracto / Biografía profesional input */}
        <div className="space-y-2">
          <label className="block text-[13px] font-bold text-[#3e546d] dark:text-zinc-300">
            Extracto / Biografía profesional
          </label>
          <Textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Escribe un breve resumen de tu experiencia o aptitudes..."
            className="bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[14px] text-[14px] font-[600] leading-relaxed text-[#1f2732] dark:text-zinc-100 focus-visible:ring-1 focus-visible:ring-[#1f2732] resize-none"
          />
        </div>

        {/* 4. Skills tags area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[13px] font-bold text-[#3e546d] dark:text-zinc-300">
              Habilidades
            </label>
            <button
              type="button"
              onClick={() => setIsAddSkillOpen(true)}
              className="flex items-center gap-1 text-[13px] font-bold text-[#344558] dark:text-zinc-200 hover:text-[#1f2732] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Añadir</span>
            </button>
          </div>

          {skills.length === 0 ? (
            <div className="w-full p-4 bg-[#f5f7fa] dark:bg-zinc-900 rounded-[12px] border border-[#ebeef3] dark:border-zinc-800 flex items-center gap-2.5">
              <Lightbulb className="w-5 h-5 text-[#5c7c9b] shrink-0" />
              <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400">
                No has agregado habilidades aún. Toca "Añadir" para registrar tus conocimientos.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div
                  key={skill}
                  className="px-3.5 py-2 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[10px] flex items-center gap-1.5"
                >
                  <span className="text-[12px] font-bold text-[#344558] dark:text-zinc-200">
                    {skill}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="p-0.5 text-[#7d99b3] hover:text-[#1f2732] dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
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
            className="w-full h-[50px] bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[16px] text-[15px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 border-none"
          >
            {isSaving ? "Guardando..." : "Guardar Perfil"}
          </Button>
        </div>

      </div>

      {/* Photo Picker Modal Bottom Sheet */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-t-[28px] sm:rounded-3xl bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#ebeef3] dark:border-zinc-800">
            <DialogTitle className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-50">
              Foto de Perfil
            </DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <button
              onClick={() => handleSimulatePhotoSelect(true)}
              className="w-full p-3.5 rounded-[16px] flex items-center gap-3.5 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#f5f7fa] dark:bg-zinc-800 flex items-center justify-center text-[#1f2732] dark:text-zinc-100 shrink-0">
                <CameraIcon className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[14px] font-bold text-[#1f2732] dark:text-zinc-100">
                Tomar foto con la cámara
              </span>
            </button>

            <button
              onClick={() => handleSimulatePhotoSelect(false)}
              className="w-full p-3.5 rounded-[16px] flex items-center gap-3.5 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#f5f7fa] dark:bg-zinc-800 flex items-center justify-center text-[#1f2732] dark:text-zinc-100 shrink-0">
                <GalleryIcon className="w-5 h-5 stroke-[2]" />
              </div>
              <span className="text-[14px] font-bold text-[#1f2732] dark:text-zinc-100">
                Elegir de la galería
              </span>
            </button>

            {hasCustomAvatar && (
              <button
                onClick={handleDeletePhoto}
                className="w-full p-3.5 rounded-[16px] flex items-center gap-3.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[#FEE4E2] dark:bg-rose-900/30 flex items-center justify-center text-rose-600 shrink-0">
                  <Trash2 className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-[14px] font-bold text-rose-600">
                  Eliminar foto actual
                </span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Skill Modal Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[24px] bg-white dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-bold text-[#1f2732] dark:text-zinc-50">
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
              className="h-11 bg-white dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 rounded-[12px] text-[14px]"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsAddSkillOpen(false)}
              className="text-[#5c7c9b] font-bold text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddSkill}
              className="bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs rounded-[12px] px-5 py-2"
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
