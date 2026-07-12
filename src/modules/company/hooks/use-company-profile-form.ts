import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { companyProfileSchema, type CompanyProfileFormValues } from "../schemas/company.schema";
import { companyService } from "../services/company-service";

export function useCompanyProfileForm(initialProfile: any, userId: string) {
  const [isSaving, setIsSaving] = React.useState(false);
  const router = useRouter();

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      company_name: initialProfile?.company_name || "",
      industry: initialProfile?.industry || "",
      website: initialProfile?.website_or_linkedin || initialProfile?.website || "",
      location: initialProfile?.location || "",
      logo_url: initialProfile?.logo_url || "",
      description: initialProfile?.description || "",
      phone: initialProfile?.phone || "",
      company_size: initialProfile?.company_size || "",
    },
  });

  const onSubmit = async (values: CompanyProfileFormValues) => {
    setIsSaving(true);
    try {
      await companyService.updateProfile(userId, values);
      toast.success("¡Perfil actualizado con éxito!", {
        description: "La información de tu empresa ha sido guardada en la base de datos."
      });
      form.reset(values);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al guardar el perfil", {
        description: "No se pudo guardar el perfil de la empresa."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    form.reset();
  };

  return {
    form,
    isSaving,
    onSubmit: form.handleSubmit(onSubmit),
    handleReset,
  };
}
