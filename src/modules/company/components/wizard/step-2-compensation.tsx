"use client";

import * as React from "react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Check, Plus } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Field, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRESET_BENEFITS,
  type VacancyWizardValues,
} from "../../schemas/vacancy-wizard.schema";
import { cleanCityName, getCitiesList, getZonesForCity } from "@/config/geo";
import { cn } from "@/lib/utils";

interface Step2CompensationProps {
  form: UseFormReturn<VacancyWizardValues>;
  companyLocation?: string;
  companyCity?: string;
  companyZone?: string;
  companyName?: string;
}

const FEATURED_BENEFITS: { value: string; label: string }[] = [
  {
    value: "Prestaciones de Ley (IMSS, Infonavit, Aguinaldo)",
    label: "Prestaciones de ley",
  },
  { value: "Uniformes incluidos", label: "Uniformes incluidos" },
  { value: "Vales de despensa", label: "Vales de despensa" },
];

export function Step2Compensation({
  form,
  companyLocation = "Mérida, Yucatán",
  companyCity = "Mérida",
  companyZone = "Centro Mérida",
}: Step2CompensationProps) {
  const [showAllBenefits, setShowAllBenefits] = React.useState(false);
  const [customBenefit, setCustomBenefit] = React.useState("");

  const resolvedCompanyLocation = companyLocation || "Mérida, Yucatán";
  const resolvedCompanyCity = cleanCityName(
    companyCity || resolvedCompanyLocation || "Mérida"
  );
  const resolvedCompanyZone = companyZone || "Centro Mérida";

  const [currentLocation, currentZone] = useWatch({
    control: form.control,
    name: ["location", "zone"],
  });

  const matchesCompanyLocation = React.useMemo(() => {
    const loc = (currentLocation || "").trim().toLowerCase();
    const zone = (currentZone || "").trim().toLowerCase();
    const compLoc = resolvedCompanyLocation.trim().toLowerCase();
    const compCity = resolvedCompanyCity.trim().toLowerCase();
    const compZone = resolvedCompanyZone.trim().toLowerCase();
    return (loc === compLoc || loc === compCity) && zone === compZone;
  }, [
    currentLocation,
    currentZone,
    resolvedCompanyLocation,
    resolvedCompanyCity,
    resolvedCompanyZone,
  ]);

  const [locationMode, setLocationMode] = React.useState<"company" | "other">(
    () => (matchesCompanyLocation || !currentLocation ? "company" : "other")
  );
  const [isCustomZone, setIsCustomZone] = React.useState(false);

  React.useEffect(() => {
    if (locationMode === "company") {
      if (currentLocation !== resolvedCompanyLocation) {
        form.setValue("location", resolvedCompanyLocation);
      }
      if (currentZone !== resolvedCompanyZone) {
        form.setValue("zone", resolvedCompanyZone);
      }
    }
  }, [
    locationMode,
    resolvedCompanyLocation,
    resolvedCompanyZone,
    currentLocation,
    currentZone,
    form,
  ]);

  const citiesList = React.useMemo(() => getCitiesList(), []);

  const baseZones = React.useMemo(() => {
    const cityForZones = cleanCityName(currentLocation || resolvedCompanyCity);
    const list = new Set<string>(getZonesForCity(cityForZones));
    if (locationMode === "company" && resolvedCompanyZone) {
      list.add(resolvedCompanyZone);
    }
    return Array.from(list);
  }, [currentLocation, locationMode, resolvedCompanyCity, resolvedCompanyZone]);

  const zoneOptions = React.useMemo(() => {
    const list = new Set<string>(baseZones);
    if (currentZone && currentZone !== "Otra Zona" && !isCustomZone) {
      list.add(currentZone);
    }
    list.add("Otra Zona");
    return Array.from(list);
  }, [baseZones, currentZone, isCustomZone]);

  const handleSelectLocationMode = (mode: "company" | "other") => {
    setLocationMode(mode);
    setIsCustomZone(false);
    if (mode === "company") {
      form.setValue("location", resolvedCompanyLocation, {
        shouldValidate: true,
      });
      form.setValue("zone", resolvedCompanyZone, { shouldValidate: true });
    }
  };

  const handleCityChange = (
    nextCity: string,
    onCityChange: (val: string) => void
  ) => {
    onCityChange(nextCity);
    const cleaned = cleanCityName(nextCity);
    const nextCityZones = getZonesForCity(cleaned);
    const existingZone = form.getValues("zone");
    if (
      existingZone &&
      !isCustomZone &&
      nextCityZones.length > 0 &&
      !nextCityZones.includes(existingZone)
    ) {
      form.setValue("zone", nextCityZones[0], { shouldValidate: true });
    }
  };

  const extraBenefits = React.useMemo(
    () =>
      PRESET_BENEFITS.filter(
        (b) => !FEATURED_BENEFITS.some((fb) => fb.value === b)
      ),
    []
  );

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="text-[20px] font-semibold leading-[28px] tracking-[-0.015em] text-foreground">
          Ubicación y condiciones
        </h2>
        <p className="text-[13px] font-normal leading-[18px] text-muted-foreground">
          Indica dónde se trabaja y qué ofrece la empresa.
        </p>
      </div>

      {/* Ubicación del puesto */}
      <div className="flex flex-col gap-[8px]">
        <span className="text-[14px] font-medium leading-[20px] text-foreground">
          Ubicación del puesto
        </span>
        <div className="flex flex-wrap items-center gap-[16px]">
          <button
            type="button"
            onClick={() => handleSelectLocationMode("company")}
            className="inline-flex items-center gap-[8px] text-[14px] font-normal text-foreground cursor-pointer"
          >
            <span
              className={cn(
                "size-[16px] rounded-full border flex items-center justify-center transition-colors",
                locationMode === "company"
                  ? "border-link"
                  : "border-muted-foreground/60"
              )}
            >
              {locationMode === "company" && (
                <span className="size-[8px] rounded-full bg-link" />
              )}
            </span>
            <span>Usar la de la empresa</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectLocationMode("other")}
            className="inline-flex items-center gap-[8px] text-[14px] font-normal text-foreground cursor-pointer"
          >
            <span
              className={cn(
                "size-[16px] rounded-full border flex items-center justify-center transition-colors",
                locationMode === "other"
                  ? "border-link"
                  : "border-muted-foreground/60"
              )}
            >
              {locationMode === "other" && (
                <span className="size-[8px] rounded-full bg-link" />
              )}
            </span>
            <span>Otra ubicación</span>
          </button>
        </div>
      </div>

      {/* Ciudad o municipio y Zona de trabajo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] items-start">
        <Controller
          control={form.control}
          name="location"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <label
                htmlFor="vacancy-location"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Ciudad o municipio
              </label>
              <Input
                id="vacancy-location"
                list="kanpro-cities-list"
                value={field.value || ""}
                readOnly={locationMode === "company"}
                onChange={(e) => {
                  if (locationMode === "company") setLocationMode("other");
                  handleCityChange(e.target.value, field.onChange);
                }}
                placeholder="Ej. Mérida, Yucatán"
                className={cn(
                  "h-[44px] rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal",
                  locationMode === "company" && "opacity-80 cursor-default"
                )}
              />
              <datalist id="kanpro-cities-list">
                {citiesList.map((city) => (
                  <option key={city.name} value={city.label} />
                ))}
              </datalist>
              {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="zone"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Zona de trabajo
              </span>
              <Select
                disabled={locationMode === "company"}
                value={
                  isCustomZone
                    ? "Otra Zona"
                    : field.value || resolvedCompanyZone
                }
                onValueChange={(val) => {
                  if (!val) return;
                  if (val === "Otra Zona") {
                    setLocationMode("other");
                    setIsCustomZone(true);
                    field.onChange("");
                    return;
                  }
                  setIsCustomZone(false);
                  if (locationMode === "company" && val !== resolvedCompanyZone) {
                    setLocationMode("other");
                  }
                  field.onChange(val);
                }}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Selecciona zona" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg max-h-[260px]">
                  {zoneOptions.map((z) => (
                    <SelectItem
                      key={z}
                      value={z}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                    >
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isCustomZone && (
                <Input
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="Escribe el nombre de la zona o colonia"
                  className="h-[44px] rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal mt-[4px]"
                />
              )}

              {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />
      </div>

      {/* Sueldo mínimo, Sueldo máximo, Frecuencia de pago */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px]">
        <Controller
          control={form.control}
          name="salary_min"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <label
                htmlFor="vacancy-salary-min"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Sueldo mínimo (opcional)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-[12px] text-[14px] text-muted-foreground pointer-events-none">
                  $
                </span>
                <Input
                  id="vacancy-salary-min"
                  type="number"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? null : Number(val));
                  }}
                  placeholder="5500"
                  className="h-[44px] rounded-[8px] border-input bg-card pl-[24px] pr-[48px] text-[14px] font-normal tabular-nums"
                />
                <span className="absolute right-[12px] text-[12px] font-medium text-muted-foreground pointer-events-none">
                  MXN
                </span>
              </div>
              {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="salary_max"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={Boolean(fieldState.error)}
              className="gap-[6px]"
            >
              <label
                htmlFor="vacancy-salary-max"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Sueldo máximo (opcional)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-[12px] text-[14px] text-muted-foreground pointer-events-none">
                  $
                </span>
                <Input
                  id="vacancy-salary-max"
                  type="number"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? null : Number(val));
                  }}
                  placeholder="6500"
                  className="h-[44px] rounded-[8px] border-input bg-card pl-[24px] pr-[48px] text-[14px] font-normal tabular-nums"
                />
                <span className="absolute right-[12px] text-[12px] font-medium text-muted-foreground pointer-events-none">
                  MXN
                </span>
              </div>
              {fieldState.error?.message && (
                <FieldError>{fieldState.error.message}</FieldError>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="payment_frequency"
          render={({ field }) => (
            <Field className="gap-[6px]">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Frecuencia de pago
              </span>
              <Select
                value={field.value || "quincenal"}
                onValueChange={(val) => field.onChange(val)}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Frecuencia" />
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  <SelectItem
                    value="semanal"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Semanal
                  </SelectItem>
                  <SelectItem
                    value="quincenal"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Quincenal
                  </SelectItem>
                  <SelectItem
                    value="mensual"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Mensual
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </div>

      {/* Prestaciones (opcional) */}
      <Controller
        control={form.control}
        name="benefits"
        render={({ field }) => {
          const selected: string[] = Array.isArray(field.value)
            ? field.value
            : [];

          const toggleBenefit = (value: string) => {
            if (selected.includes(value)) {
              field.onChange(selected.filter((item) => item !== value));
            } else {
              field.onChange([...selected, value]);
            }
          };

          const addCustom = () => {
            const trimmed = customBenefit.trim();
            if (!trimmed) return;
            if (!selected.includes(trimmed)) {
              field.onChange([...selected, trimmed]);
            }
            setCustomBenefit("");
          };

          return (
            <div className="flex flex-col gap-[10px]">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Prestaciones (opcional)
              </span>

              <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[10px]">
                {FEATURED_BENEFITS.map((item) => {
                  const checked = selected.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => toggleBenefit(item.value)}
                      className="inline-flex items-center gap-[8px] text-[14px] font-normal text-foreground cursor-pointer"
                    >
                      <span
                        className={cn(
                          "size-[16px] rounded-[4px] border flex items-center justify-center transition-colors shrink-0",
                          checked
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input bg-card"
                        )}
                      >
                        {checked && <Check className="size-[11px] stroke-[3]" />}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {showAllBenefits && (
                <div className="flex flex-col gap-[10px] pt-[6px]">
                  <div className="flex flex-wrap gap-x-[16px] gap-y-[8px]">
                    {extraBenefits.map((benefit) => {
                      const checked = selected.includes(benefit);
                      return (
                        <button
                          key={benefit}
                          type="button"
                          onClick={() => toggleBenefit(benefit)}
                          className="inline-flex items-center gap-[8px] text-[13px] font-normal text-foreground cursor-pointer"
                        >
                          <span
                            className={cn(
                              "size-[16px] rounded-[4px] border flex items-center justify-center transition-colors shrink-0",
                              checked
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-input bg-card"
                            )}
                          >
                            {checked && (
                              <Check className="size-[11px] stroke-[3]" />
                            )}
                          </span>
                          <span>{benefit}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-[8px] max-w-[360px]">
                    <Input
                      value={customBenefit}
                      onChange={(e) => setCustomBenefit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustom();
                        }
                      }}
                      placeholder="Agregar otra prestación..."
                      className="h-[38px] rounded-[8px] border-input bg-card text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={addCustom}
                      className="h-[38px] px-[12px] rounded-[8px] border border-control-border bg-card text-[13px] font-medium text-foreground hover:bg-muted/60 inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="size-[14px]" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => setShowAllBenefits((prev) => !prev)}
                  className="text-[13px] font-medium text-link hover:underline cursor-pointer"
                >
                  {showAllBenefits
                    ? "Ocultar prestaciones adicionales"
                    : "Ver todas las prestaciones"}
                </button>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
