"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
  RotateCcw,
  Loader2,
  Check,
  Eye,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Stepper,
  StepperNav,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
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
import { Step1Basic } from "./step-1-basic";
import { Step2Compensation } from "./step-2-compensation";
import { Step3Description } from "./step-3-description";
import { Step4Publication } from "./step-4-publication";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import {
  revalidateVacancies,
  createVacancyAction,
  updateVacancyAction,
} from "../../actions/vacancies";
import { parseLocation, formatSalaryDisplay, formatDateToDisplay } from "@/lib/formatters";
import { GEO_CONFIG } from "@/config/geo";
import { cn } from "@/lib/utils";
import Link from "next/link";

const DRAFT_STORAGE_KEY = "kanpro_vacancy_draft_v2";

export const WIZARD_STEPS = [
  {
    id: 1,
    label: "Puesto",
  },
  {
    id: 2,
    label: "Ubicación & Sueldo",
  },
  {
    id: 3,
    label: "Descripción",
  },
  {
    id: 4,
    label: "Publicación",
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
  const [savedDraft, setSavedDraft] = React.useState<VacancyWizardValues | null>(() => {
    if (typeof window === "undefined" || isEditing) return null;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === "object" &&
          (parsed.title?.trim() || parsed.description?.trim())
        ) {
          return parsed;
        }
      }
    } catch {
      return null;
    }
    return null;
  });

  // React Hook Form Instance
  const form = useForm<VacancyWizardValues>({
    defaultValues: {
      ...DEFAULT_WIZARD_VALUES,
      ...initialValues,
    },
  });

  const formValues = useWatch({ control: form.control }) as VacancyWizardValues;

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
            .select("location, full_name, whatsapp_number")
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
          if (comp?.contact_phone && !form.getValues("contact_phone")) {
            form.setValue("contact_phone", comp.contact_phone);
          }

          // Pre-fill location & zone if form is creating a new vacancy and using default or dirty street address
          if (!isEditing) {
            const currentLoc = form.getValues("location");
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
              form.setValue("location", cleanCity);
              form.setValue("zone", cleanZone);
            }
          }
        }
      } catch (err) {
        console.error("Error loading company profile:", err);
      }
    }
    loadCompany();
  }, [userId, isEditing, form]);

  // Debounced auto-save draft using react-pacer
  const saveDraftDebounced = useDebouncedCallback(
    (values: VacancyWizardValues) => {
      if (isEditing) return;
      try {
        if (values.title?.trim() || values.description?.trim()) {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
        }
      } catch (e) {
        console.warn("Draft save failed:", e);
      }
    },
    { wait: 1000 }
  );

  // Trigger auto-save whenever form state changes
  React.useEffect(() => {
    saveDraftDebounced(formValues);
  }, [formValues, saveDraftDebounced]);

  // Validate current step before advancing
  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    form.clearErrors();

    const stepSchemas = {
      1: { schema: step1Schema, title: "Paso 1 incompleto", fallback: "Completa los campos del puesto" },
      2: { schema: step2Schema, title: "Paso 2 incompleto", fallback: "Verifica la ubicación y salarios" },
      3: { schema: step3Schema, title: "Paso 3 incompleto", fallback: "Escribe una descripción adecuada" },
      4: { schema: step4Schema, title: "Paso 4 incompleto", fallback: "Ingresa un número de WhatsApp válido" },
    } as const;

    const entry = stepSchemas[step as keyof typeof stepSchemas];
    if (!entry) return true;

    const res = entry.schema.safeParse(values);
    if (!res.success) {
      for (const issue of res.error.issues) {
        const fieldName = issue.path[0];
        if (typeof fieldName === "string") {
          form.setError(fieldName as keyof VacancyWizardValues, { message: issue.message });
        }
      }
      const firstErr = res.error.issues[0]?.message || entry.fallback;
      toast.error(entry.title, { description: firstErr });
      return false;
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
      setSavedDraft(null);
      toast.success("Formulario restablecido a valores iniciales");
    } catch (e) {
      console.error(e);
    }
  };

  // Submit to Supabase
  const handleFinalSubmit = async (publishNow: boolean = true) => {
    const values = form.getValues();
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
      const wizardData: VacancyWizardValues = {
        ...values,
        is_active: publishNow,
      };

      let res;
      if (isEditing && vacancyId) {
        res = await updateVacancyAction(vacancyId, wizardData);
      } else {
        res = await createVacancyAction(wizardData);
      }

      if (!res.success) {
        throw new Error(res.error || "No se pudo guardar la vacante.");
      }

      // Clear local storage draft
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

      toast.success(
        isEditing
          ? publishNow
            ? "¡Vacante actualizada y publicada exitosamente!"
            : "¡Vacante guardada como borrador!"
          : publishNow
          ? "¡Oferta publicada exitosamente!"
          : "¡Oferta guardada como borrador!",
        {
          description: publishNow
            ? "Tu vacante ya está visible para todos los candidatos locales."
            : "Tu vacante se ha guardado en tu panel de ofertas pausadas/borradores.",
        }
      );

      router.push("/dashboard/company/vacancies");
      router.refresh();
    } catch (err: unknown) {
      console.error("Error saving vacancy:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al conectar con el servidor.";
      toast.error("Error al guardar la vacante", {
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live preview item derived from current form values for the Drawer
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
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-24 sm:pb-16 font-sans">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/company/vacancies"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="hidden xs:inline sm:inline">Volver a Mis Vacantes</span>
          <span className="xs:hidden sm:hidden">Vacantes</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Botón de Vista Previa Drawer */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewDrawer(true)}
            className="cursor-pointer gap-1.5"
          >
            <Eye className="size-3.5 text-primary" />
            <span>Vista Previa</span>
          </Button>

          {!isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDraft}
              className="text-muted-foreground hover:text-rose-500 gap-1.5 cursor-pointer"
              title="Restablecer formulario a valores iniciales"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Draft Recovery Alert (Optional & Dismissible) */}
      {savedDraft && !isEditing && (
        <div className="p-3.5 sm:p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-semibold">
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="text-foreground font-bold flex items-center gap-1.5 truncate">
              <RotateCcw className="size-3.5 text-primary shrink-0" />
              <span className="truncate">Borrador previo: &ldquo;{savedDraft.title || "Sin título"}&rdquo;</span>
            </p>
            <p className="text-muted-foreground text-[11px] line-clamp-2">
              ¿Deseas recuperar los datos de tu sesión previa o continuar desde cero?
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                } catch {}
                setSavedDraft(null);
                toast.info("Borrador previo descartado");
              }}
              className="h-8 text-xs font-semibold rounded-xl cursor-pointer flex-1 sm:flex-none"
            >
              Descartar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                form.reset({
                  ...DEFAULT_WIZARD_VALUES,
                  ...initialValues,
                  ...savedDraft,
                });
                setSavedDraft(null);
                toast.success("Borrador restaurado en el formulario");
              }}
              className="h-8 text-xs font-bold rounded-xl bg-primary text-primary-foreground cursor-pointer gap-1.5 flex-1 sm:flex-none"
            >
              <Check className="size-3.5" />
              <span>Restaurar</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2. Stepper Adaptativo (Mobile-first + Desktop) */}
      <Stepper
        value={currentStep}
        onValueChange={handleStepChange}
        className="space-y-4 sm:space-y-6"
      >
        {/* Vista Móvil (< sm): Barra de progreso de 4 segmentos interactiva */}
        <div className="block sm:hidden bg-card border border-border/70 rounded-2xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="size-2 rounded-full bg-primary inline-block animate-pulse shrink-0" />
              <span className="font-bold text-foreground truncate">
                Paso {currentStep} de 4:{" "}
                <span className="text-primary font-extrabold">
                  {currentStep === 4 && isEditing
                    ? "Actualización"
                    : WIZARD_STEPS[currentStep - 1]?.label}
                </span>
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-muted-foreground shrink-0 ml-2">
              {Math.round((currentStep / 4) * 100)}%
            </span>
          </div>

          {/* Segmented Touch Progress */}
          <div className="grid grid-cols-4 gap-1.5 h-2 rounded-full bg-muted/50 p-0.5">
            {WIZARD_STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= maxAccessibleStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!isAccessible}
                  onClick={() => handleStepChange(step.id)}
                  aria-label={`Ir al paso ${step.id}: ${step.label}`}
                  className={cn(
                    "h-full rounded-full transition-all duration-300 select-none",
                    isCurrent
                      ? "bg-primary shadow-xs"
                      : isCompleted
                      ? "bg-primary/60"
                      : "bg-muted-foreground/20",
                    isAccessible ? "cursor-pointer hover:opacity-80 active:scale-95" : "cursor-default"
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Vista Escritorio (sm+): StepperNav tradicional con círculos y títulos */}
        <div className="hidden sm:block py-2">
          <StepperNav className="flex items-center justify-between max-w-xl mx-auto px-4 gap-2">
            {WIZARD_STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              const isAccessible = step.id <= maxAccessibleStep;

              return (
                <StepperItem
                  key={step.id}
                  step={step.id}
                  completed={isCompleted}
                  disabled={!isAccessible}
                  className="flex-1 flex flex-col items-center"
                >
                  <StepperTrigger
                    className={cn(
                      "flex flex-col items-center gap-2 p-1.5 rounded-xl transition-all cursor-pointer select-none group w-full",
                      !isAccessible && "cursor-not-allowed opacity-45"
                    )}
                  >
                    {/* Circular Indicator */}
                    <StepperIndicator
                      className={cn(
                        "size-9 sm:size-10 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-2xs border-2 shrink-0",
                        isCurrent
                          ? "bg-foreground text-background border-foreground ring-4 ring-foreground/10"
                          : isCompleted
                          ? "bg-foreground text-background border-foreground"
                          : "bg-muted text-muted-foreground border-transparent"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-4 stroke-[3]" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </StepperIndicator>

                    {/* Step Title Underneath */}
                    <StepperTitle
                      className={cn(
                        "text-xs sm:text-sm text-center leading-tight transition-colors whitespace-nowrap",
                        isCurrent
                          ? "text-foreground font-bold"
                          : isCompleted
                          ? "text-foreground/90 font-semibold"
                          : "text-muted-foreground font-normal"
                      )}
                    >
                      {step.id === 4 && isEditing ? "Actualización" : step.label}
                    </StepperTitle>
                  </StepperTrigger>
                </StepperItem>
              );
            })}
          </StepperNav>
        </div>

        {/* 3. Main Form Card Container */}
        <Card className="p-4 sm:p-8 md:p-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="space-y-6"
          >
            <StepperPanel>
              {/* Step 1: Puesto y Datos Básicos */}
              <StepperContent value={1}>
                <Step1Basic form={form} />
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

              {/* Step 4: Contacto & Publicación / Actualización */}
              <StepperContent value={4}>
                <Step4Publication
                  form={form}
                  isEditing={isEditing}
                  onOpenPreviewDrawer={() => setShowPreviewDrawer(true)}
                />
              </StepperContent>
            </StepperPanel>

            {/* 4. Wizard Footer Action Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-5 sm:pt-6 border-t border-border">
              {/* Steps 1, 2, 3: Botón continuar full-width en mobile + botón volver abajo */}
              {currentStep < 4 ? (
                <>
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="font-bold text-sm gap-2 cursor-pointer w-full sm:w-auto order-1 sm:order-2 justify-center"
                  >
                    <span>Continuar al Paso {currentStep + 1}</span>
                    <ArrowRight className="size-4" />
                  </Button>

                  {currentStep > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={isSubmitting}
                      className="font-bold text-xs gap-2 cursor-pointer w-full sm:w-auto order-2 sm:order-1 justify-center"
                    >
                      <ArrowLeft className="size-4" />
                      <span>Paso Anterior</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      render={<Link href="/dashboard/company/vacancies" />}
                      className="font-semibold text-xs text-muted-foreground hover:text-foreground cursor-pointer w-full sm:w-auto order-2 sm:order-1 justify-center"
                    >
                      Cancelar
                    </Button>
                  )}
                </>
              ) : (
                /* Step 4: Botón Publicar full-width arriba + fila secundaria simétrica */
                <>
                  {/* Botón Principal (Publicar / Actualizar) */}
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleFinalSubmit(true)}
                    className="font-bold text-sm gap-2 cursor-pointer w-full sm:w-auto order-1 sm:order-2 justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>{isEditing ? "Actualizando..." : "Publicando..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        <span>{isEditing ? "Actualizar Vacante" : "Publicar Oferta Ahora"}</span>
                      </>
                    )}
                  </Button>

                  {/* Acciones Secundarias (Paso Anterior + Guardar Borrador) */}
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto order-2 sm:order-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      disabled={isSubmitting}
                      className="font-bold text-xs gap-1.5 cursor-pointer justify-center"
                    >
                      <ArrowLeft className="size-3.5" />
                      <span>Anterior</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => handleFinalSubmit(false)}
                      className="font-bold text-xs gap-1.5 cursor-pointer justify-center"
                    >
                      <Save className="size-3.5 text-muted-foreground" />
                      <span className="truncate">{isEditing ? "Guardar" : "Borrador"}</span>
                    </Button>
                  </div>
                </>
              )}
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
