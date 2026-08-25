"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  DEFAULT_WIZARD_VALUES,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  vacancyWizardSchema,
  type VacancyWizardValues,
} from "../../schemas/vacancy-wizard.schema";
import { type VacancyPreset } from "../../data/vacancy-presets";
import { StepIndicator } from "./step-indicator";
import { Step1Basic } from "./step-1-basic";
import { Step2Compensation } from "./step-2-compensation";
import { Step3Description } from "./step-3-description";
import { Step4Publication } from "./step-4-publication";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { revalidateVacancies } from "../../actions/vacancies";
import { parseLocation, cleanCityName } from "@/lib/formatters";
import { GEO_CONFIG } from "@/config/geo";
import Link from "next/link";

const DRAFT_STORAGE_KEY = "kanpro_vacancy_draft_v2";

interface VacancyWizardContainerProps {
  userId: string;
  initialValues?: Partial<VacancyWizardValues>;
  isEditing?: boolean;
  vacancyId?: string;
}

export function VacancyWizardContainer({
  userId,
  initialValues,
  isEditing = false,
  vacancyId,
}: VacancyWizardContainerProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [companyProfile, setCompanyProfile] = React.useState<any>(null);
  const [draftLoaded, setDraftLoaded] = React.useState(false);

  // Load company profile for default values (phone, name, verified status, location)
  React.useEffect(() => {
    async function loadCompany() {
      try {
        const supabase = createClient();
        const [compRes, profRes] = await Promise.all([
          supabase
            .from("company_profiles")
            .select("company_name, contact_phone, fiscal_address, address_details, logo_url, verification_status")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("location, full_name, phone")
            .eq("id", userId)
            .maybeSingle(),
        ]);

        const comp = compRes.data as any;
        const prof = profRes.data as any;

        if (comp || prof) {
          const rawLoc = prof?.location || comp?.fiscal_address || comp?.address_details;
          const parsed = parseLocation(rawLoc);
          const cleanCity = parsed.city || "Mérida";
          const cleanZone = parsed.zone || (cleanCity === "Mérida" ? "Centro Mérida" : "Centro");
          const stateName = GEO_CONFIG[cleanCity]?.state;
          const stateDisplay = stateName === "Quintana Roo" ? "Q. Roo" : stateName || "Yucatán";
          const resolvedLocationDisplay = `${cleanCity}, ${stateDisplay}`;

          setCompanyProfile({
            ...comp,
            resolvedCity: cleanCity,
            resolvedZone: cleanZone,
            resolvedLocation: resolvedLocationDisplay,
            company_name: comp?.company_name || prof?.full_name || "Tu Empresa",
          });

          // Pre-fill phone if available and form is empty
          if (comp?.contact_phone && !form.getFieldValue("contact_phone")) {
            form.setFieldValue("contact_phone", comp.contact_phone);
          }

          // Pre-fill location & zone if form is creating a new vacancy and using default or dirty street address
          if (!isEditing) {
            const currentLoc = form.getFieldValue("location");
            const isStreetAddress = /^(calle|av\.|avenida|carretera|carr\.|diag\.|diagonal|sm\b|mz\b|lote|c\.)/i.test(currentLoc || "");
            if (!currentLoc || currentLoc === "Mérida, Yucatán" || currentLoc === "Mérida" || isStreetAddress) {
              form.setFieldValue("location", cleanCity);
              form.setFieldValue("zone", cleanZone);
            }
          }
        }
      } catch (err) {
        console.error("Error loading company profile:", err);
      }
    }
    loadCompany();
  }, [userId, isEditing]);



  // TanStack Form Instance
  const form = useForm({
    defaultValues: {
      ...DEFAULT_WIZARD_VALUES,
      ...initialValues,
    } as VacancyWizardValues,
    onSubmit: async () => {},
  });

  // Load draft from localStorage on mount (if not editing an existing vacancy)
  React.useEffect(() => {
    if (isEditing) return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          Object.keys(parsed).forEach((key) => {
            form.setFieldValue(key as any, parsed[key]);
          });
          setDraftLoaded(true);
        }
      }
    } catch (e) {
      console.warn("Could not parse draft:", e);
    }
  }, [isEditing]);

  // Debounced auto-save draft using react-pacer
  const saveDraftDebounced = useDebouncedCallback(
    (values: VacancyWizardValues) => {
      if (isEditing) return;
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
      } catch (e) {
        console.warn("Draft save failed:", e);
      }
    },
    { wait: 1000 }
  );

  // Trigger auto-save whenever form state changes
  React.useEffect(() => {
    saveDraftDebounced(form.state.values);
  }, [form.state.values, saveDraftDebounced]);

  // Apply quick preset
  const handleApplyPreset = (preset: VacancyPreset) => {
    form.setFieldValue("title", preset.title);
    form.setFieldValue("category", preset.category);
    form.setFieldValue("employment_type", preset.employment_type);
    form.setFieldValue("shift_schedule", preset.shift_schedule);
    form.setFieldValue("salary_min", preset.salary_min);
    form.setFieldValue("salary_max", preset.salary_max);
    form.setFieldValue("payment_frequency", preset.payment_frequency);
    form.setFieldValue("benefits", preset.benefits);
    form.setFieldValue("description", preset.description);
    form.setFieldValue("skills", preset.skills);
    form.setFieldValue("experience_required", preset.experience_required);
    form.setFieldValue("education_level", preset.education_level);

    toast.success(`Plantilla aplicada: ${preset.name}`, {
      description: "Puedes ajustar cualquiera de los datos según las necesidades de tu empresa.",
    });
  };

  // Validate current step before advancing
  const validateStep = (step: number): boolean => {
    const values = form.state.values;

    if (step === 1) {
      const res = step1Schema.safeParse(values);
      if (!res.success) {
        const firstErr = res.error.issues[0]?.message || "Completa los campos del puesto";
        toast.error("Paso 1 incompleto", { description: firstErr });
        return false;
      }
      return true;
    }

    if (step === 2) {
      const res = step2Schema.safeParse(values);
      if (!res.success) {
        const firstErr = res.error.issues[0]?.message || "Verifica la ubicación y salarios";
        toast.error("Paso 2 incompleto", { description: firstErr });
        return false;
      }
      return true;
    }

    if (step === 3) {
      const res = step3Schema.safeParse(values);
      if (!res.success) {
        const firstErr = res.error.issues[0]?.message || "Escribe una descripción adecuada";
        toast.error("Paso 3 incompleto", { description: firstErr });
        return false;
      }
      return true;
    }

    if (step === 4) {
      const res = step4Schema.safeParse(values);
      if (!res.success) {
        const firstErr = res.error.issues[0]?.message || "Ingresa un número de WhatsApp válido";
        toast.error("Paso 4 incompleto", { description: firstErr });
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setMaxAccessibleStep((prev) => Math.max(prev, next));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      form.reset();
      setCurrentStep(1);
      setMaxAccessibleStep(1);
      setDraftLoaded(false);
      toast.success("Borrador restablecido a valores iniciales");
    } catch (e) {
      console.error(e);
    }
  };

  // Submit to Supabase
  const handleFinalSubmit = async (publishNow: boolean = true) => {
    const values = form.state.values;
    const fullValidation = vacancyWizardSchema.safeParse(values);
    if (!fullValidation.success) {
      const err = fullValidation.error.issues[0]?.message || "Revisa los campos del formulario";
      toast.error("Error en el formulario", { description: err });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      const payload: any = {
        company_id: userId,
        recruiter_id: userId,
        title: values.title.trim(),
        category: values.category,
        employment_type: values.employment_type,
        location: values.location,
        zone: values.zone,
        salary_min: values.salary_min || null,
        salary_max: values.salary_max || null,
        currency: "MXN",
        description: values.description,
        benefits: values.benefits,
        skills: values.skills || [],
        requirements: values.description, // backward compatible
        is_active: publishNow,
        status: publishNow ? "Activa" : "Borrador",
      };

      if (isEditing && vacancyId) {
        const { error } = await supabase
          .from("vacancies")
          .update(payload)
          .eq("id", vacancyId)
          .eq("company_id", userId);

        if (error) throw error;

        toast.success(
          publishNow
            ? "¡Vacante actualizada y publicada exitosamente!"
            : "¡Vacante guardada como borrador!"
        );
      } else {
        const { error } = await supabase
          .from("vacancies")
          .insert([payload]);

        if (error) throw error;

        // Clear local storage draft
        try {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch {}

        toast.success(
          publishNow
            ? "¡Oferta publicada exitosamente!"
            : "¡Oferta guardada como borrador!",
          {
            description: publishNow
              ? "Tu vacante ya está visible para todos los candidatos locales."
              : "Tu vacante se ha guardado en tu panel de ofertas pausadas/borradores.",
          }
        );
      }

      await revalidateVacancies();
      router.push("/dashboard/company/vacancies");
      router.refresh();
    } catch (err: any) {
      console.error("Error saving vacancy:", err);
      toast.error("Error al guardar la vacante", {
        description: err.message || "Ocurrió un error inesperado al conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header with Breadcrumb Back link and Draft reset */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/company/vacancies"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Volver a Mis Vacantes</span>
        </Link>

        {draftLoaded && !isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearDraft}
            className="h-8 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-rose-500 gap-1 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Limpiar Borrador</span>
          </Button>
        )}
      </div>

      {/* 2. Step Indicator Stepper */}
      <Card className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 shadow-xs">
        <StepIndicator
          currentStep={currentStep}
          maxAccessibleStep={maxAccessibleStep}
          onStepClick={(step) => {
            if (step < currentStep || validateStep(currentStep)) {
              setCurrentStep(step);
            }
          }}
        />
      </Card>

      {/* 3. Main Form Content Card */}
      <Card className="bg-card border border-border/60 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="space-y-6"
        >
          {/* Active Step Render */}
          {currentStep === 1 && (
            <Step1Basic form={form} onApplyPreset={handleApplyPreset} />
          )}

          {currentStep === 2 && (
            <Step2Compensation
              form={form}
              companyLocation={companyProfile?.resolvedLocation || "Mérida, Yucatán"}
              companyCity={companyProfile?.resolvedCity || "Mérida"}
              companyZone={companyProfile?.resolvedZone || "Centro Mérida"}
              companyName={companyProfile?.company_name || "Tu Empresa"}
            />
          )}

          {currentStep === 3 && (
            <Step3Description form={form} />
          )}

          {currentStep === 4 && (
            <Step4Publication
              form={form}
              companyName={companyProfile?.company_name || "Tu Empresa"}
              isVerified={
                companyProfile?.verification_status === "verified" ||
                companyProfile?.verification_status === "approved"
              }
            />
          )}

          {/* 4. Wizard Footer Navigation */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-border/50">
            {/* Back Button */}
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl font-bold text-xs gap-1.5 cursor-pointer order-2 sm:order-1"
              >
                <ArrowLeft className="size-3.5" />
                <span>Paso Anterior</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                render={<Link href="/dashboard/company/vacancies" />}
                className="h-10 px-4 rounded-xl font-semibold text-xs text-muted-foreground hover:text-foreground cursor-pointer order-2 sm:order-1"
              >
                Cancelar
              </Button>
            )}

            {/* Step 1-3: Continue button | Step 4: Draft & Publish buttons */}
            <div className="flex items-center gap-2.5 justify-end order-1 sm:order-2">
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="h-10 px-6 rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer w-full sm:w-auto"
                >
                  <span>Continuar al Paso {currentStep + 1}</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : (
                <>
                  {/* Save as Draft Button */}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => handleFinalSubmit(false)}
                    className="h-11 px-5 rounded-xl font-bold text-xs gap-2 border-border/70 hover:bg-muted cursor-pointer shadow-2xs"
                  >
                    <Save className="size-4 text-muted-foreground" />
                    <span>Guardar Borrador</span>
                  </Button>

                  {/* Publish Button */}
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFinalSubmit(true)}
                    className="h-11 px-6 rounded-xl font-extrabold text-xs sm:text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Publicando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>Publicar Oferta Ahora</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
