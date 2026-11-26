"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Bookmark02Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  FilterHorizontalIcon,
  Location01Icon,
  Notification02Icon,
  RefreshIcon,
  Search01Icon,
  Share08Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type {
  CandidateApplication,
  CandidateDashboardData,
  VacancyItem,
} from "@/modules/candidate/services/candidate-dashboard";
import { toggleSavedVacancyAction } from "@/modules/candidate/actions/saved-vacancies";
import { ActiveEmployeePortalView } from "./employee/active-employee-portal-view";
import { ForcePasswordChangeAlert } from "./password/force-password-change-alert";
import type { CandidateSearchFilters } from "../utils/search-params";

export interface CandidateDashboardViewProps {
  initialData: CandidateDashboardData;
  initialFilters?: CandidateSearchFilters;
}

type ModalityFilter = "all" | "presencial" | "hibrido" | "remoto";

const MODALITY_OPTIONS: ReadonlyArray<{
  value: ModalityFilter;
  label: string;
}> = [
  { value: "all", label: "Todas las modalidades" },
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido" },
  { value: "remoto", label: "Remoto" },
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCompanyInitials(companyName: string): string {
  const words = companyName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "KP";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getDisplayCity(location: string | null | undefined): string {
  if (!location || !location.trim()) return "Tu zona";
  const firstSegment = location.split(",")[0]?.trim();
  return firstSegment || location.trim();
}

function capitalizeLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatLocationLabel(vacancy: VacancyItem): string {
  if (vacancy.zone) {
    return `${vacancy.zone}${vacancy.city ? `, ${vacancy.city}` : ""}`;
  }
  return vacancy.location;
}

function formatLocationWithModality(vacancy: VacancyItem): string {
  const loc = formatLocationLabel(vacancy);
  const mod = vacancy.modality ? capitalizeLabel(vacancy.modality) : "";
  if (loc && mod) return `${loc} · ${mod}`;
  return loc || mod || "Presencial";
}

function formatConditions(vacancy: VacancyItem): string {
  const parts: string[] = [];
  if (vacancy.employmentType) parts.push(vacancy.employmentType);
  if (vacancy.modality) parts.push(capitalizeLabel(vacancy.modality));
  return parts.length > 0 ? parts.join(" · ") : "Tiempo completo · Presencial";
}

function formatRelativeDate(isoDate?: string): string {
  if (!isoDate) return "Reciente";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "Reciente";

  const diffMs = Date.now() - parsed.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "Hace 1 sem.";
  if (diffWeeks < 5) return `Hace ${diffWeeks} sem.`;
  return parsed.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function formatPublishedLabel(isoDate?: string): string {
  const rel = formatRelativeDate(isoDate);
  if (rel === "Hoy") return "Publicada hoy";
  if (rel === "Ayer") return "Publicada ayer";
  if (rel.startsWith("Hace ")) return `Publicada ${rel.toLowerCase()}`;
  return `Publicada ${rel}`;
}

function parseBulletLines(raw?: string | null): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

function mapApplicationStage(status: string): {
  label: string;
  step: 1 | 2 | 3 | 4;
} {
  const normalized = status.toLowerCase();
  if (
    normalized === "contratado" ||
    normalized === "hired" ||
    normalized === "accepted" ||
    normalized === "offer"
  ) {
    return { label: "Contratado", step: 4 };
  }
  if (
    normalized === "entrevista" ||
    normalized === "en entrevista" ||
    normalized === "interview" ||
    normalized === "interviewing"
  ) {
    return { label: "Entrevista", step: 3 };
  }
  if (
    normalized === "preseleccionado" ||
    normalized === "preselección" ||
    normalized === "shortlisted" ||
    normalized === "preselected"
  ) {
    return { label: "Preselección", step: 2 };
  }
  return { label: "Por revisar", step: 1 };
}

function selectActiveApplication(
  applications: CandidateApplication[]
): CandidateApplication | null {
  const active = applications.find((app) => {
    const status = app.status.toLowerCase();
    return (
      status !== "descartado" &&
      status !== "rejected" &&
      status !== "withdrawn" &&
      status !== "cancelled"
    );
  });
  return active ?? null;
}

interface VacancyCardFeedProps {
  vacancy: VacancyItem;
  isSaved: boolean;
  onToggleSave: (vacancyId: string) => void;
}

function VacancyCardFeed({
  vacancy,
  isSaved,
  onToggleSave,
}: VacancyCardFeedProps) {
  const initials = getCompanyInitials(vacancy.companyName);
  const locationLabel = formatLocationLabel(vacancy);

  return (
    <article className="relative bg-background border border-border rounded-[16px] p-4 min-h-[184px] flex flex-col justify-between hover:border-primary/40 transition-colors">
      {/* Encabezado: iniciales + empresa + puesto + botón guardar */}
      <div className="flex items-start gap-4 pr-11">
        <div
          aria-hidden="true"
          className="size-[40px] rounded-[8px] bg-muted flex items-center justify-center shrink-0"
        >
          <span className="text-[12px] font-medium leading-[17px] text-primary">
            {initials}
          </span>
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[14px] font-normal leading-[19px] text-foreground truncate">
            {vacancy.companyName}
          </p>
          <h2 className="text-[18px] font-semibold leading-[24px] text-foreground line-clamp-2">
            <Link
              href={`/dashboard/candidate/vacancies/${vacancy.id}`}
              className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[4px]"
            >
              {vacancy.title}
            </Link>
          </h2>
        </div>
      </div>

      {/* Botón guardar (área táctil 48 × 48 px) */}
      <button
        type="button"
        onClick={() => onToggleSave(vacancy.id)}
        aria-pressed={isSaved}
        aria-label={
          isSaved
            ? `Quitar ${vacancy.title} de guardados`
            : `Guardar vacante ${vacancy.title}`
        }
        className={cn(
          "absolute right-1.5 top-1.5 size-[48px] inline-flex items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
          isSaved
            ? "text-primary bg-muted/70"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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

      {/* Ubicación, salario y condiciones */}
      <div className="mt-4 flex flex-col">
        <div className="flex items-center gap-4 min-h-[20px]">
          <HugeiconsIcon
            icon={Location01Icon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className="text-muted-foreground shrink-0"
          />
          <p className="text-[14px] font-normal leading-[19px] text-muted-foreground truncate">
            {locationLabel}
          </p>
        </div>

        <p className="mt-3 text-[16px] font-semibold leading-normal text-foreground">
          {vacancy.formattedSalary}
        </p>

        <p className="mt-1 text-[12px] font-medium leading-[17px] text-muted-foreground truncate">
          {formatConditions(vacancy)}
        </p>
      </div>
    </article>
  );
}

interface DesktopVacancyListCardProps {
  vacancy: VacancyItem;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (vacancyId: string) => void;
  onToggleSave: (vacancyId: string) => void;
}

function DesktopVacancyListCard({
  vacancy,
  isSelected,
  isSaved,
  onSelect,
  onToggleSave,
}: DesktopVacancyListCardProps) {
  const initials = getCompanyInitials(vacancy.companyName);
  const relativeDate = formatRelativeDate(vacancy.createdAt);

  return (
    <div
      className={cn(
        "relative rounded-[16px] bg-background transition-colors",
        isSelected
          ? "border-2 border-primary"
          : "border border-border hover:border-primary/40"
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(vacancy.id)}
        aria-pressed={isSelected}
        className="w-full text-left p-4 rounded-[16px] flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      >
        {/* Encabezado: iniciales + empresa + puesto */}
        <div className="flex items-start gap-3 pr-12">
          <div
            aria-hidden="true"
            className="size-[40px] rounded-[8px] bg-muted flex items-center justify-center shrink-0"
          >
            <span className="text-[12px] font-medium leading-[17px] text-primary">
              {initials}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="text-[14px] font-normal leading-[19px] text-muted-foreground truncate">
              {vacancy.companyName}
            </p>
            <h2 className="text-[20px] font-semibold leading-[28px] text-foreground line-clamp-2">
              {vacancy.title}
            </h2>
          </div>
        </div>

        {/* Ubicación · modalidad */}
        <p className="mt-3 text-[14px] font-normal leading-[19px] text-muted-foreground truncate">
          {formatLocationWithModality(vacancy)}
        </p>

        {/* Salario */}
        <p className="mt-2 text-[16px] font-normal leading-[22px] text-foreground">
          {vacancy.formattedSalary}
        </p>

        {/* Pie: jornada + fecha / estado seleccionado */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[14px] font-normal leading-[19px] text-muted-foreground truncate">
            {vacancy.employmentType || "Tiempo completo"}
          </span>
          <span
            className={cn(
              "text-[12px] font-medium leading-[17px] whitespace-nowrap shrink-0",
              isSelected ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isSelected ? `Seleccionada · ${relativeDate}` : relativeDate}
          </span>
        </div>
      </button>

      {/* Botón guardar (área táctil 48 × 48 px, hermano del botón de selección) */}
      <button
        type="button"
        onClick={() => onToggleSave(vacancy.id)}
        aria-pressed={isSaved}
        aria-label={
          isSaved
            ? `Quitar ${vacancy.title} de guardados`
            : `Guardar vacante ${vacancy.title}`
        }
        className={cn(
          "absolute right-1.5 top-1.5 size-[48px] inline-flex items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
          isSaved
            ? "text-primary bg-muted/70"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
    </div>
  );
}

interface DesktopVacancyDetailPanelProps {
  vacancy: VacancyItem;
  isSaved: boolean;
  onToggleSave: (vacancyId: string) => void;
  onShare: (vacancy: VacancyItem) => void;
}

function DesktopVacancyDetailPanel({
  vacancy,
  isSaved,
  onToggleSave,
  onShare,
}: DesktopVacancyDetailPanelProps) {
  const requirementLines = parseBulletLines(vacancy.requirements);
  const benefits = (vacancy.benefits ?? []).filter((b) => b.trim().length > 0);
  const skills = (vacancy.skills ?? []).filter((s) => s.trim().length > 0);

  return (
    <section
      aria-label={`Detalle de la vacante ${vacancy.title}`}
      className="flex-1 min-w-0 h-full rounded-[16px] border border-border bg-background p-6 flex flex-col gap-4"
    >
      {/* Cabecera de detalle: empresa + acciones secundarias (guardar y compartir) */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[14px] font-normal leading-[19px] text-muted-foreground truncate">
            {vacancy.companyName}
          </p>

          <div className="flex items-center gap-1 -mr-2 -my-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleSave(vacancy.id)}
              aria-pressed={isSaved}
              aria-label={
                isSaved
                  ? `Quitar ${vacancy.title} de guardados`
                  : `Guardar vacante ${vacancy.title}`
              }
              className={cn(
                "size-[48px] inline-flex items-center justify-center rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                isSaved
                  ? "text-primary bg-muted/70"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
              onClick={() => onShare(vacancy)}
              aria-label={`Compartir vacante ${vacancy.title}`}
              className="size-[48px] inline-flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <HugeiconsIcon
                icon={Share08Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <h2 className="mt-1 text-[28px] font-bold leading-[39px] tracking-normal text-foreground">
          {vacancy.title}
        </h2>

        <p className="mt-1 text-[14px] font-normal leading-[19px] text-muted-foreground">
          {formatLocationWithModality(vacancy)}
        </p>

        <p className="mt-3 text-[20px] font-semibold leading-[28px] text-foreground">
          {vacancy.formattedSalary}
        </p>

        <p className="mt-1 text-[14px] font-normal leading-[19px] text-muted-foreground">
          {vacancy.employmentType || "Tiempo completo"} ·{" "}
          {formatPublishedLabel(vacancy.createdAt)}
        </p>
      </div>

      <hr className="border-border shrink-0" />

      {/* Cuerpo desplazable del detalle */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="pr-3 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-[20px] font-semibold leading-[28px] text-foreground">
              Acerca del puesto
            </h3>
            <p className="text-[16px] font-normal leading-[22px] text-foreground whitespace-pre-line">
              {vacancy.description?.trim() ||
                "Consulta los detalles completos del puesto al revisar la vacante antes de postularte."}
            </p>
          </div>

          {(requirementLines.length > 0 || skills.length > 0) && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[20px] font-semibold leading-[28px] text-foreground">
                Lo que buscamos
              </h3>

              {requirementLines.length === 1 && (
                <p className="text-[16px] font-normal leading-[22px] text-foreground">
                  {requirementLines[0]}
                </p>
              )}

              {requirementLines.length > 1 && (
                <ul className="flex flex-col gap-2 list-disc pl-5 text-[16px] font-normal leading-[22px] text-foreground">
                  {requirementLines.map((line, index) => (
                    <li key={`${vacancy.id}-req-${index}`}>{line}</li>
                  ))}
                </ul>
              )}

              {skills.length > 0 && (
                <ul
                  aria-label="Habilidades solicitadas"
                  className="flex flex-wrap gap-2 pt-1"
                >
                  {skills.map((skill) => (
                    <li
                      key={`${vacancy.id}-skill-${skill}`}
                      className="px-3 py-1 rounded-[8px] bg-muted text-[12px] font-medium leading-[17px] text-foreground"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {benefits.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[20px] font-semibold leading-[28px] text-foreground">
                Lo que ofrecemos
              </h3>
              <ul className="flex flex-col gap-2 list-disc pl-5 text-[16px] font-normal leading-[22px] text-foreground">
                {benefits.map((benefit, index) => (
                  <li key={`${vacancy.id}-ben-${index}`}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScrollArea>

      <hr className="border-border shrink-0" />

      {/* Acción principal única: abre revisión antes de enviar (Figma 393:8708) */}
      <div className="flex flex-col gap-3 shrink-0">
        <Link
          href={`/dashboard/candidate/vacancies/${vacancy.id}`}
          className="min-h-[56px] w-full rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground text-[14px] font-semibold inline-flex items-center justify-center gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={20}
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>Aplicar a esta vacante</span>
        </Link>
        <p className="text-[12px] font-medium leading-[17px] text-muted-foreground w-full">
          Revisa tus datos antes de enviar la postulación.
        </p>
      </div>
    </section>
  );
}

function CandidateJobSeekerDashboardView({
  initialData,
  initialFilters,
}: CandidateDashboardViewProps) {
  const router = useRouter();
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () => new Set(initialData.savedVacancyIds ?? [])
  );
  const [, startTransition] = useTransition();

  const vacancies = useMemo<VacancyItem[]>(() => {
    const map = new Map<string, VacancyItem>();
    for (const item of initialData.featuredVacancies ?? []) {
      map.set(item.id, item);
    }
    for (const item of initialData.nearbyVacancies ?? []) {
      if (!map.has(item.id)) map.set(item.id, item);
    }
    return Array.from(map.values());
  }, [initialData.featuredVacancies, initialData.nearbyVacancies]);

  const [searchQuery, setSearchQuery] = useState(initialFilters?.q ?? "");
  const [locationFilter, setLocationFilter] = useState(
    initialFilters?.location ?? ""
  );
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>(
    initialFilters?.modality ?? "all"
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredDesktopVacancies = useMemo<VacancyItem[]>(() => {
    const normalizedSearch = normalizeText(searchQuery);
    const normalizedLocation = normalizeText(locationFilter);

    return vacancies.filter((vacancy) => {
      if (normalizedSearch) {
        const searchable = normalizeText(
          [
            vacancy.title,
            vacancy.companyName,
            vacancy.category,
            vacancy.location,
            vacancy.zone,
            vacancy.city,
            vacancy.description,
            ...(vacancy.skills ?? []),
          ]
            .filter(Boolean)
            .join(" ")
        );
        if (!searchable.includes(normalizedSearch)) return false;
      }

      if (normalizedLocation) {
        const locationHaystack = normalizeText(
          [vacancy.location, vacancy.zone, vacancy.city]
            .filter(Boolean)
            .join(" ")
        );
        if (!locationHaystack.includes(normalizedLocation)) return false;
      }

      if (modalityFilter !== "all") {
        const vacModality = normalizeText(vacancy.modality || "");
        if (!vacModality.includes(modalityFilter)) return false;
      }

      return true;
    });
  }, [vacancies, searchQuery, locationFilter, modalityFilter]);

  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(
    () => vacancies[0]?.id ?? null
  );

  const selectedVacancy = useMemo<VacancyItem | null>(() => {
    if (filteredDesktopVacancies.length === 0) return null;
    if (selectedVacancyId) {
      const found = filteredDesktopVacancies.find(
        (v) => v.id === selectedVacancyId
      );
      if (found) return found;
    }
    return filteredDesktopVacancies[0] ?? null;
  }, [filteredDesktopVacancies, selectedVacancyId]);

  const activeApplication = useMemo(
    () => selectActiveApplication(initialData.applications ?? []),
    [initialData.applications]
  );

  const cityLabel = getDisplayCity(initialData.profile?.location);
  const fullLocationLabel =
    initialData.profile?.location?.trim() || cityLabel;
  const activeLocationLabel = locationFilter.trim() || fullLocationLabel;
  const activeFilterCount =
    (locationFilter.trim() ? 1 : 0) + (modalityFilter !== "all" ? 1 : 0);
  const hasAnyDesktopFilter =
    searchQuery.trim().length > 0 || activeFilterCount > 0;

  const opportunityCountLabel = `${filteredDesktopVacancies.length} ${
    filteredDesktopVacancies.length === 1 ? "oportunidad" : "oportunidades"
  }`;
  const mobileLocationLabel = locationFilter.trim()
    ? getDisplayCity(locationFilter)
    : cityLabel;
  const desktopCountLabel = `${filteredDesktopVacancies.length} ${
    filteredDesktopVacancies.length === 1 ? "vacante" : "vacantes"
  }`;

  const handleResetFilters = () => {
    setLocationFilter("");
    setModalityFilter("all");
  };

  const handleResetAllDesktopFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setModalityFilter("all");
    router.replace("/dashboard/candidate");
  };

  const handleToggleSave = (vacancyId: string) => {
    const wasSaved = savedIds.has(vacancyId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(vacancyId);
      else next.add(vacancyId);
      return next;
    });

    startTransition(async () => {
      const result = await toggleSavedVacancyAction({ vacancyId });
      if (!result.success) {
        setSavedIds((prev) => {
          const rollback = new Set(prev);
          if (wasSaved) rollback.add(vacancyId);
          else rollback.delete(vacancyId);
          return rollback;
        });
        toast.error("No se pudo actualizar", { description: result.error });
        return;
      }

      toast.success(
        result.data.saved ? "Vacante guardada" : "Quitada de guardados"
      );
    });
  };

  const handleShareVacancy = async (vacancy: VacancyItem) => {
    const url = `${window.location.origin}/dashboard/candidate/vacancies/${vacancy.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${vacancy.title} · ${vacancy.companyName}`,
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("No se pudo compartir el enlace");
    }
  };

  const activeStage = activeApplication
    ? mapApplicationStage(activeApplication.status)
    : null;

  return (
    <div
      className={cn(
        "w-full flex flex-col",
        activeApplication ? "pb-20 md:pb-0" : "pb-4 md:pb-0"
      )}
    >
      {/* ==================== VISTA MÓVIL Y TABLET (< lg, Figma 204:76) ==================== */}
      <div className="lg:hidden flex flex-col w-full">
        {/* Cabecera móvil pixel-perfect (Figma 204:77) */}
        <header className="md:hidden pt-4 flex flex-col w-full">
          <div className="flex items-center justify-between w-full">
            <span className="text-[28px] font-bold leading-[39px] tracking-normal text-foreground select-none">
              Kanpro
            </span>

            <div className="flex items-center gap-1 -mr-2">
              <Link
                href="/dashboard/candidate/saved"
                aria-label="Vacantes guardadas"
                className="size-[48px] inline-flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <HugeiconsIcon
                  icon={Bookmark02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/dashboard/candidate/inbox"
                aria-label="Notificaciones"
                className="size-[48px] inline-flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <HugeiconsIcon
                  icon={Notification02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>

          <h1 className="mt-4 text-[28px] font-bold leading-[39px] tracking-normal text-foreground">
            Vacantes para ti
          </h1>
        </header>

        {/* Cabecera tablet (md a < lg) */}
        <header className="hidden md:flex items-center justify-between gap-4 w-full">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-bold leading-[39px] tracking-normal text-foreground">
              Vacantes para ti
            </h1>
          </div>

          <Link
            href="/dashboard/candidate/discovery"
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-[8px] border border-border bg-background hover:bg-muted/50 text-foreground text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
          >
            <HugeiconsIcon
              icon={Search01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span>Buscar y filtrar</span>
          </Link>
        </header>

        {/* Ubicación actual y conteo de oportunidades (Figma 204:89) */}
        <div className="mt-2 flex items-center justify-between gap-2 min-h-[24px]">
          <div className="flex items-center gap-4 min-w-0">
            <HugeiconsIcon
              icon={Location01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="text-muted-foreground shrink-0"
            />
            <p className="text-[14px] font-normal leading-[19px] text-muted-foreground truncate">
              {mobileLocationLabel} · {opportunityCountLabel}
            </p>
          </div>
          {hasAnyDesktopFilter && (
            <button
              type="button"
              onClick={handleResetAllDesktopFilters}
              className="min-h-[48px] px-2 -my-3 text-[12px] font-medium text-primary hover:underline cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[8px]"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Seguimiento de postulación activa en tablet (solo si existe postulación real) */}
        {activeApplication && activeStage && (
          <Link
            href="/dashboard/candidate/applications"
            aria-label={`Tu postulación para ${activeApplication.position}: ${activeStage.label}, Etapa ${activeStage.step} de 4`}
            className="hidden md:flex mt-5 max-w-[460px] bg-muted border border-border/60 rounded-[8px] min-h-[56px] px-4 py-2 items-center justify-between gap-4 hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-4 min-w-0">
              <HugeiconsIcon
                icon={File01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-muted-foreground shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium leading-[17px] text-foreground">
                  Tu postulación
                </span>
                <span className="text-[14px] font-normal leading-[19px] text-foreground truncate">
                  {activeApplication.position}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-[14px] font-normal leading-[19px] text-primary whitespace-nowrap">
                {activeStage.label}
              </span>
              <span className="text-[12px] font-medium leading-[17px] text-foreground whitespace-nowrap">
                Etapa {activeStage.step} de 4
              </span>
            </div>
          </Link>
        )}

        {/* Feed de vacantes móvil/tablet */}
        <section
          aria-label="Lista de vacantes recomendadas"
          className="mt-6 w-full"
        >
          {filteredDesktopVacancies.length === 0 ? (
            <div className="bg-background border border-border rounded-[16px] p-8 flex flex-col items-center text-center gap-4">
              <div className="size-[56px] rounded-full bg-muted flex items-center justify-center text-primary">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={24}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <h2 className="text-[18px] font-semibold leading-[24px] text-foreground">
                  {hasAnyDesktopFilter
                    ? "No encontramos vacantes con esos filtros"
                    : `Aún no hay vacantes en ${cityLabel}`}
                </h2>
                <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                  {hasAnyDesktopFilter
                    ? "Prueba con otro puesto, ubicación o limpia los filtros activos."
                    : "Explora todas las oportunidades activas o ajusta tus filtros de búsqueda."}
                </p>
              </div>
              {hasAnyDesktopFilter ? (
                <button
                  type="button"
                  onClick={handleResetAllDesktopFilters}
                  className="mt-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground text-[14px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>Limpiar filtros</span>
                </button>
              ) : (
                <Link
                  href="/dashboard/candidate/discovery"
                  className="mt-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>Explorar vacantes</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {filteredDesktopVacancies.map((vacancy) => (
                <VacancyCardFeed
                  key={vacancy.id}
                  vacancy={vacancy}
                  isSaved={savedIds.has(vacancy.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          )}
        </section>

        {/* Seguimiento fijo móvil sobre la barra inferior (Figma 204:156 — solo si existe postulación real) */}
        {activeApplication && activeStage && (
          <div className="md:hidden fixed bottom-[calc(92px+env(safe-area-inset-bottom,0px))] inset-x-6 z-40 max-w-[402px] mx-auto">
            <Link
              href="/dashboard/candidate/applications"
              aria-label={`Tu postulación para ${activeApplication.position}: ${activeStage.label}, Etapa ${activeStage.step} de 4`}
              className="w-full bg-muted border border-border/60 rounded-[8px] min-h-[56px] px-4 py-2 flex items-center justify-between gap-3 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-4 min-w-0">
                <HugeiconsIcon
                  icon={File01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="text-muted-foreground shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-medium leading-[17px] text-foreground">
                    Tu postulación
                  </span>
                  <span className="text-[14px] font-normal leading-[19px] text-foreground truncate">
                    {activeApplication.position}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-[14px] font-normal leading-[19px] text-primary whitespace-nowrap">
                  {activeStage.label}
                </span>
                <span className="text-[12px] font-medium leading-[17px] text-foreground whitespace-nowrap">
                  Etapa {activeStage.step} de 4
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* ==================== VISTA LAPTOP / ESCRITORIO (lg+, Figma 395:8114) ==================== */}
      <div className="hidden lg:flex lg:flex-col w-full lg:h-[calc(100vh-144px)] lg:min-h-[540px]">
        {/* Barra permanente de búsqueda y filtros anclados (sticky) */}
        <div
          role="search"
          aria-label="Buscar y filtrar vacantes"
          className="sticky top-0 z-20 bg-background -mt-8 pt-6 pb-6 flex items-center gap-4 w-full shrink-0"
        >
          {/* Input de búsqueda permanente (Enter conserva filtros, sin botón adicional) */}
          <div className="flex-1 min-w-0 h-[56px] rounded-[8px] border border-control-border bg-background px-4 flex items-center gap-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring transition-colors">
            <HugeiconsIcon
              icon={Search01Icon}
              size={24}
              strokeWidth={1.75}
              aria-hidden="true"
              className="text-muted-foreground shrink-0"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                }
              }}
              aria-label="Buscar vacantes"
              placeholder="Puesto, empresa o habilidad"
              className="flex-1 min-w-0 bg-transparent text-[16px] font-normal leading-[22px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Activador y menú flotante de Filtros sin oscurecer el contenido */}
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger
              type="button"
              aria-label={
                activeFilterCount > 0
                  ? `Filtros (${activeFilterCount} activos)`
                  : "Filtros"
              }
              className={cn(
                "h-[56px] w-[224px] shrink-0 rounded-[8px] bg-background px-4 flex items-center gap-4 border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filtersOpen || activeFilterCount > 0
                  ? "border-primary"
                  : "border-control-border hover:border-foreground/50"
              )}
            >
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-foreground shrink-0"
              />
              <span className="flex-1 min-w-0 text-left text-[14px] font-normal leading-[19px] text-foreground truncate">
                {activeFilterCount > 0
                  ? `Filtros (${activeFilterCount})`
                  : "Filtros"}
              </span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={16}
                strokeWidth={1.75}
                aria-hidden="true"
                className={cn(
                  "text-muted-foreground shrink-0 transition-transform",
                  filtersOpen && "rotate-180"
                )}
              />
            </PopoverTrigger>

            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={8}
              className="w-[360px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-180px)] overflow-y-auto rounded-[16px] border border-control-border bg-background p-4 gap-2 shadow-lg ring-0"
            >
              {/* Encabezado del menú: Filtros + Limpiar */}
              <div className="h-[48px] flex items-center justify-between gap-2 w-full shrink-0">
                <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
                  Filtros
                </h2>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[48px] px-3 -mr-2 inline-flex items-center justify-center gap-3 rounded-[8px] text-[14px] font-normal leading-[19px] text-foreground hover:bg-muted/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HugeiconsIcon
                    icon={RefreshIcon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="text-primary shrink-0"
                  />
                  <span>Limpiar</span>
                </button>
              </div>

              {/* Campo Ubicación */}
              <label
                htmlFor="desktop-vacancy-location-filter"
                className="text-[14px] font-normal leading-[19px] text-foreground w-full"
              >
                Ubicación
              </label>
              <div className="h-[56px] w-full rounded-[8px] border border-control-border bg-background px-4 flex items-center gap-4 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring transition-colors shrink-0">
                <HugeiconsIcon
                  icon={Location01Icon}
                  size={24}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="text-muted-foreground shrink-0"
                />
                <input
                  id="desktop-vacancy-location-filter"
                  type="text"
                  value={locationFilter}
                  onChange={(event) => setLocationFilter(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setFiltersOpen(false);
                    }
                  }}
                  placeholder={fullLocationLabel}
                  className="flex-1 min-w-0 bg-transparent text-[16px] font-normal leading-[22px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>

              <hr className="border-border w-full my-1 shrink-0" />

              {/* Grupo de radio: Modalidad (seleccionar conserva y cierra el menú) */}
              <span
                id="desktop-vacancy-modality-label"
                className="text-[14px] font-normal leading-[19px] text-foreground w-full"
              >
                Modalidad
              </span>
              <div
                role="radiogroup"
                aria-labelledby="desktop-vacancy-modality-label"
                className="flex flex-col w-full"
              >
                {MODALITY_OPTIONS.map((option) => {
                  const isChecked = modalityFilter === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isChecked}
                      onClick={() => {
                        setModalityFilter(option.value);
                        setFiltersOpen(false);
                      }}
                      className="min-h-[48px] w-full px-2 rounded-[8px] flex items-center gap-4 hover:bg-muted/60 transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        aria-hidden="true"
                        className="size-[24px] shrink-0 inline-flex items-center justify-center"
                      >
                        {isChecked && (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={24}
                            strokeWidth={1.75}
                            className="text-primary"
                          />
                        )}
                      </span>
                      <span className="flex-1 min-w-0 text-[16px] font-normal leading-[22px] text-foreground">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Seguimiento de postulación activa en escritorio (solo si existe postulación real) */}
        {activeApplication && activeStage && (
          <Link
            href="/dashboard/candidate/applications"
            aria-label={`Tu postulación para ${activeApplication.position}: ${activeStage.label}, Etapa ${activeStage.step} de 4`}
            className="mb-4 max-w-[460px] bg-muted border border-border/60 rounded-[8px] min-h-[56px] px-4 py-2 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          >
            <div className="flex items-center gap-4 min-w-0">
              <HugeiconsIcon
                icon={File01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-muted-foreground shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-medium leading-[17px] text-foreground">
                  Tu postulación
                </span>
                <span className="text-[14px] font-normal leading-[19px] text-foreground truncate">
                  {activeApplication.position}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0">
              <span className="text-[14px] font-normal leading-[19px] text-primary whitespace-nowrap">
                {activeStage.label}
              </span>
              <span className="text-[12px] font-medium leading-[17px] text-foreground whitespace-nowrap">
                Etapa {activeStage.step} de 4
              </span>
            </div>
          </Link>
        )}

        {/* Barra de metadatos */}
        <div className="flex items-center justify-between gap-4 w-full shrink-0">
          <p className="text-[16px] font-normal leading-[22px] text-foreground">
            {desktopCountLabel} · {activeLocationLabel}
          </p>
          <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
            Orden: más recientes
          </p>
        </div>

        {/* Contenido maestro-detalle */}
        {filteredDesktopVacancies.length === 0 || !selectedVacancy ? (
          <div className="mt-6 bg-background border border-border rounded-[16px] p-10 flex flex-col items-center text-center gap-4">
            <div className="size-[56px] rounded-full bg-muted flex items-center justify-center text-primary">
              <HugeiconsIcon
                icon={Search01Icon}
                size={24}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col gap-1 max-w-md">
              <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
                {hasAnyDesktopFilter
                  ? "No encontramos vacantes con esos filtros"
                  : `Aún no hay vacantes en ${cityLabel}`}
              </h2>
              <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
                {hasAnyDesktopFilter
                  ? "Prueba con otro puesto, empresa o limpia los filtros activos para ver todas las vacantes disponibles."
                  : "Cuando se publiquen nuevas oportunidades en tu zona aparecerán aquí."}
              </p>
            </div>
            {hasAnyDesktopFilter && (
              <button
                type="button"
                onClick={handleResetAllDesktopFilters}
                className="mt-1 inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-[8px] bg-primary hover:bg-primary-hover text-primary-foreground text-[14px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span>Limpiar búsqueda y filtros</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 flex-1 min-h-0 flex items-stretch gap-6 w-full">
            {/* Columna izquierda: lista seleccionable de vacantes */}
            <aside
              aria-label="Lista de vacantes disponibles"
              className="w-[360px] xl:w-[408px] shrink-0 h-full"
            >
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 pr-3">
                  {filteredDesktopVacancies.map((vacancy) => (
                    <DesktopVacancyListCard
                      key={vacancy.id}
                      vacancy={vacancy}
                      isSelected={vacancy.id === selectedVacancy.id}
                      isSaved={savedIds.has(vacancy.id)}
                      onSelect={setSelectedVacancyId}
                      onToggleSave={handleToggleSave}
                    />
                  ))}
                </div>
              </ScrollArea>
            </aside>

            {/* Columna derecha: detalle de la vacante seleccionada */}
            <DesktopVacancyDetailPanel
              vacancy={selectedVacancy}
              isSaved={savedIds.has(selectedVacancy.id)}
              onToggleSave={handleToggleSave}
              onShare={handleShareVacancy}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CandidateDashboardView({
  initialData,
  initialFilters,
}: CandidateDashboardViewProps) {
  if (initialData?.activeEmployment) {
    return (
      <div className="space-y-4">
        {initialData.forcePasswordChange && <ForcePasswordChangeAlert />}
        <ActiveEmployeePortalView
          employment={initialData.activeEmployment}
          initialData={initialData}
        />
      </div>
    );
  }

  const filtersKey = `${initialFilters?.q ?? ""}|${initialFilters?.location ?? ""}|${initialFilters?.modality ?? "all"}`;

  return (
    <div className="space-y-4">
      {initialData?.forcePasswordChange && <ForcePasswordChangeAlert />}
      <CandidateJobSeekerDashboardView
        key={filtersKey}
        initialData={initialData}
        initialFilters={initialFilters}
      />
    </div>
  );
}
