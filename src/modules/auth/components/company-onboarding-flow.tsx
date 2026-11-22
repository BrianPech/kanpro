"use client";

import React, { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Gps01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { ChevronLeft, Loader2, Search } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Onboarding } from "@/components/ui/onboarding";
import {
  updateOwnerNameSchema,
  type UpdateOwnerNameInput,
} from "@/modules/company/schemas/tenant.schema";
import {
  createCompanyAction,
  updateOwnerPersonalNameAction,
} from "@/modules/company/actions/tenant-actions";
import {
  companyOnboardingWorkspaceSchema,
  type CompanyOnboardingWorkspaceValues,
} from "../schemas/onboarding.schema";

const OnboardingLeafletMap = dynamic(
  () =>
    import("./onboarding-leaflet-map").then((mod) => mod.OnboardingLeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[218px] w-full rounded-[12px] border border-border bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
        Cargando mapa...
      </div>
    ),
  }
);

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
  };
}

function formatLocationLabels(
  address: NominatimResult["address"],
  fallbackDisplay: string
): { summary: string; detail: string } {
  const city =
    address?.city ||
    address?.town ||
    address?.village ||
    address?.suburb ||
    "";
  const state = address?.state || "";
  const street = [address?.road, address?.house_number]
    .filter(Boolean)
    .join(" ");
  const colony = address?.suburb || address?.neighbourhood || "";

  const summary =
    [city, state].filter(Boolean).join(", ") ||
    fallbackDisplay.split(",").slice(0, 2).join(",").trim();
  const detail =
    [street, colony, city].filter(Boolean).join(", ") || fallbackDisplay;

  return { summary, detail };
}

interface CompanyOnboardingFlowProps {
  initialStep?: 1 | 2;
  initialFullName?: string;
}

export function CompanyOnboardingFlow({
  initialStep = 1,
  initialFullName = "",
}: CompanyOnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [addressDetail, setAddressDetail] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);

  const ownerForm = useForm<UpdateOwnerNameInput>({
    resolver: zodResolver(updateOwnerNameSchema),
    defaultValues: {
      fullName: initialFullName,
    },
    mode: "onTouched",
  });

  const companyForm = useForm<CompanyOnboardingWorkspaceValues>({
    resolver: zodResolver(companyOnboardingWorkspaceSchema),
    defaultValues: {
      company_name: "",
      location: "",
      leave_approval_mode: "single_step",
    },
    mode: "onChange",
  });

  const companyNameValue = companyForm.watch("company_name");
  const locationValue = companyForm.watch("location");

  const applyCoordinates = useCallback(
    async (lat: number, lng: number) => {
      setCoordinates([lat, lng]);
      const fallbackCoords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      companyForm.setValue("location", fallbackCoords, {
        shouldValidate: true,
      });
      setAddressDetail("Obteniendo dirección...");

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`
        );
        if (!res.ok) throw new Error("Reverse geocoding failed");
        const data: NominatimResult = await res.json();
        const { summary, detail } = formatLocationLabels(
          data.address,
          data.display_name || fallbackCoords
        );
        companyForm.setValue("location", summary, { shouldValidate: true });
        setAddressDetail(detail);
      } catch {
        setAddressDetail(`Coordenadas: ${fallbackCoords}`);
      }
    },
    [companyForm]
  );

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        void applyCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      () => {
        setIsLocating(false);
        toast.error("No se pudo obtener tu ubicación", {
          description:
            "Verifica los permisos de ubicación o busca la dirección manualmente.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchAddress = async () => {
    const query = searchQuery.trim();
    if (query.length < 3) return;

    try {
      setIsSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=mx&accept-language=es&q=${encodeURIComponent(
          query
        )}`
      );
      if (!res.ok) throw new Error("Search failed");
      const results: NominatimResult[] = await res.json();
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("No se encontraron direcciones para esa búsqueda");
      }
    } catch {
      toast.error("Error al buscar la dirección");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: NominatimResult) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    const { summary, detail } = formatLocationLabels(
      item.address,
      item.display_name
    );

    setCoordinates([lat, lng]);
    companyForm.setValue("location", summary, { shouldValidate: true });
    setAddressDetail(detail);
    setSearchResults([]);
    setShowAddressSearch(false);
  };

  const onOwnerSubmit: SubmitHandler<UpdateOwnerNameInput> = async (data) => {
    try {
      setIsSavingName(true);
      const res = await updateOwnerPersonalNameAction({
        fullName: data.fullName,
      });

      if (!res.success) {
        toast.error("No se pudo guardar tu nombre", {
          description: res.error,
        });
        return;
      }

      setCurrentStep(2);
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al guardar tu nombre.";
      toast.error("Error en onboarding", { description: msg });
    } finally {
      setIsSavingName(false);
    }
  };

  const onCompanySubmit: SubmitHandler<
    CompanyOnboardingWorkspaceValues
  > = async (data) => {
    try {
      setIsCreatingCompany(true);
      const res = await createCompanyAction({
        company_name: data.company_name,
        location: data.location,
        address_details: addressDetail || undefined,
        industry: "General",
        leave_approval_mode: data.leave_approval_mode || "single_step",
      });

      if (!res.success) {
        toast.error("No se pudo registrar la empresa", {
          description: res.error,
        });
        return;
      }

      toast.success("¡Grupo de trabajo creado!", {
        description: `Bienvenido a ${res.data.companyName}.`,
      });

      router.push("/dashboard/company");
      router.refresh();
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al registrar tu empresa.";
      toast.error("Error al crear empresa", { description: msg });
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const canSubmitCompany =
    companyNameValue.trim().length >= 2 && locationValue.trim().length >= 3;

  return (
    <Onboarding
      totalSteps={2}
      value={currentStep}
      onValueChange={setCurrentStep}
      className="w-full border-0 bg-transparent rounded-none p-0 shadow-none"
    >
      {/* ── PASO 1: Nombre del Dueño / Titular ── */}
      <Onboarding.Step step={1}>
        <div className="w-full max-w-[432px] mx-auto flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <p className="text-[14px] font-semibold leading-[20px] text-link">
              Paso 1 de 2
            </p>
            <h1 className="text-[28px] sm:text-[32px] font-semibold leading-[40px] tracking-[-0.8px] text-foreground">
              Completa tu perfil
            </h1>
          </div>

          <form
            onSubmit={ownerForm.handleSubmit(onOwnerSubmit)}
            className="w-full flex flex-col gap-6"
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="fullName"
                className="text-[14px] font-semibold leading-[20px] text-foreground"
              >
                Nombre completo del dueño
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ej. Mariana Ruiz"
                autoComplete="name"
                aria-invalid={Boolean(ownerForm.formState.errors.fullName)}
                className="h-[52px] rounded-[8px] border-input bg-card px-[14px] text-[16px] leading-[24px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                {...ownerForm.register("fullName")}
              />
              {ownerForm.formState.errors.fullName?.message && (
                <p className="text-xs font-semibold text-destructive">
                  {ownerForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSavingName}
              className="w-full h-[43px] rounded-[8px] bg-primary text-primary-foreground hover:bg-primary-hover text-[14px] font-semibold leading-[19px] cursor-pointer gap-2 transition-colors"
            >
              {isSavingName ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Continuar</span>
              )}
            </Button>
          </form>
        </div>
      </Onboarding.Step>

      {/* ── PASO 2: Datos de la empresa y ubicación en mapa ── */}
      <Onboarding.Step step={2}>
        <div className="w-full max-w-[560px] mx-auto flex flex-col gap-5">
          <div className="flex flex-col items-center text-center gap-1.5">
            <p className="text-[14px] font-semibold leading-[20px] text-link">
              Paso 2 de 2
            </p>
            <h1 className="text-[28px] sm:text-[32px] font-semibold leading-[40px] tracking-[-0.8px] text-foreground">
              Cuéntanos sobre tu empresa
            </h1>
          </div>

          <form
            onSubmit={companyForm.handleSubmit(onCompanySubmit)}
            className="w-full flex flex-col gap-5"
            noValidate
          >
            {/* Nombre de la empresa */}
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="company_name"
                className="text-[14px] font-semibold leading-[20px] text-foreground"
              >
                Nombre de la empresa
              </Label>
              <Input
                id="company_name"
                type="text"
                placeholder="Ej. Hotel Tierra Maya"
                aria-invalid={Boolean(companyForm.formState.errors.company_name)}
                className="h-[48px] rounded-[8px] border-input bg-card px-[14px] text-[16px] leading-[24px] text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
                {...companyForm.register("company_name")}
              />
              {companyForm.formState.errors.company_name?.message && (
                <p className="text-xs font-semibold text-destructive">
                  {companyForm.formState.errors.company_name.message}
                </p>
              )}
            </div>

            {/* Ubicación de la empresa */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[16px] font-semibold leading-[24px] text-foreground">
                  Ubicación de la empresa
                </span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3 sm:w-[224px] rounded-[8px] border border-control-border bg-card text-[14px] font-semibold leading-[20px] text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isLocating ? (
                    <Loader2 className="size-[18px] animate-spin text-link" />
                  ) : (
                    <HugeiconsIcon
                      icon={Gps01Icon}
                      size={18}
                      strokeWidth={1.75}
                      className="text-link shrink-0"
                    />
                  )}
                  <span>
                    {isLocating ? "Ubicando..." : "Usar mi ubicación actual"}
                  </span>
                </button>
              </div>

              <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                Usaremos la ubicación de tu dispositivo para colocar el pin.
              </p>

              {/* Mapa Leaflet + OpenStreetMap */}
              <OnboardingLeafletMap
                coordinates={coordinates}
                onSelectCoordinates={(lat, lng) => {
                  void applyCoordinates(lat, lng);
                }}
              />

              {/* Resultado de ubicación */}
              <div className="bg-muted/70 dark:bg-[#262626] rounded-[8px] p-3 flex items-center gap-3">
                <HugeiconsIcon
                  icon={Location01Icon}
                  size={20}
                  strokeWidth={1.75}
                  className={
                    locationValue
                      ? "text-link shrink-0"
                      : "text-muted-foreground shrink-0"
                  }
                />
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <p className="text-[14px] font-semibold leading-[20px] text-foreground truncate">
                    {locationValue || "Ubicación por definir"}
                  </p>
                  <p className="text-[13px] font-normal leading-[18px] text-muted-foreground truncate">
                    {addressDetail ||
                      "Usa tu ubicación o busca la dirección de la empresa."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressSearch((prev) => !prev)}
                  className="min-h-[44px] inline-flex items-center justify-end text-[13px] font-semibold leading-[18px] text-link hover:underline underline-offset-4 shrink-0 cursor-pointer"
                >
                  Buscar dirección
                </button>
              </div>

              {/* Buscador manual de dirección */}
              {showAddressSearch && (
                <div className="flex flex-col gap-2 rounded-[8px] border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSearchAddress();
                        }
                      }}
                      placeholder="Ej. Calle 60 Centro, Mérida, Yucatán"
                      className="h-10 rounded-[8px] border-input bg-background px-3 text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleSearchAddress()}
                      disabled={isSearching || searchQuery.trim().length < 3}
                      className="h-10 px-3 rounded-[8px] shrink-0 cursor-pointer"
                    >
                      {isSearching ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Search className="size-4" />
                      )}
                      <span>Buscar</span>
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <ul className="divide-y divide-border rounded-[6px] border border-border overflow-hidden">
                      {searchResults.map((item) => (
                        <li key={item.place_id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSearchResult(item)}
                            className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            {item.display_name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Regla inicial: flujo de aprobación de vacaciones */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-[14px] font-medium leading-[20px] text-foreground">
                  Aprobación de vacaciones
                </Label>
                <span className="text-xs text-muted-foreground">
                  Editable luego en Reglas de mi empresa
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label="Aprobación de vacaciones"
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {[
                  {
                    value: "single_step" as const,
                    title: "1 paso (RH directo)",
                    desc: "Recomendado: aprobación inmediata por RH.",
                  },
                  {
                    value: "two_step" as const,
                    title: "2 pasos (Líder → RH)",
                    desc: "Requiere Vo.Bo. previo del líder de área.",
                  },
                ].map((opt) => {
                  const selected =
                    (companyForm.watch("leave_approval_mode") || "single_step") ===
                    opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        companyForm.setValue("leave_approval_mode", opt.value, {
                          shouldDirty: true,
                        })
                      }
                      className={
                        selected
                          ? "text-left rounded-[8px] border border-primary bg-primary/5 p-3 ring-1 ring-primary/30 cursor-pointer transition-colors"
                          : "text-left rounded-[8px] border border-border bg-card p-3 hover:border-border/80 cursor-pointer transition-colors"
                      }
                    >
                      <div className="text-[13px] font-semibold text-foreground">
                        {opt.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón Continuar */}
            <Button
              type="submit"
              disabled={!canSubmitCompany || isCreatingCompany}
              className={
                canSubmitCompany
                  ? "w-full h-[43px] rounded-[8px] bg-primary text-primary-foreground hover:bg-primary-hover text-[14px] font-semibold leading-[19px] cursor-pointer gap-2 transition-colors"
                  : "w-full h-[43px] rounded-[8px] bg-muted text-muted-foreground text-[14px] font-semibold leading-[19px] opacity-100"
              }
            >
              {isCreatingCompany ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creando empresa...</span>
                </>
              ) : (
                <span>Continuar</span>
              )}
            </Button>

            {/* Volver al paso 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-1.5 text-[14px] font-semibold leading-[20px] text-link hover:underline underline-offset-4 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4 shrink-0" />
              <span>Volver</span>
            </button>
          </form>
        </div>
      </Onboarding.Step>
    </Onboarding>
  );
}
