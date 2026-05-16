import { useState } from "react";
import { toast } from "sonner";
import { proService } from "../services/pro-service";

export function useProfileForm(initialProfile: any, userId: string) {
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [skillsInput, setSkillsInput] = useState(initialProfile.skills?.join(", ") || "");

  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (value: string) => {
    const skillsArray = value.split(',').map((s: string) => s.trim()).filter((s: string) => s !== "");
    setProfile((prev: any) => ({ ...prev, skills: skillsArray }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await proService.updateProfile(userId, profile);
      toast.success("Perfil actualizado", {
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Error al guardar", {
        description: error.message || "Ocurrió un error al actualizar el perfil.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setProfile(initialProfile);
    setSkillsInput(initialProfile.skills?.join(", ") || "");
  };

  return {
    profile,
    setProfile,
    skillsInput,
    setSkillsInput,
    isSaving,
    handleChange,
    handleSkillsChange,
    handleSave,
    handleReset,
  };
}
