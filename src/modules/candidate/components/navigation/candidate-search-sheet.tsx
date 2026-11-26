"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  Location01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  buildCandidateSearchUrl,
  parseCandidateSearchParams,
  type CandidateSearchFilters,
  type CandidateSearchModality,
} from "../../utils/search-params";

const SEARCH_SUGGESTIONS: readonly string[] = [
  "Recepcionista",
  "Auxiliar administrativo",
];

const SHEET_MODALITIES: ReadonlyArray<{
  value: CandidateSearchModality;
  label: string;
}> = [
  { value: "all", label: "Todas" },
  { value: "presencial", label: "Presencial" },
  { value: "remoto", label: "Remoto" },
];

export interface CandidateSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLocation?: string;
}

function readCurrentSearchFilters(): CandidateSearchFilters {
  if (typeof window === "undefined") {
    return { q: "", location: "", modality: "all" };
  }
  const urlParams = new URLSearchParams(window.location.search);
  return parseCandidateSearchParams({
    q: urlParams.get("q") ?? undefined,
    location: urlParams.get("location") ?? undefined,
    modality: urlParams.get("modality") ?? undefined,
  });
}

function CandidateSearchSheetForm({
  defaultLocation,
  onClose,
}: {
  defaultLocation: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [initial] = React.useState<CandidateSearchFilters>(
    readCurrentSearchFilters
  );
  const [query, setQuery] = React.useState(initial.q);
  const [location, setLocation] = React.useState(initial.location);
  const [modality, setModality] = React.useState<CandidateSearchModality>(
    initial.modality
  );

  const submitSearch = (nextFilters: CandidateSearchFilters) => {
    const targetUrl = buildCandidateSearchUrl(nextFilters);
    onClose();
    if (pathname === "/dashboard/candidate") {
      router.replace(targetUrl);
      return;
    }
    router.push(targetUrl);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch({ q: query, location, modality });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
          {/* Input principal de búsqueda */}
          <div className="flex h-[56px] w-full items-center gap-4 rounded-[8px] border border-input bg-background px-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
            <HugeiconsIcon
              icon={Search01Icon}
              size={20}
              strokeWidth={1.75}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar vacantes por puesto, empresa o habilidad"
              placeholder="Puesto, empresa o habilidad"
              className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[19px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Sugerencias para ti */}
          <div className="flex flex-col gap-2">
            <p className="text-[16px] font-normal leading-[22px] text-foreground">
              Sugerencias para ti
            </p>
            <div className="flex flex-col">
              {SEARCH_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() =>
                    submitSearch({ q: suggestion, location, modality })
                  }
                  className="flex min-h-[48px] w-full cursor-pointer items-center gap-4 rounded-[8px] px-4 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground"
                  />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-normal leading-[19px] text-foreground">
                    {suggestion}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={20}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="shrink-0 text-muted-foreground"
                  />
                </button>
              ))}
            </div>
          </div>

          <hr className="border-border" />

          {/* Afina tu búsqueda */}
          <div className="flex flex-col gap-4">
            <p className="text-[16px] font-normal leading-[22px] text-foreground">
              Afina tu búsqueda
            </p>

            {/* Campo Ubicación */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile-search-location"
                className="text-[14px] font-normal leading-[19px] text-foreground"
              >
                Ubicación
              </label>
              <div className="flex h-[56px] w-full items-center gap-4 rounded-[8px] border border-input bg-background px-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
                <HugeiconsIcon
                  icon={Location01Icon}
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="shrink-0 text-muted-foreground"
                />
                <input
                  id="mobile-search-location"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder={defaultLocation}
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[19px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* Chips de Modalidad */}
            <div className="flex flex-col gap-2">
              <span
                id="mobile-search-modality-label"
                className="text-[14px] font-normal leading-[19px] text-foreground"
              >
                Modalidad
              </span>
              <div
                role="radiogroup"
                aria-labelledby="mobile-search-modality-label"
                className="grid grid-cols-3 gap-2"
              >
                {SHEET_MODALITIES.map((option) => {
                  const isSelected = modality === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setModality(option.value)}
                      className={cn(
                        "flex min-h-[48px] cursor-pointer items-center justify-center rounded-[8px] border px-2 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected
                          ? "border-primary bg-muted text-primary"
                          : "border-input bg-background text-foreground hover:bg-muted/40"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Acción principal única al alcance del pulgar */}
          <button
            type="submit"
            className="mt-4 inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-4 rounded-[8px] bg-primary text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <HugeiconsIcon
              icon={Search01Icon}
              size={20}
              strokeWidth={2}
              aria-hidden="true"
            />
            <span>Buscar vacantes</span>
          </button>
        </form>
  );
}

export function CandidateSearchSheet({
  open,
  onOpenChange,
  defaultLocation = "Cancún, Quintana Roo",
}: CandidateSearchSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto w-full max-w-[430px] max-h-[calc(100dvh-72px)] overflow-y-auto rounded-t-[24px] border-t border-border bg-background px-6 pt-3 pb-[calc(24px+env(safe-area-inset-bottom,0px))] shadow-xl"
      >
        {/* Indicador de arrastre */}
        <div
          aria-hidden="true"
          className="mx-auto mb-5 h-[4px] w-[48px] shrink-0 rounded-[2px] bg-input"
        />

        {/* Cabecera: título + botón cerrar (48 × 48 px) */}
        <div className="flex items-center justify-between gap-2">
          <SheetTitle className="text-[28px] font-bold leading-[39px] tracking-normal text-foreground">
            Buscar vacantes
          </SheetTitle>

          <SheetClose
            render={
              <button
                type="button"
                aria-label="Cerrar búsqueda"
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

        {open && (
          <CandidateSearchSheetForm
            defaultLocation={defaultLocation}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
