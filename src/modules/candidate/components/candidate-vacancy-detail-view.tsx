"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Bookmark02Icon,
  Briefcase01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  Loading03Icon,
  Location01Icon,
  SentIcon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { cleanCityName, formatPaymentFrequencyLabel } from "@/lib/formatters";
import { applyToVacancyAction } from "@/modules/candidate/actions/applications";
import { toggleSavedVacancyAction } from "@/modules/candidate/actions/saved-vacancies";

export interface CompanyDetails {
  id?: string;
  company_name?: string | null;
  logo_url?: string | null;
  location?: string | null;
  industry?: string | null;
  description?: string | null;
  contact_phone?: string | null;
  website_url?: string | null;
  verification_status?: string | null;
}

export interface VacancyDetailData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  zone?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  payment_frequency?: string | null;
  contact_phone?: string | null;
  preferred_contact_method?: string | null;
  currency?: string | null;
  employment_type?: string | null;
  modality?: string | null;
  category?: string | null;
  skills?: string[] | null;
  benefits?: string[] | null;
  requirements?: string | null;
  is_featured?: boolean;
  is_promoted?: boolean;
  created_at?: string | null;
  company_id: string;
}

export interface CandidateReviewProfile {
  fullName: string | null;
  email: string | null;
  whatsappNumber: string | null;
  headline: string | null;
  bio: string | null;
}

export interface CandidateVacancyDetailViewProps {
  vacancy: VacancyDetailData;
  company: CompanyDetails | null;
  similarVacancies?: VacancyDetailData[];
  initialIsSaved?: boolean;
  initialApplication?: { id: string; status: string } | null;
  candidateLocation?: string | null;
  candidateProfile?: CandidateReviewProfile | null;
}

type FlowStep = "detail" | "review" | "sent";

function getCompanyInitials(companyName: string): string {
  const words = companyName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "KP";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function capitalizeLabel(value?: string | null): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function parseBulletLines(raw?: string | string[] | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => item.trim()).filter(Boolean);
  }
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      // Fall back to newline parsing
    }
  }
  return trimmed
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function formatSalaryRange(
  salaryMin?: number | null,
  salaryMax?: number | null
): string {
  const min = Number(salaryMin);
  const max = Number(salaryMax);
  if (min > 0 && max > 0) {
    return `$${min.toLocaleString("es-MX")} – $${max.toLocaleString("es-MX")} MXN`;
  }
  if (min > 0) return `Desde $${min.toLocaleString("es-MX")} MXN`;
  if (max > 0) return `Hasta $${max.toLocaleString("es-MX")} MXN`;
  return "Sueldo a convenir";
}

function formatFrequencySubtitle(frequency?: string | null): string {
  const normalized = (frequency || "").toLowerCase().trim();
  if (!normalized || normalized === "mensual" || normalized === "monthly") {
    return "Al mes";
  }
  return formatPaymentFrequencyLabel(frequency);
}

function VacancySummaryCard({
  initials,
  companyName,
  title,
  locationModality,
}: {
  initials: string;
  companyName: string;
  title: string;
  locationModality: string;
}) {
  return (
    <div className="flex min-h-[112px] w-full items-start gap-4 rounded-[16px] border border-border bg-background p-4">
      <div
        aria-hidden="true"
        className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-muted"
      >
        <span className="text-[12px] font-medium leading-[17px] text-primary">
          {initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 break-words">
        <p className="text-[14px] font-normal leading-[19px] text-foreground">
          {companyName}
        </p>
        <p className="text-[18px] font-semibold leading-[24px] text-foreground">
          {title}
        </p>
        <p className="pt-1 text-[12px] font-medium leading-[17px] text-muted-foreground">
          {locationModality}
        </p>
      </div>
    </div>
  );
}

export function CandidateVacancyDetailView({
  vacancy,
  company,
  initialIsSaved = false,
  initialApplication = null,
  candidateProfile = null,
}: CandidateVacancyDetailViewProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<FlowStep>("detail");
  const [isSaved, setIsSaved] = React.useState(initialIsSaved);
  const [application, setApplication] = React.useState<{
    id: string;
    status: string;
  } | null>(initialApplication);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [, startSaveTransition] = React.useTransition();

  const companyName = company?.company_name?.trim() || "Empresa";
  const initials = getCompanyInitials(companyName);
  const cleanCity = cleanCityName(vacancy.location || "");
  const displayLocation =
    vacancy.zone && cleanCity
      ? `${vacancy.zone}, ${cleanCity}`
      : vacancy.location || vacancy.zone || "Ubicación por confirmar";
  const modalityLabel = capitalizeLabel(vacancy.modality) || "Presencial";
  const conditionsLabel = [
    vacancy.employment_type || "Tiempo completo",
    modalityLabel,
  ]
    .filter(Boolean)
    .join(" · ");
  const locationModalityLabel = `${displayLocation} · ${modalityLabel}`;
  const formattedSalary = formatSalaryRange(
    vacancy.salary_min,
    vacancy.salary_max
  );
  const frequencyLabel = formatFrequencySubtitle(vacancy.payment_frequency);
  const requirementLines = React.useMemo(
    () => parseBulletLines(vacancy.requirements),
    [vacancy.requirements]
  );
  const benefitLines = React.useMemo(
    () => parseBulletLines(vacancy.benefits),
    [vacancy.benefits]
  );

  const runToggleSave = (nextExpectedSaved: boolean) => {
    setIsSaved(nextExpectedSaved);
    startSaveTransition(async () => {
      const result = await toggleSavedVacancyAction({ vacancyId: vacancy.id });
      if (!result.success) {
        setIsSaved(!nextExpectedSaved);
        toast.error("No se pudo actualizar", { description: result.error });
        return;
      }

      const savedNow = result.data.saved;
      setIsSaved(savedNow);
      toast.success(
        savedNow ? "Vacante guardada" : "Vacante quitada de guardados",
        {
          action: {
            label: "Deshacer",
            onClick: () => runToggleSave(!savedNow),
          },
        }
      );
    });
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vacancy.title} · ${companyName}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled native share sheet; stay on detail
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo compartir el enlace");
    }
  };

  const handleSubmitApplication = async () => {
    if (isSubmitting || application) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await applyToVacancyAction({ vacancyId: vacancy.id });
      if (!result.success) {
        setSubmitError(
          result.error ||
            "No pudimos enviar tu postulación. Tus datos siguen aquí. Inténtalo de nuevo."
        );
        return;
      }
      setApplication({
        id: result.data.applicationId ?? vacancy.id,
        status: "Por revisar",
      });
      setStep("sent");
    } catch {
      setSubmitError(
        "No pudimos enviar tu postulación. Tus datos siguen aquí. Inténtalo de nuevo."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==================== PANTALLA 4: POSTULACIÓN ENVIADA (Figma 241:1245) ==================== */
  if (step === "sent") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[540px] flex-col justify-between pb-6 md:min-h-0">
        <div>
          <header className="flex items-center justify-end">
            <Link
              href="/dashboard/candidate"
              aria-label="Volver a Inicio"
              className="-mr-2 inline-flex size-[48px] items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </Link>
          </header>

          <div className="mt-8 flex flex-col items-center text-center">
            <div
              aria-hidden="true"
              className="flex size-[96px] items-center justify-center rounded-full bg-muted text-primary"
            >
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={48}
                strokeWidth={1.75}
              />
            </div>

            <h1 className="mt-8 text-[28px] font-bold leading-[39px] text-foreground">
              ¡Postulación enviada!
            </h1>
            <p className="mt-4 max-w-[354px] text-[16px] font-normal leading-[22px] text-muted-foreground">
              Tu perfil está en el proceso de selección de {companyName}.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-6">
            <VacancySummaryCard
              initials={initials}
              companyName={companyName}
              title={vacancy.title}
              locationModality={locationModalityLabel}
            />

            <section
              aria-label="Estado inicial de la postulación"
              className="flex min-h-[104px] w-full items-start gap-4 rounded-[16px] border border-border bg-background p-4"
            >
              <HugeiconsIcon
                icon={File01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="text-[16px] font-normal leading-[22px] text-primary">
                  Por revisar · Etapa 1 de 4
                </p>
                <div className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                  <p>La empresa revisará tu información.</p>
                  <p>Sigue las novedades en Postulaciones.</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="sticky bottom-0 mt-8 bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
          <Link
            href="/dashboard/candidate/applications"
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-4 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={File01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Ver postulaciones</span>
          </Link>
        </div>
      </div>
    );
  }

  /* ==================== PANTALLAS 2 y 3: REVISA TU POSTULACIÓN / ENVIANDO (Figma 241:1211 y 242:1243) ==================== */
  if (step === "review") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[540px] flex-col justify-between pb-6 md:min-h-0">
        <div>
          <header className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setStep("detail")}
                aria-label="Volver a la vacante"
                className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
              <h1 className="truncate text-[20px] font-semibold leading-[28px] text-foreground">
                Revisa tu postulación
              </h1>
            </div>

            <Popover>
              <PopoverTrigger
                type="button"
                aria-label="Información sobre datos compartidos"
                className="-mr-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  size={24}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                className="w-[300px] rounded-[16px] border border-border bg-background p-4 text-[14px] leading-[19px] text-foreground shadow-lg"
              >
                <p className="font-semibold text-foreground">Datos compartidos</p>
                <p className="mt-1 text-muted-foreground">
                  Al postularte, {companyName} recibirá tu currículum y tus datos
                  de contacto únicamente para evaluar tu candidatura.
                </p>
              </PopoverContent>
            </Popover>
          </header>

          <div className="mt-6 flex flex-col gap-6">
            <VacancySummaryCard
              initials={initials}
              companyName={companyName}
              title={vacancy.title}
              locationModality={locationModalityLabel}
            />

            {/* Card Mi currículum */}
            <section
              aria-label="Resumen de tu currículum"
              className="flex w-full flex-col gap-2 rounded-[16px] border border-border bg-background p-4"
            >
              <div className="flex items-center gap-4">
                <HugeiconsIcon
                  icon={File01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground"
                />
                <h2 className="text-[16px] font-normal leading-[22px] text-foreground">
                  Mi currículum
                </h2>
              </div>
              <p className="text-[16px] font-normal leading-[22px] text-foreground">
                {candidateProfile?.headline?.trim() || "Perfil profesional"}
              </p>
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                {candidateProfile?.bio?.trim() ||
                  "Tu perfil profesional se compartirá con la empresa para este proceso."}
              </p>
            </section>

            {/* Card Datos de contacto */}
            <section
              aria-label="Tus datos de contacto"
              className="flex w-full flex-col gap-2 rounded-[16px] border border-border bg-background p-4"
            >
              <h2 className="text-[16px] font-normal leading-[22px] text-foreground">
                Datos de contacto
              </h2>
              <p className="text-[14px] font-normal leading-[19px] text-foreground">
                {candidateProfile?.fullName?.trim() || "Candidato"}
              </p>
              {candidateProfile?.email && (
                <p className="break-all text-[14px] font-normal leading-[19px] text-muted-foreground">
                  {candidateProfile.email}
                </p>
              )}
              {candidateProfile?.whatsappNumber && (
                <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                  {candidateProfile.whatsappNumber}
                </p>
              )}
            </section>

            <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
              Revisa que tu información esté actualizada antes de continuar.
            </p>

            <p className="text-[14px] font-normal leading-[19px] text-foreground">
              Al enviar, {companyName} podrá consultar tu perfil profesional y tus
              datos de contacto para este proceso.
            </p>

            {submitError && (
              <p
                role="alert"
                className="text-[14px] font-normal leading-[19px] text-destructive"
              >
                {submitError}
              </p>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 mt-8 bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
          <button
            type="button"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            onClick={handleSubmitApplication}
            className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-4 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSubmitting ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="animate-spin"
                />
                <span>Enviando…</span>
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>
                  {submitError ? "Reintentar envío" : "Enviar postulación"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ==================== PANTALLA 1: DETALLE DE VACANTE (Figma 241:1156) ==================== */
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[680px] flex-col justify-between pb-6 md:min-h-0">
      <div>
        {/* Header móvil / detalle */}
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Volver a Inicio"
              className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
            <span className="truncate text-[20px] font-semibold leading-[28px] text-foreground">
              Vacante
            </span>
          </div>

          <div className="-mr-2 flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => runToggleSave(!isSaved)}
              aria-pressed={isSaved}
              aria-label={
                isSaved
                  ? `Quitar ${vacancy.title} de guardados`
                  : `Guardar vacante ${vacancy.title}`
              }
              className={cn(
                "inline-flex size-[48px] cursor-pointer items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSaved
                  ? "bg-muted text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <HugeiconsIcon
                icon={Bookmark02Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className={cn(isSaved && "fill-current")}
              />
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label={`Compartir vacante ${vacancy.title}`}
              className="inline-flex size-[48px] cursor-pointer items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={Share08Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        {/* Contenido principal */}
        <article className="mt-6 flex flex-col gap-6">
          {/* Resumen de empresa, título y sueldo */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex size-[48px] shrink-0 items-center justify-center rounded-[8px] bg-muted"
              >
                <span className="text-[14px] font-semibold text-primary">
                  {initials}
                </span>
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="truncate text-[16px] font-normal leading-[22px] text-foreground">
                  {companyName}
                </p>
                <p className="text-[12px] font-medium leading-[17px] text-primary">
                  {application ? "Ya te postulaste" : "Vacante activa"}
                </p>
              </div>
            </div>

            <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
              {vacancy.title}
            </h1>

            <div className="flex flex-col gap-2">
              <p className="text-[20px] font-semibold leading-normal text-foreground">
                {formattedSalary}
              </p>
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                {frequencyLabel}
              </p>
            </div>
          </div>

          {/* Condiciones */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <HugeiconsIcon
                icon={Location01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                {displayLocation}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <HugeiconsIcon
                icon={Briefcase01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                {conditionsLabel}
              </p>
            </div>
          </div>

          {/* Acerca del puesto */}
          <section className="flex flex-col gap-2">
            <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
              Acerca del puesto
            </h2>
            <p className="whitespace-pre-line text-[14px] font-normal leading-[19px] text-foreground">
              {vacancy.description?.trim() ||
                "Consulta los detalles del puesto con la empresa al postularte."}
            </p>
          </section>

          {/* Requisitos */}
          {requirementLines.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
                Requisitos
              </h2>
              <ul className="flex flex-col gap-1 text-[14px] font-normal leading-[19px] text-foreground">
                {requirementLines.map((line, idx) => (
                  <li key={`${vacancy.id}-req-${idx}`}>• {line}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Beneficios */}
          {benefitLines.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
                Beneficios
              </h2>
              <ul className="flex flex-col gap-1 text-[14px] font-normal leading-[19px] text-foreground">
                {benefitLines.map((line, idx) => (
                  <li key={`${vacancy.id}-ben-${idx}`}>• {line}</li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>

      {/* Acción principal única al alcance del pulgar */}
      <div className="sticky bottom-0 mt-8 bg-background pt-4 pb-[env(safe-area-inset-bottom,0px)]">
        {application ? (
          <Link
            href="/dashboard/candidate/applications"
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-4 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={File01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Ver postulaciones</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setStep("review")}
            className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-4 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={SentIcon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Aplicar</span>
          </button>
        )}
      </div>
    </div>
  );
}
