import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { companyProfileSchema, type CompanyProfileFormValues } from "../schemas/company.schema";
import { companyService } from "../services/company-service";

export function normalizeCity(loc?: string | null): string {
  if (!loc) return "";
  const lower = loc.toLowerCase().trim();
  if (lower.includes("carrillo")) return "Felipe Carrillo Puerto";
  if (lower.includes("playa del carmen")) return "Playa del Carmen";
  if (lower.includes("tulum")) return "Tulum";
  if (lower.includes("cancún") || lower.includes("cancun")) return "Cancún";
  if (lower.includes("cozumel")) return "Cozumel";
  if (lower.includes("puerto morelos")) return "Puerto Morelos";
  if (lower.includes("isla mujeres")) return "Isla Mujeres";
  if (lower.includes("chetumal")) return "Chetumal";
  if (lower.includes("bacalar")) return "Bacalar";
  if (lower.includes("valladolid")) return "Valladolid";
  if (lower.includes("progreso")) return "Progreso";
  if (lower.includes("campeche")) return "Campeche";
  if (lower.includes("mérida") || lower.includes("merida")) return "Mérida";
  if (loc.includes(" - ")) return loc.split(" - ")[0].trim();
  return loc.trim();
}

export interface CompanyProfileInitialData {
  company_name?: string | null;
  legal_name?: string | null;
  industry?: string | null;
  website_or_linkedin?: string | null;
  website?: string | null;
  location?: string | null;
  fiscal_address?: string | null;
  logo_url?: string | null;
  avatar_url?: string | null;
  description?: string | null;
  phone?: string | null;
  contact_phone?: string | null;
  whatsapp_number?: string | null;
  company_size?: string | null;
  fiscal_regime?: "persona_moral" | "persona_fisica" | string | null;
  entity_type?: string | null;
  rfc?: string | null;
  is_validated?: boolean | null;
  is_verified?: boolean | null;
  verification_status?: "pending" | "approved" | "rejected" | "unsubmitted" | string | null;
  banner_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  address_details?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  operation_hours?: string | null;
  has_transport?: boolean | null;
  benefit_canteen?: boolean | null;
  benefit_tips?: boolean | null;
  benefit_imss?: boolean | null;
  benefit_uniforms?: boolean | null;
  benefit_growth?: boolean | null;
  display_name?: string | null;
  full_name?: string | null;
  username?: string | null;
}

export function useCompanyProfileForm(
  initialProfile: CompanyProfileInitialData | null | undefined,
  userId: string
) {
  const [isSaving, setIsSaving] = React.useState(false);
  const router = useRouter();

  const rawLocation = initialProfile?.location || initialProfile?.fiscal_address || "";

  const rawName = initialProfile?.company_name;
  const resolvedName = (rawName && rawName.trim() !== "" && rawName.trim() !== "Nueva Empresa")
    ? rawName
    : (initialProfile?.display_name || initialProfile?.full_name || initialProfile?.username || "");

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      company_name: resolvedName,
      industry: initialProfile?.industry || "",
      website: initialProfile?.website_or_linkedin || initialProfile?.website || "",
      location: normalizeCity(rawLocation),
      logo_url: initialProfile?.logo_url || initialProfile?.avatar_url || "",
      description: initialProfile?.description || "",
      phone: initialProfile?.phone || initialProfile?.contact_phone || initialProfile?.whatsapp_number || "",
      company_size: initialProfile?.company_size || "",
      banner_url: initialProfile?.banner_url || "",
      instagram_url: initialProfile?.instagram_url || "",
      facebook_url: initialProfile?.facebook_url || "",
      address_details: initialProfile?.address_details || "",
      latitude: typeof initialProfile?.latitude === "number" ? initialProfile.latitude : undefined,
      longitude: typeof initialProfile?.longitude === "number" ? initialProfile.longitude : undefined,
      has_transport: !!initialProfile?.has_transport,
      benefit_canteen: !!initialProfile?.benefit_canteen,
      benefit_tips: !!initialProfile?.benefit_tips,
      benefit_imss: !!initialProfile?.benefit_imss,
      benefit_uniforms: !!initialProfile?.benefit_uniforms,
      benefit_growth: !!initialProfile?.benefit_growth,
      operation_hours: initialProfile?.operation_hours || "",
    },
  });

  const onSubmit = async (values: CompanyProfileFormValues) => {
    setIsSaving(true);
    try {
      await companyService.updateProfile(userId, values);
      toast.success("¡Perfil actualizado con éxito!", {
        description: "La información comercial de tu empresa ha sido guardada en la base de datos."
      });
      form.reset(values);
      router.refresh();
    } catch (error: unknown) {
      console.error("Error updating company profile:", error);
      const errMsg = error instanceof Error ? error.message : "No se pudo guardar el perfil de la empresa.";
      toast.error("Error al guardar el perfil", {
        description: errMsg
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
    onSubmit: form.handleSubmit(
      (data) => onSubmit(data),
      (errors) => {
        console.warn("Validation errors in company profile form:", errors);
        const firstKey = Object.keys(errors)[0] as keyof typeof errors | undefined;
        const firstError = firstKey ? errors[firstKey] : undefined;
        toast.error("Por favor completa los campos requeridos", {
          description: (firstError?.message as string) || "Verifica la información ingresada en el formulario.",
        });
      }
    ),
    handleReset,
  };
}
