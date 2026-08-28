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
  Briefcase,
  MapPin,
  FileText,
  Check,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Stepper,
  StepperNav,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
  StepperPanel,
  StepperContent,
} from "@/components/reui/stepper";
import {
  VacancyPreviewDrawer,
  type VacancyPreviewItem,
} from "../vacancy-preview-drawer";
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
import { Step1Basic } from "./step-1-basic";
import { Step2Compensation } from "./step-2-compensation";
import { Step3Description } from "./step-3-description";
import { Step4Publication } from "./step-4-publication";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { revalidateVacancies } from "../../actions/vacancies";
import { parseLocation, formatSalaryDisplay, formatDateToDisplay } from "@/lib/formatters";
import { GEO_CONFIG } from "@/config/geo";
import { cn } from "@/lib/utils";
import Link from "next/link";

const DRAFT_STORAGE_KEY = "kanpro_vacancy_draft_v2";

export const WIZARD_STEPS = [
  {
    id: 1,
    label: "Puesto",
    sublabel: "Rol y Jornada",
    icon: Briefcase,
  },
  {
    id: 2,
    label: "Ubicación & Sueldo",
    sublabel: "Zona y Beneficios",
    icon: MapPin,
  },
  {
    id: 3,
    label: "Descripción",
    sublabel: "Detalles y Requisitos",
    icon: FileText,
  },
  {
    id: 4,
    label: "Publicación",
    sublabel: "Contacto y Preview",
    icon: Send,
  },
];

interface RawCompanyProfile {
  company_name?: string;
  contact_phone?: string;
  fiscal_address?: string;
  address_details?: string;
  logo_url?: string;
  verification_status?: string;
  subscription_plan?: string;
}

interface RawProfile {
  location?: string;
  full_name?: string;
  phone?: string;
}

interface CompanyProfileState {
  company_name?: string;
  contact_phone?: string;
  fiscal_address?: string;
  address_details?: string;
  logo_url?: string;
  verification_status?: string;
  subscription_plan?: string;
  resolvedCity?: string;
  resolvedZone?: string;
  resolvedLocation?: string;
}

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
  const [showPreviewDrawer, setShowPreviewDrawer] = React.useState(false);
  const [companyProfile, setCompanyProfile] = React.useState<CompanyProfileState | null>(null);
  const [draftLoaded, setDraftLoaded] = React.useState<boolean>(() => {
    if (typeof window === "undefined" || isEditing) return false;
    try {
      return Boolean(localStorage.getItem(DRAFT_STORAGE_KEY));
    } catch {
      return false;
    }
  });

  // TanStack Form Instance
  const form = useForm({
    defaultValues: {
      ...DEFAULT_WIZARD_VALUES,
      ...initialValues,
    } as VacancyWizardValues,
    onSubmit: async () => {},
  });

  // Load company profile for default values (phone, name, verified status, location)
  React.useEffect(() => {
    async function loadCompany() {
      try {
        const supabase = createClient();
        const [compRes, profRes] = await Promise.all([
          supabase
            .from("company_profiles")
            .select(
              "company_name, contact_phone, fiscal_address, address_details, logo_url, verification_status, subscription_plan"
            )
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("location, full_name, phone")
            .eq("id", userId)
            .maybeSingle(),
        ]);

        const comp = compRes.data as RawCompanyProfile | null;
        const prof = profRes.data as RawProfile | null;

        if (comp || prof) {
          const rawLoc =
            prof?.location ||
            comp?.fiscal_address ||
            comp?.address_details;
          const parsed = parseLocation(rawLoc);
          const cleanCity = parsed.city || "Mérida";
          const cleanZone =
            parsed.zone ||
            (cleanCity === "Mérida" ? "Centro Mérida" : "Centro");
          const stateName = GEO_CONFIG[cleanCity]?.state;
          const stateDisplay =
            stateName === "Quintana Roo" ? "Q. Roo" : stateName || "Yucatán";
          const resolvedLocationDisplay = `${cleanCity}, ${stateDisplay}`;

          setCompanyProfile({
            ...comp,
            resolvedCity: cleanCity,
            resolvedZone: cleanZone,
            resolvedLocation: resolvedLocationDisplay,
            company_name:
              comp?.company_name || prof?.full_name || "Tu Empresa",
          });

          // Pre-fill phone if available and form is empty
          if (comp?.contact_phone && !form.getFieldValue("contact_phone")) {
            form.setFieldValue("contact_phone", comp.contact_phone);
          }

          // Pre-fill location & zone if form is creating a new vacancy and using default or dirty street address
          if (!isEditing) {
            const currentLoc = form.getFieldValue("location");
            const isStreetAddress =
              /^(calle|av\.|avenida|carretera|carr\.|diag\.|diagonal|sm\b|mz\b|lote|c\.)/i.test(
                currentLoc || ""
              );
            if (
              !currentLoc ||
              currentLoc === "Mérida, Yucatán" ||
              currentLoc === "Mérida" ||
              isStreetAddress
            ) {
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
  }, [userId, isEditing, form]);

  // Load draft from localStorage on mount (if not editing an existing vacancy)
  React.useEffect(() => {
    if (isEditing) return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          Object.keys(parsed).forEach((key) => {
            form.setFieldValue(key as keyof VacancyWizardValues, parsed[key]);
          });
        }
      }
    } catch (e) {
      console.warn("Could not parse draft:", e);
    }
  }, [isEditing, form]);

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
      description:
        "Puedes ajustar cualquiera de los datos según las necesidades de tu empresa.",
    });
  };

  // Validate current step before advancing
  const validateStep = (step: number): boolean => {
    const values = form.state.values;

    if (step === 1) {
      const res = step1Schema.safeParse(values);
      if (!res.success) {
        const firstErr =
          res.error.issues[0]?.message || "Completa los campos del puesto";
        toast.error("Paso 1 incompleto", { description: firstErr });
        return false;
      }
      return true;
    }

    if (step === 2) {
      const res = step2Schema.safeParse(values);
      if (!res.success) {
        const firstErr =
          res.error.issues[0]?.message || "Verifica la ubicación y salarios";
        toast.error("Paso 2 incompleto", { description: firstErr });
        return false;
      }
      return true;
    }

    if (step === 3) {
      const res = step3Schema.safeParse(values);
      if (!res.success) {
        const firstErr =
          res.error.issues[0]?.message || "Escribe una descripción adecuada";
        toast.error("Paso 3 incompleto", { description: firstErr });
        return false;
      }
      return true;
    }

    if (step === 4) {
      const res = step4Schema.safeParse(values);
      if (!res.success) {
        const firstErr =
          res.error.issues[0]?.message ||
          "Ingresa un número de WhatsApp válido";
        toast.error("Paso 4 incompleto", { description: firstErr });
        return false;
      }
      return true;
    }

    return true;
  };

  const handleStepChange = (targetStep: number) => {
    if (targetStep === currentStep) return;

    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Attempting to jump forward
    if (validateStep(currentStep)) {
      setCurrentStep(targetStep);
      setMaxAccessibleStep((prev) => Math.max(prev, targetStep));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
      const err =
        fullValidation.error.issues[0]?.message ||
        "Revisa los campos del formulario";
      toast.error("Error en el formulario", { description: err });
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // Check active vacancy plan limits if publishing
      if (publishNow) {
        const plan = companyProfile?.subscription_plan || "basic";
        let maxAllowed = 3;
        if (plan === "pro") maxAllowed = 15;
        if (plan === "enterprise") maxAllowed = Infinity;

        if (maxAllowed !== Infinity) {
          let countQuery = supabase
            .from("vacancies")
            .select("id", { count: "exact", head: true })
            .eq("company_id", userId)
            .eq("is_active", true);

          if (isEditing && vacancyId) {
            countQuery = countQuery.neq("id", vacancyId);
          }

          const { count: activeCount } = await countQuery;

          if ((activeCount || 0) >= maxAllowed) {
            throw new Error(
              `Has alcanzado el límite de ${maxAllowed} vacantes activas de tu Plan ${plan.toUpperCase()}. Actualiza a Plan PRO en Configuración o guarda como borrador.`
            );
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        company_id: userId,
        recruiter_id: userId,
        title: values.title.trim(),
        category: values.category,
        employment_type: values.employment_type,
        shift_schedule: values.shift_schedule || "Matutino (Mañana)",
        positions_available: Number(values.positions_available) || 1,
        location: values.location,
        zone: values.zone,
        modality: "Presencial",
        salary_min: values.salary_min !== undefined ? values.salary_min : null,
        salary_max: values.salary_max !== undefined ? values.salary_max : null,
        currency: "MXN",
        payment_frequency: values.payment_frequency || "quincenal",
        description: values.description,
        requirements: values.description,
        experience_required:
          values.experience_required || "Sin experiencia previa",
        education_level: values.education_level || "Indistinto",
        benefits: Array.isArray(values.benefits) ? values.benefits : [],
        skills: Array.isArray(values.skills) ? values.skills : [],
        tags: Array.isArray(values.skills) ? values.skills : [],
        contact_phone: values.contact_phone || null,
        contact_email: values.contact_email || null,
        preferred_contact_method:
          values.preferred_contact_method || "whatsapp",
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
        const { error } = await supabase.from("vacancies").insert([payload]);

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
    } catch (err: unknown) {
      console.error("Error saving vacancy:", err);
      toast.error("Error al guardar la vacante", {
        description:
          (err as Error).message ||
          "Ocurrió un error inesperado al conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live preview item derived from current form values for the Drawer
  const formValues = form.state.values;
  const previewVacancyData: VacancyPreviewItem = React.useMemo(() => {
    return {
      id: vacancyId || "preview-new-vacancy",
      title: formValues.title || "Título del Puesto (Borrador)",
      category: formValues.category,
      employment_type: formValues.employment_type,
      shift_schedule: formValues.shift_schedule,
      location: formValues.location,
      zone: formValues.zone,
      salary_min: formValues.salary_min,
      salary_max: formValues.salary_max,
      currency: "MXN",
      payment_frequency: formValues.payment_frequency,
      description: formValues.description,
      requirements: formValues.description,
      benefits: formValues.benefits,
      skills: formValues.skills,
      contact_phone: formValues.contact_phone,
      contact_email: formValues.contact_email,
      is_active: formValues.is_active,
      created_at: new Date().toISOString(),
      applicants_count: 0,
    };
  }, [formValues, vacancyId]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16 font-sans">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/company/vacancies"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          <span>Volver a Mis Vacantes</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Botón de Vista Previa Drawer */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewDrawer(true)}
            className="h-8 px-3 rounded-xl text-xs font-semibold text-foreground border-border/70 hover:bg-muted gap-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="size-3.5 text-primary" />
            <span>Vista Previa</span>
          </Button>

          {draftLoaded && !isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDraft}
              className="h-8 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-rose-500 gap-1.5 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Limpiar Borrador</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Modern Multi-step Stepper Component */}
      <Stepper
        value={currentStep}
        onValueChange={handleStepChange}
        className="space-y-6"
      >
        {/* Stepper Navigation Bar */}
        <Card className="bg-card border border-border/60 rounded-3xl p-2 sm:p-3 shadow-xs">
          <StepperNav className="gap-1 sm:gap-2">
            {WIZARD_STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= maxAccessibleStep;
              const Icon = step.icon;

              return (
                <StepperItem
                  key={step.id}
                  step={step.id}
                  completed={isCompleted}
                  disabled={!isAccessible}
                  className="flex-1"
                >
                  <StepperTrigger
                    className={cn(
                      "w-full justify-start p-2 sm:p-3 rounded-2xl transition-all select-none text-left cursor-pointer",
                      isCurrent
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : isCompleted
                        ? "hover:bg-muted/60 text-foreground"
                        : "text-muted-foreground hover:bg-muted/30 opacity-70",
                      !isAccessible && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <StepperIndicator
                      className={cn(
                        "size-8 rounded-xl font-bold text-xs shrink-0 transition-colors",
                        isCurrent
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : isCompleted
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-4 stroke-[3]" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </StepperIndicator>

                    <div className="flex flex-col min-w-0 pr-1">
                      <span
                        className={cn(
                          "text-[10px] font-extrabold uppercase tracking-wider",
                          isCurrent
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        Paso {step.id}
                      </span>
                      <StepperTitle
                        className={cn(
                          "text-xs sm:text-sm font-bold truncate leading-tight mt-0.5",
                          isCurrent
                            ? "text-primary-foreground font-extrabold"
                            : "text-foreground"
                        )}
                      >
                        {step.label}
                      </StepperTitle>
                      <StepperDescription
                        className={cn(
                          "text-[11px] truncate hidden md:block mt-0.5",
                          isCurrent
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground"
                        )}
                      >
                        {step.sublabel}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>

                  <StepperSeparator className="hidden lg:block self-center mx-1" />
                </StepperItem>
              );
            })}
          </StepperNav>
        </Card>

        {/* 3. Main Form Panel Card */}
        <Card className="bg-card border border-border/60 rounded-3xl p-6 sm:p-10 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="space-y-8"
          >
            <StepperPanel>
              {/* Step 1: Puesto y Datos Básicos */}
              <StepperContent value={1}>
                <Step1Basic form={form} onApplyPreset={handleApplyPreset} />
              </StepperContent>

              {/* Step 2: Ubicación & Compensación */}
              <StepperContent value={2}>
                <Step2Compensation
                  form={form}
                  companyLocation={
                    companyProfile?.resolvedLocation || "Mérida, Yucatán"
                  }
                  companyCity={companyProfile?.resolvedCity || "Mérida"}
                  companyZone={companyProfile?.resolvedZone || "Centro Mérida"}
                  companyName={companyProfile?.company_name || "Tu Empresa"}
                />
              </StepperContent>

              {/* Step 3: Descripción & Requisitos */}
              <StepperContent value={3}>
                <Step3Description form={form} />
              </StepperContent>

              {/* Step 4: Contacto & Publicación */}
              <StepperContent value={4}>
                <Step4Publication
                  form={form}
                  onOpenPreviewDrawer={() => setShowPreviewDrawer(true)}
                />
              </StepperContent>
            </StepperPanel>

            {/* 4. Wizard Footer Action Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-border/50">
              {/* Left Action Button */}
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="h-12 px-6 rounded-2xl font-bold text-xs gap-2 cursor-pointer order-2 sm:order-1 border-border/70 hover:bg-muted"
                >
                  <ArrowLeft className="size-4" />
                  <span>Paso Anterior</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  render={<Link href="/dashboard/company/vacancies" />}
                  className="h-12 px-5 rounded-2xl font-semibold text-xs text-muted-foreground hover:text-foreground cursor-pointer order-2 sm:order-1"
                >
                  Cancelar
                </Button>
              )}

              {/* Right Action Buttons */}
              <div className="flex items-center gap-3 justify-end order-1 sm:order-2">
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="h-12 px-7 rounded-2xl font-bold text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer w-full sm:w-auto"
                  >
                    <span>Continuar al Paso {currentStep + 1}</span>
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <>
                    {/* Save as Draft Button */}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => handleFinalSubmit(false)}
                      className="h-12 px-6 rounded-2xl font-bold text-xs sm:text-sm gap-2 border-border/70 hover:bg-muted cursor-pointer shadow-2xs"
                    >
                      <Save className="size-4 text-muted-foreground" />
                      <span>Guardar Borrador</span>
                    </Button>

                    {/* Publish Button */}
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleFinalSubmit(true)}
                      className="h-12 px-7 rounded-2xl font-extrabold text-xs sm:text-sm gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer"
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
      </Stepper>

      {/* 5. Vacancy Preview Drawer (Reutilizado para el Wizard) */}
      <VacancyPreviewDrawer
        vacancy={previewVacancyData}
        open={showPreviewDrawer}
        onOpenChange={setShowPreviewDrawer}
        formatSalary={(min, max) => {
          if (!min && !max) return "No especificado";
          if (min && !max) return `Desde ${formatSalaryDisplay(min)}`;
          if (!min && max) return `Hasta ${formatSalaryDisplay(max)}`;
          return `${formatSalaryDisplay(min)} - ${formatSalaryDisplay(max)}`;
        }}
        formatDate={(dateStr) => formatDateToDisplay(dateStr) || "Hoy"}
      />
    </div>
  );
}
