"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Briefcase01Icon,
  Building03Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  Location01Icon,
  Notification02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/supabase";

interface JobAlertPreferencesViewProps {
  onBack?: () => void;
}

type PreferenceSheet =
  | "role"
  | "categories"
  | "locations"
  | "salary"
  | "alerts";

type AlertFrequency = "Instantánea" | "Resumen diario" | "Semanal";
type WorkModality = "Presencial" | "Híbrido" | "Remoto";

interface StoredAlertPreferences {
  target_role?: string;
  categories?: string[];
  locations?: string[];
  min_salary?: number;
  modalities?: WorkModality[];
  frequency?: AlertFrequency;
}

const ALL_CATEGORIES: readonly string[] = [
  "Hotelería & Recepción",
  "Alimentos & Bebidas",
  "Cocina & Gastronomía",
  "Ventas & Atención al Cliente",
  "Eventos & Entretenimiento",
  "Ama de Llaves & Mantenimiento",
  "Administración & RH",
  "Coctelería & Bar",
];

const ALL_LOCATIONS: readonly string[] = [
  "Playa del Carmen, Q. Roo",
  "Cancún, Q. Roo",
  "Tulum, Q. Roo",
  "Mérida, Yucatán",
  "Cozumel, Q. Roo",
  "Isla Mujeres, Q. Roo",
  "Riviera Maya",
];

const ALL_MODALITIES: readonly WorkModality[] = [
  "Presencial",
  "Híbrido",
  "Remoto",
];

const ALL_FREQUENCIES: readonly AlertFrequency[] = [
  "Instantánea",
  "Resumen diario",
  "Semanal",
];

function formatCategoriesSummary(categories: string[]): string {
  if (categories.length === 0) return "Elige tus sectores";
  if (categories.length === 1) return categories[0];
  return `${categories[0]} + ${categories.length - 1}`;
}

function formatLocationsSummary(locations: string[]): string {
  if (locations.length === 0) return "Elige tus zonas";
  const shortNames = locations.map((loc) => loc.split(",")[0]?.trim() || loc);
  if (shortNames.length === 1) return shortNames[0];
  if (shortNames.length === 2) return `${shortNames[0]} y ${shortNames[1]}`;
  return `${shortNames[0]}, ${shortNames[1]} + ${shortNames.length - 2}`;
}

function SelectionOptionRow({
  label,
  selected,
  onClick,
  role = "checkbox",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  role?: "checkbox" | "radio";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-4 rounded-[8px] border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-[1.5px] border-primary bg-background text-foreground"
          : "border-input bg-background text-foreground hover:bg-muted/40"
      )}
    >
      <span className="text-[14px] font-normal leading-[19px] text-foreground">
        {label}
      </span>
      {selected ? (
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className="shrink-0 text-primary"
        />
      ) : (
        <span
          aria-hidden="true"
          className="size-[20px] shrink-0 rounded-full border border-input"
        />
      )}
    </button>
  );
}

export function JobAlertPreferencesView({
  onBack,
}: JobAlertPreferencesViewProps) {
  const router = useRouter();

  // Saved/committed preferences state
  const [targetRole, setTargetRole] = React.useState("");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([
    "Administración & RH",
  ]);
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([
    "Playa del Carmen, Q. Roo",
    "Cancún, Q. Roo",
  ]);
  const [minSalary, setMinSalary] = React.useState<number>(14000);
  const [selectedModalities, setSelectedModalities] = React.useState<
    WorkModality[]
  >(["Presencial"]);
  const [alertsEnabled, setAlertsEnabled] = React.useState<boolean>(true);
  const [alertFrequency, setAlertFrequency] =
    React.useState<AlertFrequency>("Resumen diario");

  // Sheet & draft states (discarded when sheet closes without confirming)
  const [openSheet, setOpenSheet] = React.useState<PreferenceSheet | null>(null);
  const [draftRole, setDraftRole] = React.useState("");
  const [draftCategories, setDraftCategories] = React.useState<string[]>([]);
  const [draftLocations, setDraftLocations] = React.useState<string[]>([]);
  const [draftSalaryInput, setDraftSalaryInput] = React.useState("14000");
  const [draftModalities, setDraftModalities] = React.useState<WorkModality[]>(
    []
  );
  const [draftAlertsEnabled, setDraftAlertsEnabled] = React.useState(true);
  const [draftFrequency, setDraftFrequency] =
    React.useState<AlertFrequency>("Resumen diario");

  const [isSaving, setIsSaving] = React.useState(false);
  const [savedBannerVisible, setSavedBannerVisible] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadPreferences() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active || !user) return;

        const { data: candProfile } = await supabase
          .from("candidate_profiles")
          .select(
            "headline, job_alerts_enabled, preferred_zone, specialization_area, social_links"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (!active || !candProfile) return;

        if (candProfile.job_alerts_enabled !== null) {
          setAlertsEnabled(Boolean(candProfile.job_alerts_enabled));
        }

        const social =
          candProfile.social_links &&
          typeof candProfile.social_links === "object" &&
          !Array.isArray(candProfile.social_links)
            ? (candProfile.social_links as Record<string, unknown>)
            : null;
        const stored = social?.alert_preferences as
          | StoredAlertPreferences
          | undefined;

        if (stored?.target_role) {
          setTargetRole(stored.target_role);
        } else if (candProfile.headline) {
          setTargetRole(candProfile.headline);
        }

        if (Array.isArray(stored?.categories) && stored.categories.length > 0) {
          setSelectedCategories(stored.categories);
        } else if (candProfile.specialization_area) {
          setSelectedCategories([candProfile.specialization_area]);
        }

        if (Array.isArray(stored?.locations) && stored.locations.length > 0) {
          setSelectedLocations(stored.locations);
        } else if (candProfile.preferred_zone) {
          setSelectedLocations([candProfile.preferred_zone]);
        }

        if (typeof stored?.min_salary === "number" && stored.min_salary > 0) {
          setMinSalary(stored.min_salary);
        }

        if (Array.isArray(stored?.modalities) && stored.modalities.length > 0) {
          setSelectedModalities(stored.modalities);
        }

        if (
          stored?.frequency &&
          ALL_FREQUENCIES.includes(stored.frequency)
        ) {
          setAlertFrequency(stored.frequency);
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
      }
    }

    void loadPreferences();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenSheet = (sheet: PreferenceSheet) => {
    setDraftRole(targetRole);
    setDraftCategories(selectedCategories);
    setDraftLocations(selectedLocations);
    setDraftSalaryInput(String(minSalary));
    setDraftModalities(selectedModalities);
    setDraftAlertsEnabled(alertsEnabled);
    setDraftFrequency(alertFrequency);
    setOpenSheet(sheet);
  };

  const toggleDraftItem = <T extends string>(
    list: T[],
    item: T,
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    setter((prev) =>
      prev.includes(item)
        ? prev.length > 1
          ? prev.filter((x) => x !== item)
          : prev
        : [...prev, item]
    );
  };

  const handleApplySheet = () => {
    if (openSheet === "role") {
      setTargetRole(draftRole.trim());
    } else if (openSheet === "categories") {
      setSelectedCategories(draftCategories);
    } else if (openSheet === "locations") {
      setSelectedLocations(draftLocations);
    } else if (openSheet === "salary") {
      const parsed = Number(draftSalaryInput.replace(/[^\d]/g, ""));
      if (parsed >= 1000) {
        setMinSalary(parsed);
      }
      setSelectedModalities(draftModalities);
    } else if (openSheet === "alerts") {
      setAlertsEnabled(draftAlertsEnabled);
      setAlertFrequency(draftFrequency);
    }
    setSavedBannerVisible(false);
    setOpenSheet(null);
  };

  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Inicia sesión para guardar tus preferencias");
        return;
      }

      const { data: current } = await supabase
        .from("candidate_profiles")
        .select("social_links")
        .eq("id", user.id)
        .maybeSingle();

      const existingSocial =
        current?.social_links &&
        typeof current.social_links === "object" &&
        !Array.isArray(current.social_links)
          ? (current.social_links as Record<string, Json | undefined>)
          : {};

      const alertPrefs: StoredAlertPreferences = {
        target_role: targetRole.trim() || undefined,
        categories: selectedCategories,
        locations: selectedLocations,
        min_salary: minSalary,
        modalities: selectedModalities,
        frequency: alertFrequency,
      };

      const { error } = await supabase.from("candidate_profiles").upsert({
        id: user.id,
        job_alerts_enabled: alertsEnabled,
        specialization_area: selectedCategories[0] ?? null,
        preferred_zone: selectedLocations[0] ?? null,
        social_links: {
          ...existingSocial,
          alert_preferences: alertPrefs as unknown as Json,
        },
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setSavedBannerVisible(true);
    } catch (err) {
      console.error("Error saving preferences:", err);
      toast.error("No pudimos guardar tus preferencias. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.push("/dashboard/candidate/profile");
  };

  const salaryModalitySummary = `$${minSalary.toLocaleString("es-MX")} MXN/mes · ${selectedModalities.join(", ")}`;
  const alertsSummary = alertsEnabled
    ? `Activadas · ${alertFrequency}`
    : "Desactivadas";

  const rows: ReadonlyArray<{
    id: PreferenceSheet;
    icon: typeof Briefcase01Icon;
    title: string;
    subtitle: string;
  }> = [
    {
      id: "role",
      icon: Briefcase01Icon,
      title: "Puesto de interés",
      subtitle: targetRole || "Agrega el puesto que buscas",
    },
    {
      id: "categories",
      icon: Briefcase01Icon,
      title: "Sectores de interés",
      subtitle: formatCategoriesSummary(selectedCategories),
    },
    {
      id: "locations",
      icon: Location01Icon,
      title: "Zonas para trabajar",
      subtitle: formatLocationsSummary(selectedLocations),
    },
    {
      id: "salary",
      icon: Building03Icon,
      title: "Sueldo y modalidad",
      subtitle: salaryModalitySummary,
    },
    {
      id: "alerts",
      icon: Notification02Icon,
      title: "Alertas de empleo",
      subtitle: alertsSummary,
    },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[600px] flex-col justify-between gap-6 pb-8 md:min-h-0">
      <div className="flex flex-col gap-6">
        {/* Encabezado volver a Mi perfil (móvil) */}
        <div className="flex h-[48px] items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Volver a Mi perfil"
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
            Mi perfil
          </span>
        </div>

        {/* Presentación */}
        <header className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold leading-[39px] text-foreground">
            Preferencias de empleo
          </h1>
          <p className="text-[16px] font-normal leading-[22px] text-muted-foreground">
            Personaliza las oportunidades que quieres recibir.
          </p>
        </header>

        {/* Lista de 5 preferencias */}
        <div className="flex flex-col divide-y divide-border">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => handleOpenSheet(row.id)}
              className="group flex min-h-[76px] w-full cursor-pointer items-center gap-4 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={row.icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-[14px] font-semibold leading-[19px] text-foreground">
                  {row.title}
                </p>
                <p className="truncate text-[13px] font-normal leading-[18px] text-muted-foreground">
                  {row.subtitle}
                </p>
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              />
            </button>
          ))}
        </div>

        <p className="text-[14px] font-normal leading-[19px] text-muted-foreground">
          Tus zonas de interés no cambian tu domicilio personal.
        </p>
      </div>

      {/* Confirmación inline (Figma 323:2124) + CTA Guardar preferencias */}
      <div className="sticky bottom-0 flex flex-col gap-4 bg-background pt-2 pb-[env(safe-area-inset-bottom,0px)]">
        {savedBannerVisible && (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-[56px] w-full items-center gap-3 rounded-[16px] bg-muted pl-4 pr-2"
          >
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={22}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-primary"
            />
            <span className="flex-1 text-[14px] font-medium text-foreground">
              Preferencias guardadas
            </span>
            <button
              type="button"
              onClick={() => setSavedBannerVisible(false)}
              aria-label="Cerrar aviso"
              className="inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={18}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={isSaving}
          aria-busy={isSaving}
          onClick={() => void handleSaveAll()}
          className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HugeiconsIcon
            icon={isSaving ? Loading03Icon : CheckmarkCircle02Icon}
            size={20}
            strokeWidth={1.75}
            aria-hidden="true"
            className={isSaving ? "animate-spin" : undefined}
          />
          <span>{isSaving ? "Guardando…" : "Guardar preferencias"}</span>
        </button>
      </div>

      {/* Sheets contextuales de edición con borrador independiente */}
      <Sheet
        open={Boolean(openSheet)}
        onOpenChange={(open) => !open && setOpenSheet(null)}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="mx-auto w-full max-w-[460px] max-h-[calc(100dvh-64px)] overflow-y-auto rounded-t-[24px] border-t border-border bg-background px-6 pt-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-[22px] font-bold leading-[30px] text-foreground">
              {openSheet === "role" && "Puesto de interés"}
              {openSheet === "categories" && "Sectores de interés"}
              {openSheet === "locations" && "Zonas para trabajar"}
              {openSheet === "salary" && "Sueldo y modalidad"}
              {openSheet === "alerts" && "Alertas de empleo"}
            </SheetTitle>

            <SheetClose
              render={
                <button
                  type="button"
                  aria-label="Cerrar"
                  className="-mr-2 inline-flex size-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              }
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </SheetClose>
          </div>

          {/* Sheet: Puesto de interés */}
          {openSheet === "role" && (
            <div className="mt-4 flex flex-col gap-5">
              <p className="text-[14px] leading-[19px] text-muted-foreground">
                Escribe el puesto principal que estás buscando.
              </p>
              <label className="flex flex-col gap-2 text-[12px] font-semibold text-foreground">
                Puesto deseado
                <input
                  type="text"
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value)}
                  placeholder="Ej. Auxiliar administrativo"
                  className="h-[56px] rounded-[8px] border border-input bg-background px-4 text-[14px] font-normal text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <button
                type="button"
                onClick={handleApplySheet}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Usar selección</span>
              </button>
            </div>
          )}

          {/* Sheet: Sectores de interés (Figma 323:1869) */}
          {openSheet === "categories" && (
            <div className="mt-4 flex flex-col gap-4">
              <p className="text-[14px] leading-[19px] text-muted-foreground">
                Selecciona uno o más sectores donde te gustaría trabajar.
              </p>
              <div className="flex flex-col gap-2.5">
                {ALL_CATEGORIES.map((category) => (
                  <SelectionOptionRow
                    key={category}
                    label={category}
                    selected={draftCategories.includes(category)}
                    onClick={() =>
                      toggleDraftItem(
                        draftCategories,
                        category,
                        setDraftCategories
                      )
                    }
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleApplySheet}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Usar selección</span>
              </button>
            </div>
          )}

          {/* Sheet: Zonas para trabajar (Figma 323:1925) */}
          {openSheet === "locations" && (
            <div className="mt-4 flex flex-col gap-4">
              <p className="text-[14px] leading-[19px] text-muted-foreground">
                Elige una o más zonas donde quieres encontrar empleo.
              </p>
              <div className="flex flex-col gap-2.5">
                {ALL_LOCATIONS.map((loc) => (
                  <SelectionOptionRow
                    key={loc}
                    label={loc}
                    selected={draftLocations.includes(loc)}
                    onClick={() =>
                      toggleDraftItem(draftLocations, loc, setDraftLocations)
                    }
                  />
                ))}
              </div>
              <p className="text-[13px] leading-[18px] text-muted-foreground">
                Estas preferencias no actualizan tu dirección.
              </p>
              <button
                type="button"
                onClick={handleApplySheet}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Usar selección</span>
              </button>
            </div>
          )}

          {/* Sheet: Sueldo y modalidad (Figma 323:1979) */}
          {openSheet === "salary" && (
            <div className="mt-4 flex flex-col gap-5">
              <p className="text-[14px] leading-[19px] text-muted-foreground">
                Indica el sueldo mínimo y las modalidades que te interesan.
              </p>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="pref-min-salary"
                  className="text-[12px] font-semibold text-foreground"
                >
                  Sueldo mínimo mensual (MXN)
                </label>
                <input
                  id="pref-min-salary"
                  type="text"
                  inputMode="numeric"
                  value={draftSalaryInput}
                  onChange={(e) => setDraftSalaryInput(e.target.value)}
                  placeholder="14,000"
                  className="h-[56px] rounded-[8px] border border-input bg-background px-4 text-[14px] text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-[13px] leading-[18px] text-muted-foreground">
                  De $8,000 a $35,000 MXN al mes, en incrementos de $1,000.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <p className="text-[16px] font-normal leading-[22px] text-foreground">
                  Modalidad de trabajo
                </p>
                {ALL_MODALITIES.map((mod) => (
                  <SelectionOptionRow
                    key={mod}
                    label={mod}
                    selected={draftModalities.includes(mod)}
                    onClick={() =>
                      toggleDraftItem(draftModalities, mod, setDraftModalities)
                    }
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleApplySheet}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Usar preferencias</span>
              </button>
            </div>
          )}

          {/* Sheet: Alertas de empleo Activadas / Desactivadas (Figma 323:2026 y 323:2080) */}
          {openSheet === "alerts" && (
            <div className="mt-4 flex flex-col gap-5">
              <p className="text-[14px] leading-[19px] text-muted-foreground">
                {draftAlertsEnabled
                  ? "Recibe avisos de vacantes acordes a tus preferencias."
                  : "Controla si quieres recibir avisos de nuevas vacantes."}
              </p>

              <div className="flex items-center justify-between gap-4 rounded-[16px] bg-muted p-4">
                <div className="flex items-center gap-3">
                  <HugeiconsIcon
                    icon={Notification02Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground"
                  />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-foreground">
                      Alertas de empleo
                    </span>
                    <span className="text-[13px] text-muted-foreground">
                      {draftAlertsEnabled ? "Activadas" : "Desactivadas"}
                    </span>
                  </div>
                </div>
                <Switch
                  checked={draftAlertsEnabled}
                  onCheckedChange={setDraftAlertsEnabled}
                  aria-label="Activar o desactivar alertas de empleo"
                />
              </div>

              {draftAlertsEnabled ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[16px] font-normal leading-[22px] text-foreground">
                    ¿Cuándo quieres recibirlas?
                  </p>
                  <div
                    role="radiogroup"
                    aria-label="Frecuencia de alertas de empleo"
                    className="flex flex-col gap-2.5"
                  >
                    {ALL_FREQUENCIES.map((freq) => (
                      <SelectionOptionRow
                        key={freq}
                        role="radio"
                        label={freq}
                        selected={draftFrequency === freq}
                        onClick={() => setDraftFrequency(freq)}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] leading-[18px] text-muted-foreground">
                    La frecuencia aplica a nuevas vacantes que coincidan con tus
                    preferencias.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-[15px] leading-[21px] text-foreground">
                    No recibirás alertas de nuevas vacantes. Tus sectores,
                    zonas, sueldo y modalidad se conservan.
                  </p>
                  <p className="text-[13px] leading-[18px] text-muted-foreground">
                    Puedes seguir buscando y postulándote con normalidad.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplySheet}
                className="mt-2 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-3 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span>Usar preferencias</span>
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
