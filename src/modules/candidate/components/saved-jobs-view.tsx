"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowLeft01Icon,
  Bookmark02Icon,
  Location01Icon,
  RefreshIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { cleanCityName } from "@/lib/formatters";
import { toggleSavedVacancyAction } from "../actions/saved-vacancies";

export interface SavedVacancy {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  location: string;
  employmentType: string;
  modality: string;
  formattedSalary: string;
  paymentFrequency?: string | null;
  isPromoted: boolean;
}

interface SavedJobsViewProps {
  onBack?: () => void;
}

interface RawSavedVacancyRow {
  id: string;
  vacancy_id: string;
  created_at: string;
  vacancy: {
    id: string;
    title: string;
    location: string | null;
    zone: string | null;
    modality: string | null;
    employment_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
    payment_frequency: string | null;
    is_featured: boolean | null;
    is_promoted: boolean | null;
    company_id: string;
  } | null;
}

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

function formatSalaryWithPeriod(
  minRaw?: number | null,
  maxRaw?: number | null,
  frequency?: string | null
): string {
  const min = Number(minRaw);
  const max = Number(maxRaw);
  const normalizedFreq = (frequency || "").toLowerCase().trim();
  const suffix =
    !normalizedFreq || normalizedFreq === "mensual" || normalizedFreq === "monthly"
      ? " / mes"
      : normalizedFreq === "quincenal"
        ? " / quincena"
        : normalizedFreq === "semanal"
          ? " / semana"
          : "";

  if (min > 0 && max > 0) {
    return `$${min.toLocaleString("es-MX")} – $${max.toLocaleString("es-MX")} MXN${suffix}`;
  }
  if (min > 0) return `Desde $${min.toLocaleString("es-MX")} MXN${suffix}`;
  if (max > 0) return `Hasta $${max.toLocaleString("es-MX")} MXN${suffix}`;
  return "Sueldo a convenir";
}

function SkeletonVacancyCard() {
  return (
    <div
      aria-hidden="true"
      className="flex min-h-[184px] w-full flex-col gap-4 rounded-[16px] border border-border bg-background p-4"
    >
      <div className="flex items-start gap-4">
        <Skeleton className="size-[40px] shrink-0 rounded-[8px]" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-[16px] w-[160px] rounded-[8px]" />
          <Skeleton className="h-[16px] w-[200px] rounded-[8px]" />
        </div>
      </div>
      <Skeleton className="h-[16px] w-[248px] max-w-full rounded-[8px]" />
      <Skeleton className="h-[16px] w-[224px] max-w-full rounded-[8px]" />
      <Skeleton className="h-[12px] w-[192px] max-w-full rounded-[8px]" />
    </div>
  );
}

function SavedVacancyCard({
  vacancy,
  onRemove,
}: {
  vacancy: SavedVacancy;
  onRemove: (vacancy: SavedVacancy) => void;
}) {
  const initials = getCompanyInitials(vacancy.companyName);
  const conditions = [
    vacancy.employmentType || "Tiempo completo",
    capitalizeLabel(vacancy.modality) || "Presencial",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="relative flex min-h-[184px] w-full flex-col justify-between rounded-[16px] border border-border bg-background p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-4 pr-11">
        <div
          aria-hidden="true"
          className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-muted"
        >
          <span className="text-[12px] font-medium leading-[17px] text-primary">
            {initials}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate text-[14px] font-normal leading-[19px] text-foreground">
            {vacancy.companyName}
          </p>
          <h2 className="line-clamp-2 text-[18px] font-semibold leading-[24px] text-foreground">
            <Link
              href={`/dashboard/candidate/vacancies/${vacancy.id}`}
              className="rounded-[4px] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {vacancy.title}
            </Link>
          </h2>
        </div>
      </div>

      {/* Botón independiente Quitar de Guardadas (48 × 48 px, no dispara navegación) */}
      <button
        type="button"
        onClick={() => onRemove(vacancy)}
        aria-pressed={true}
        aria-label={`Quitar ${vacancy.title} de guardadas`}
        className="absolute right-1.5 top-1.5 inline-flex size-[48px] cursor-pointer items-center justify-center rounded-[8px] text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <HugeiconsIcon
          icon={Bookmark02Icon}
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className="fill-current"
        />
      </button>

      <div className="mt-4 flex flex-col">
        <div className="flex min-h-[20px] items-center gap-4">
          <HugeiconsIcon
            icon={Location01Icon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground"
          />
          <p className="truncate text-[14px] font-normal leading-[19px] text-muted-foreground">
            {vacancy.location}
          </p>
        </div>

        <p className="mt-3 text-[16px] font-semibold leading-normal text-foreground">
          {vacancy.formattedSalary}
        </p>

        <p className="mt-1 truncate text-[12px] font-medium leading-[17px] text-muted-foreground">
          {conditions}
        </p>
      </div>
    </article>
  );
}

export function SavedJobsView({ onBack }: SavedJobsViewProps) {
  const router = useRouter();
  const [savedVacancies, setSavedVacancies] = React.useState<SavedVacancy[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [hasError, setHasError] = React.useState<boolean>(false);
  const [, startTransition] = React.useTransition();

  const loadSavedVacancies = React.useCallback(async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSavedVacancies([]);
        setIsLoading(false);
        return;
      }

      const { data: savedRowsRaw, error: savedError } = await supabase
        .from("saved_vacancies")
        .select(
          `
          id,
          vacancy_id,
          created_at,
          vacancy:vacancies (
            id,
            title,
            location,
            zone,
            modality,
            employment_type,
            salary_min,
            salary_max,
            payment_frequency,
            is_featured,
            is_promoted,
            company_id
          )
        `
        )
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false });

      if (savedError) {
        console.error("Error fetching saved_vacancies:", savedError);
        setHasError(true);
        setIsLoading(false);
        return;
      }

      const savedRows = (savedRowsRaw ?? []) as unknown as RawSavedVacancyRow[];
      const validSaved = savedRows.filter(
        (row): row is RawSavedVacancyRow & { vacancy: NonNullable<RawSavedVacancyRow["vacancy"]> } =>
          row.vacancy !== null
      );

      const companyIds = Array.from(
        new Set(validSaved.map((row) => row.vacancy.company_id).filter(Boolean))
      );

      const companies: Record<
        string,
        { company_name: string; logo_url: string | null }
      > = {};

      if (companyIds.length > 0) {
        const { data: compDirectoryRows } = await supabase
          .from("company_directory")
          .select("id, company_name, logo_url")
          .in("id", companyIds);

        if (compDirectoryRows) {
          for (const c of compDirectoryRows) {
            if (!c.id) continue;
            companies[c.id] = {
              company_name: c.company_name || "Empresa",
              logo_url: c.logo_url || null,
            };
          }
        }
      }

      const formattedList: SavedVacancy[] = validSaved.map((row) => {
        const vac = row.vacancy;
        const comp = companies[vac.company_id];
        const cleanCity = cleanCityName(vac.location || "");
        const displayLoc =
          vac.zone && cleanCity
            ? `${vac.zone}, ${cleanCity}`
            : vac.location || vac.zone || "Ubicación por confirmar";

        return {
          id: vac.id,
          title: vac.title,
          companyName: comp?.company_name || "Empresa",
          companyLogo: comp?.logo_url || null,
          location: displayLoc,
          employmentType: vac.employment_type || "Tiempo completo",
          modality: vac.modality || "Presencial",
          formattedSalary: formatSalaryWithPeriod(
            vac.salary_min,
            vac.salary_max,
            vac.payment_frequency
          ),
          paymentFrequency: vac.payment_frequency,
          isPromoted: Boolean(vac.is_promoted || vac.is_featured),
        };
      });

      setSavedVacancies(formattedList);
    } catch (err) {
      console.error("Error loading saved vacancies:", err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await loadSavedVacancies();
    })();
    return () => {
      active = false;
    };
  }, [loadSavedVacancies]);

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    void loadSavedVacancies();
  };

  const restoreVacancyAt = (vacancy: SavedVacancy, originalIndex: number) => {
    setSavedVacancies((prev) => {
      if (prev.some((v) => v.id === vacancy.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(originalIndex, next.length), 0, vacancy);
      return next;
    });
  };

  const handleRemoveVacancy = (vacancy: SavedVacancy) => {
    const originalIndex = savedVacancies.findIndex((v) => v.id === vacancy.id);
    if (originalIndex === -1) return;

    setSavedVacancies((prev) => prev.filter((v) => v.id !== vacancy.id));

    startTransition(async () => {
      const result = await toggleSavedVacancyAction({ vacancyId: vacancy.id });
      if (!result.success) {
        restoreVacancyAt(vacancy, originalIndex);
        toast.error("No se pudo quitar la vacante", {
          description: result.error,
        });
        return;
      }

      toast("Vacante quitada", {
        duration: 6000,
        action: {
          label: "Deshacer",
          onClick: () => {
            restoreVacancyAt(vacancy, originalIndex);
            startTransition(async () => {
              const undoResult = await toggleSavedVacancyAction({
                vacancyId: vacancy.id,
              });
              if (!undoResult.success) {
                setSavedVacancies((prev) =>
                  prev.filter((v) => v.id !== vacancy.id)
                );
                toast.error("No se pudo restaurar la vacante");
              }
            });
          },
        },
      });
    });
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.push("/dashboard/candidate");
  };

  const countLabel = `${savedVacancies.length} ${
    savedVacancies.length === 1 ? "vacante guardada" : "vacantes guardadas"
  }`;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[960px] flex-col gap-6 pb-8 md:min-h-0">
      {/* Encabezado volver a Inicio (móvil, Figma 326:2187) */}
      <div className="flex h-[48px] items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Volver a Inicio"
          className="-ml-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={24}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
        <span className="text-[14px] font-normal leading-[19px] text-foreground">
          Inicio
        </span>
      </div>

      {/* Presentación */}
      <header className="flex flex-col gap-2">
        <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
          Vacantes guardadas
        </h1>
        <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
          Tus oportunidades favoritas, listas para revisar.
        </p>
      </header>

      {/* Estado 1: Cargando (Figma 326:2325) */}
      {isLoading && (
        <div
          aria-busy="true"
          className="flex flex-1 flex-col gap-4"
        >
          <p
            role="status"
            className="text-[14px] font-normal leading-[19px] text-muted-foreground"
          >
            Cargando tus vacantes…
          </p>
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            <SkeletonVacancyCard />
            <SkeletonVacancyCard />
            <SkeletonVacancyCard />
          </div>
        </div>
      )}

      {/* Estado 2: Error de carga sin datos (Figma 326:2364) */}
      {!isLoading && hasError && savedVacancies.length === 0 && (
        <div className="flex flex-1 flex-col justify-between gap-6">
          <div
            role="alert"
            className="mx-auto flex flex-1 max-w-[354px] flex-col items-center justify-center gap-6 py-8"
          >
            <div
              aria-hidden="true"
              className="flex size-[80px] items-center justify-center rounded-[16px] bg-muted text-foreground"
            >
              <HugeiconsIcon
                icon={AlertCircleIcon}
                size={40}
                strokeWidth={1.75}
              />
            </div>

            <div className="flex w-full flex-col gap-4">
              <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
                No pudimos cargar tus guardadas
              </h2>
              <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
                Inténtalo de nuevo para recuperar tus vacantes guardadas.
              </p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background pt-2 pb-[env(safe-area-inset-bottom,0px)] md:static md:mx-auto md:w-full md:max-w-[354px]">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-4 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      )}

      {/* Estado 3: Sin guardadas (Figma 326:2293) */}
      {!isLoading && !hasError && savedVacancies.length === 0 && (
        <div className="flex flex-1 flex-col justify-between gap-6">
          <div className="mx-auto flex flex-1 max-w-[354px] flex-col items-center justify-center gap-6 py-8">
            <div
              aria-hidden="true"
              className="flex size-[80px] items-center justify-center rounded-[16px] bg-muted text-primary"
            >
              <HugeiconsIcon
                icon={Bookmark02Icon}
                size={40}
                strokeWidth={1.75}
              />
            </div>

            <div className="flex w-full flex-col gap-4">
              <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
                Aún no tienes vacantes guardadas
              </h2>
              <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
                Toca el marcador de una vacante para guardarla aquí y revisarla
                después.
              </p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background pt-2 pb-[env(safe-area-inset-bottom,0px)] md:static md:mx-auto md:w-full md:max-w-[354px]">
            <Link
              href="/dashboard/candidate"
              className="inline-flex min-h-[56px] w-full items-center justify-center gap-4 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={Search01Icon}
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />
              <span>Explorar vacantes</span>
            </Link>
          </div>
        </div>
      )}

      {/* Estado 4: Listado de guardadas (Figma 326:2186 y 326:2247) */}
      {!isLoading && savedVacancies.length > 0 && (
        <div className="flex flex-1 flex-col gap-4">
          <p
            role="status"
            aria-live="polite"
            className="text-[14px] font-normal leading-[19px] text-foreground"
          >
            {countLabel}
          </p>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            {savedVacancies.map((vacancy) => (
              <SavedVacancyCard
                key={vacancy.id}
                vacancy={vacancy}
                onRemove={handleRemoveVacancy}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
