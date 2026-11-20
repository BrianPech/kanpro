"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Check,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
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
import {
  createVacancyAction,
  updateVacancyAction,
} from "../../actions/vacancies";
import type { VacancyWizardCompanyPrefill } from "../../services/company-vacancies";
import {
  formatSalaryDisplay,
  formatDateToDisplay,
  getMexicoDateISO,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import Link from "next/link";

const DRAFT_STORAGE_KEY = "kanpro_vacancy_draft_v2";

export const WIZARD_STEPS = [
  { id: 1, label: "Puesto" },
  { id: 2, label: "Condiciones" },
  { id: 3, label: "Requisitos" },
  { id: 4, label: "Publicación" },
] as const;

const FREQUENCY_DISPLAY: Record<string, string> = {
  semanal: "por semana",
  quincenal: "por quincena",
  mensual: "por mes",
};

const CONTACT_DISPLAY: Record<string, string> = {
  whatsapp: "WhatsApp",
  platform: "Bandeja Kanpro",
  both: "WhatsApp y bandeja Kanpro",
};

interface VacancyWizardContainerProps {
  userId: string;
  initialValues?: Partial<VacancyWizardValues>;
  companyPrefill?: VacancyWizardCompanyPrefill | null;
  isEditing?: boolean;
  vacancyId?: string;
}

function buildWizardDefaultValues(
  initialValues: Partial<VacancyWizardValues> | undefined,
  companyPrefill: VacancyWizardCompanyPrefill | null | undefined,
  isEditing: boolean
): VacancyWizardValues {
  const base: VacancyWizardValues = {
    ...DEFAULT_WIZARD_VALUES,
    ...initialValues,
  };

  if (companyPrefill?.contact_phone && !base.contact_phone) {
    base.contact_phone = companyPrefill.contact_phone;
  }

  if (!isEditing && companyPrefill) {
    const currentLoc = base.location || "";
    const isStreetAddress =
      /^(calle|av\.|avenida|carretera|carr\.|diag\.|diagonal|sm\b|mz\b|lote|c\.)/i.test(
        currentLoc
      );
    if (
      !currentLoc ||
      currentLoc === "Mérida, Yucatán" ||
      currentLoc === "Mérida" ||
      isStreetAddress
    ) {
      base.location = companyPrefill.resolvedLocation;
      base.zone = companyPrefill.resolvedZone;
    }
  }

  return base;
}

export function VacancyWizardContainer({
  initialValues,
  companyPrefill = null,
  isEditing = false,
  vacancyId,
}: VacancyWizardContainerProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<number>(1);
  const [maxAccessibleStep, setMaxAccessibleStep] = React.useState<number>(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [showPreviewDrawer, setShowPreviewDrawer] = React.useState(false);
  const companyProfile = companyPrefill;
  const [draftDismissed, setDraftDismissed] = React.useState(false);
  const [initialDraftRaw, setInitialDraftRaw] = React.useState<string | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = React.useState(false);
  const draftTimerRef = React.useRef<number | null>(null);
  const lastSavedSnapshotRef = React.useRef<string | null>(null);

  const resolvedDefaultValues = React.useMemo(
    () => buildWizardDefaultValues(initialValues, companyPrefill, isEditing),
    [initialValues, companyPrefill, isEditing]
  );

  // Read any prior draft strictly once on mount so live auto-saves in this session never trigger the banner.
  React.useEffect(() => {
    if (isEditing) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        setInitialDraftRaw(localStorage.getItem(DRAFT_STORAGE_KEY));
      } catch {
        setInitialDraftRaw(null);
      } finally {
        lastSavedSnapshotRef.current = JSON.stringify(resolvedDefaultValues);
        setIsDraftHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isEditing, resolvedDefaultValues]);

  const savedDraft = React.useMemo<VacancyWizardValues | null>(() => {
    if (isEditing || draftDismissed || !initialDraftRaw) return null;
    try {
      const parsed = JSON.parse(initialDraftRaw);
      if (
        parsed &&
        typeof parsed === "object" &&
        (parsed.title?.trim() || parsed.description?.trim())
      ) {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  }, [isEditing, draftDismissed, initialDraftRaw]);

  // React Hook Form Instance
  const form = useForm<VacancyWizardValues>({
    defaultValues: resolvedDefaultValues,
  });

  const formValues = useWatch({ control: form.control }) as VacancyWizardValues;

  const cancelPendingDraftSave = React.useCallback(() => {
    if (draftTimerRef.current !== null) {
      window.clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
  }, []);

  const persistDraftNow = React.useCallback(
    (values: VacancyWizardValues) => {
      if (isEditing) return;
      cancelPendingDraftSave();
      try {
        if (values.title?.trim() || values.description?.trim()) {
          const serialized = JSON.stringify(values);
          localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
          lastSavedSnapshotRef.current = serialized;
        }
      } catch (e) {
        console.warn("Draft save failed:", e);
      }
    },
    [isEditing, cancelPendingDraftSave]
  );

  // Trigger debounced auto-save only after initial draft hydration completes and values change
  React.useEffect(() => {
    if (isEditing || !isDraftHydrated) return;

    const serialized = JSON.stringify(formValues);
    if (serialized === lastSavedSnapshotRef.current) return;

    cancelPendingDraftSave();
    draftTimerRef.current = window.setTimeout(() => {
      draftTimerRef.current = null;
      persistDraftNow(formValues);
    }, 500);

    return () => {
      cancelPendingDraftSave();
    };
  }, [
    isEditing,
    isDraftHydrated,
    formValues,
    cancelPendingDraftSave,
    persistDraftNow,
  ]);

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
      cancelPendingDraftSave();
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      lastSavedSnapshotRef.current = JSON.stringify(resolvedDefaultValues);
      form.reset(resolvedDefaultValues);
      setCurrentStep(1);
      setMaxAccessibleStep(1);
      setDraftDismissed(true);
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
    setSubmitError(null);
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
      cancelPendingDraftSave();
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
          : "Tus datos se conservaron. Reintenta o guarda un borrador.";
      setSubmitError(message);
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
      created_at: getMexicoDateISO(),
      applicants_count: 0,
    };
  }, [formValues, vacancyId]);

  const shiftShort = (formValues.shift_schedule || "")
    .replace(/\s*\([^)]*\)/g, "")
    .trim();

  const summarySalary = React.useMemo(() => {
    const min = formValues.salary_min;
    const max = formValues.salary_max;
    const freq =
      FREQUENCY_DISPLAY[formValues.payment_frequency || "quincenal"] ||
      "por quincena";
    if (min != null && max != null) {
      return `${formatSalaryDisplay(min)} – ${formatSalaryDisplay(max)} MXN ${freq}`;
    }
    if (min != null) {
      return `Desde ${formatSalaryDisplay(min)} MXN ${freq}`;
    }
    if (max != null) {
      return `Hasta ${formatSalaryDisplay(max)} MXN ${freq}`;
    }
    return "A convenir";
  }, [
    formValues.salary_min,
    formValues.salary_max,
    formValues.payment_frequency,
  ]);

  const summaryLocation = React.useMemo(() => {
    const parts = [formValues.zone, formValues.location].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Por definir";
  }, [formValues.zone, formValues.location]);

  const summaryBenefits = React.useMemo(() => {
    const list = Array.isArray(formValues.benefits) ? formValues.benefits : [];
    if (list.length === 0) return null;
    const normalized = list.map((b) =>
      b.startsWith("Prestaciones de Ley") ? "Prestaciones de ley" : b
    );
    if (normalized.length === 1) return normalized[0];
    if (normalized.length === 2) {
      return `${normalized[0]} y ${normalized[1].toLowerCase()}`;
    }
    return `${normalized.slice(0, 2).join(", ")} y ${normalized.length - 2} más`;
  }, [formValues.benefits]);

  const summarySkills = React.useMemo(() => {
    const list = Array.isArray(formValues.skills) ? formValues.skills : [];
    if (list.length === 0) return null;
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} y ${list[1].toLowerCase()}`;
    return `${list.slice(0, 2).join(", ")} y ${list.length - 2} más`;
  }, [formValues.skills]);

  return (
    <div className="w-full flex flex-col gap-[20px] pb-12 font-sans">
      {/* 1. Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-[6px]">
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
            {isEditing ? "Editar vacante" : "Nueva vacante"}
          </h1>
          <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
            Paso {currentStep} de 4 · {WIZARD_STEPS[currentStep - 1]?.label}
          </p>
        </div>

        {!isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearDraft}
            className="text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Limpiar borrador</span>
          </Button>
        )}
      </div>

      {/* Draft Recovery Alert */}
      {savedDraft && !isEditing && (
        <div className="p-3.5 bg-sidebar-accent/50 border border-border rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[13px]">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-semibold text-foreground truncate">
              Borrador previo: &ldquo;{savedDraft.title || "Sin título"}&rdquo;
            </span>
            <span className="text-[12px] text-muted-foreground">
              ¿Deseas recuperar los datos de tu sesión previa o empezar de cero?
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                cancelPendingDraftSave();
                try {
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                } catch {}
                setDraftDismissed(true);
              }}
              className="h-[34px] rounded-[8px] border-control-border bg-card text-[13px] font-medium cursor-pointer"
            >
              Descartar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const restored = {
                  ...resolvedDefaultValues,
                  ...savedDraft,
                };
                cancelPendingDraftSave();
                lastSavedSnapshotRef.current = JSON.stringify(restored);
                form.reset(restored);
                setDraftDismissed(true);
                toast.success("Borrador restaurado");
              }}
              className="h-[34px] rounded-[8px] bg-primary text-primary-foreground text-[13px] font-medium cursor-pointer"
            >
              Restaurar
            </Button>
          </div>
        </div>
      )}

      {/* 2. Stepper Pills */}
      <div className="flex items-center gap-[8px] flex-wrap">
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
              className={cn(
                "h-[34px] px-[12px] rounded-[8px] text-[13px] font-medium leading-[18px] inline-flex items-center gap-[6px] transition-colors",
                isCurrent
                  ? "bg-sidebar-accent text-link font-semibold"
                  : isCompleted
                  ? "bg-muted text-foreground hover:bg-muted/80 cursor-pointer"
                  : "bg-muted text-muted-foreground",
                !isAccessible && !isCurrent && "cursor-default"
              )}
            >
              {isCompleted ? (
                <Check className="size-[13px] stroke-[2.5]" />
              ) : (
                <span>{step.id}</span>
              )}
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[20px] items-start">
        {/* Left: Form Card */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="bg-card border border-border rounded-[16px] p-[24px] flex flex-col gap-[20px]"
        >
          {currentStep === 1 && (
            <Step1Basic form={form} onApplyPreset={persistDraftNow} />
          )}
          {currentStep === 2 && (
            <Step2Compensation
              form={form}
              companyLocation={
                companyProfile?.resolvedLocation || "Mérida, Yucatán"
              }
              companyCity={companyProfile?.resolvedCity || "Mérida"}
              companyZone={companyProfile?.resolvedZone || "Centro Mérida"}
              companyName={companyProfile?.company_name || "Tu Empresa"}
            />
          )}
          {currentStep === 3 && <Step3Description form={form} />}
          {currentStep === 4 && (
            <Step4Publication
              form={form}
              isEditing={isEditing}
              onOpenPreviewDrawer={() => setShowPreviewDrawer(true)}
            />
          )}

          {/* Step 4 Status / Error Banners */}
          {currentStep === 4 && isSubmitting && (
            <div className="bg-[#e8f2fb] text-[#184c78] dark:bg-[#193044] dark:text-[#abd6f5] rounded-[12px] p-[14px] flex flex-col gap-[2px]">
              <span className="text-[14px] font-semibold leading-[20px]">
                {isEditing
                  ? "Actualizando tu vacante..."
                  : "Publicando tu vacante..."}
              </span>
              <span className="text-[13px] leading-[18px] opacity-90">
                Estamos guardando el anuncio. Esta acción solo se envía una vez.
              </span>
            </div>
          )}

          {currentStep === 4 && submitError && !isSubmitting && (
            <div className="bg-[#fcebe9] text-[#a6302a] dark:bg-[#3e2220] dark:text-[#f29b94] rounded-[12px] p-[14px] flex flex-col gap-[2px]">
              <span className="text-[14px] font-semibold leading-[20px]">
                No se pudo publicar la vacante
              </span>
              <span className="text-[13px] leading-[18px] opacity-90">
                Tus datos se conservaron. Reintenta o guarda un borrador.
              </span>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="pt-[16px] border-t border-border flex flex-wrap items-center justify-between gap-[12px]">
            {currentStep === 1 ? (
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={<Link href="/dashboard/company/vacancies" />}
                className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-semibold hover:bg-muted/60 cursor-pointer"
              >
                Cancelar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-semibold hover:bg-muted/60 gap-[8px] cursor-pointer"
              >
                <ArrowLeft className="size-[16px]" />
                <span>Anterior</span>
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="h-[44px] px-[18px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 gap-[8px] cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight className="size-[16px]" />
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-[8px]">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSubmit(false)}
                  className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-semibold hover:bg-muted/60 cursor-pointer"
                >
                  Guardar borrador
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSubmit(true)}
                  className="h-[44px] min-w-[146px] px-[18px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold hover:bg-primary/90 cursor-pointer"
                >
                  {isSubmitting
                    ? "Publicando..."
                    : submitError
                    ? "Reintentar"
                    : isEditing
                    ? "Actualizar vacante"
                    : "Publicar vacante"}
                </Button>
              </div>
            )}
          </div>
        </form>

        {/* Right: Live Summary / Preview Card */}
        <aside className="bg-card border border-border rounded-[16px] p-[20px] flex flex-col gap-[16px] lg:sticky lg:top-6">
          <div className="pb-[12px] border-b border-border">
            <h3 className="text-[18px] font-semibold leading-[24px] text-foreground">
              {currentStep === 4
                ? "Vista previa del anuncio"
                : "Resumen de la vacante"}
            </h3>
          </div>

          <div className="flex flex-col gap-[4px]">
            <p className="text-[20px] font-semibold leading-[26px] text-foreground break-words">
              {formValues.title?.trim() || "Nombre del puesto"}
            </p>
            <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
              {companyProfile?.company_name || "Tu Empresa"}
            </p>
          </div>

          <div className="flex flex-col gap-[12px]">
            <div className="flex flex-col gap-[2px]">
              <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                Jornada
              </span>
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                {formValues.employment_type || "Tiempo Completo"}
                {shiftShort ? ` · ${shiftShort}` : ""}
              </span>
            </div>

            <div className="flex flex-col gap-[2px]">
              <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                Plazas disponibles
              </span>
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                {formValues.positions_available || 1}{" "}
                {(formValues.positions_available || 1) === 1
                  ? "plaza"
                  : "plazas"}
              </span>
            </div>

            {currentStep >= 2 && (
              <>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                    Ubicación
                  </span>
                  <span className="text-[14px] font-medium leading-[20px] text-foreground">
                    {summaryLocation}
                  </span>
                </div>

                <div className="flex flex-col gap-[2px]">
                  <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                    Sueldo
                  </span>
                  <span className="text-[14px] font-medium leading-[20px] text-foreground">
                    {summarySalary}
                  </span>
                </div>
              </>
            )}

            {currentStep >= 3 && formValues.description?.trim() && (
              <div className="flex flex-col gap-[2px]">
                <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  Descripción
                </span>
                <span className="text-[14px] font-normal leading-[20px] text-foreground line-clamp-4">
                  {formValues.description.replace(/<[^>]+>/g, " ").trim()}
                </span>
              </div>
            )}

            {currentStep === 4 && (
              <>
                {summaryBenefits && (
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                      Prestaciones
                    </span>
                    <span className="text-[14px] font-medium leading-[20px] text-foreground">
                      {summaryBenefits}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-[2px]">
                  <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                    Perfil
                  </span>
                  <span className="text-[14px] font-medium leading-[20px] text-foreground">
                    {formValues.experience_required || "Sin experiencia previa"}{" "}
                    · {formValues.education_level || "Indistinto"}
                  </span>
                </div>

                {summarySkills && (
                  <div className="flex flex-col gap-[2px]">
                    <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                      Habilidades
                    </span>
                    <span className="text-[14px] font-medium leading-[20px] text-foreground">
                      {summarySkills}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-[2px]">
                  <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                    Postulación
                  </span>
                  <span className="text-[14px] font-medium leading-[20px] text-foreground">
                    {CONTACT_DISPLAY[
                      formValues.preferred_contact_method || "both"
                    ] || "WhatsApp y bandeja Kanpro"}
                  </span>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Vacancy Preview Drawer */}
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
