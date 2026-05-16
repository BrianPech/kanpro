import { useState } from "react";
import { toast } from "sonner";
import { companyService } from "../services/company-service";

export function useCompanyProfileForm(initialProfile: any, userId: string) {
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(initialProfile);

  const handleSave = async () => {
    if (!profile.company_name) {
      toast.error("El nombre de la empresa es obligatorio");
      return;
    }

    setIsSaving(true);
    try {
      await companyService.updateProfile(userId, profile);
      toast.success("Perfil actualizado", {
        description: "La información de tu empresa ha sido guardada."
      });
    } catch (error: any) {
      console.error(error);
      toast.error("Error", {
        description: "No se pudo guardar el perfil de la empresa."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setProfile(initialProfile);
  };

  return {
    profile,
    setProfile,
    isSaving,
    handleSave,
    handleReset,
  };
}
