"use client";

import * as React from "react";
import {
  DollarSign,
  MapPin,
  Gift,
  Plus,
  Check,
  Building2,
  CheckCircle2,
  Navigation,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRESET_BENEFITS,
} from "../../schemas/vacancy-wizard.schema";
import {
  getCitiesList,
  getZonesForCity,
  cleanCityName,
  resolveLocationFromCoords,
  GEO_CONFIG,
} from "@/config/geo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Step2CompensationProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  companyLocation?: string;
  companyCity?: string;
  companyZone?: string;
  companyName?: string;
}

export function Step2Compensation({
  form,
  companyLocation = "Mérida, Yucatán",
  companyCity = "Mérida",
  companyZone = "Centro Mérida",
  companyName = "Tu Empresa",
}: Step2CompensationProps) {
  const [customBenefit, setCustomBenefit] = React.useState("");
  const [isLocating, setIsLocating] = React.useState(false);
  const [isCustomCityInput, setIsCustomCityInput] = React.useState(false);
  const [customCityText, setCustomCityText] = React.useState("");
  const [isCustomZoneInput, setIsCustomZoneInput] = React.useState(false);
  const [customZoneText, setCustomZoneText] = React.useState("");

  // Clean company defaults
  const resolvedCompanyCity = cleanCityName(companyCity || companyLocation || "Mérida");
  const resolvedCompanyZone = companyZone || (resolvedCompanyCity === "Mérida" ? "Centro Mérida" : "Centro");
  const companyLocationDisplay = `${resolvedCompanyCity}, ${
    GEO_CONFIG[resolvedCompanyCity]?.state === "Quintana Roo"
      ? "Q. Roo"
      : GEO_CONFIG[resolvedCompanyCity]?.state || "Yucatán"
  }`;

  const currentCityValue = form.state?.values?.location || form.getFieldValue("location") || resolvedCompanyCity;

  const [useProfileLocation, setUseProfileLocation] = React.useState<boolean>(() => {
    const curr = form.getFieldValue("location");
    return !curr || curr === resolvedCompanyCity || curr === companyLocation;
  });

  // Sync to company profile location when loaded if profile mode is active
  React.useEffect(() => {
    if (companyCity && companyCity !== "Mérida") {
      const curr = form.getFieldValue("location");
      if (!curr || curr === "Mérida, Yucatán" || curr === "Mérida" || curr === companyLocation) {
        form.setFieldValue("location", resolvedCompanyCity);
        form.setFieldValue("zone", resolvedCompanyZone);
      }
    }
  }, [companyCity, companyZone, resolvedCompanyCity, resolvedCompanyZone, companyLocation, form]);

  // Cities grouped by state
  const cities = React.useMemo(() => getCitiesList(), []);
  const qrooCities = React.useMemo(() => cities.filter((c) => c.state === "Quintana Roo"), [cities]);
  const yucCities = React.useMemo(() => cities.filter((c) => c.state === "Yucatán"), [cities]);
  const campCities = React.useMemo(() => cities.filter((c) => c.state === "Campeche"), [cities]);
  const nacCities = React.useMemo(() => cities.filter((c) => c.state === "Nacional"), [cities]);

  // Dynamic zones for current selected city
  const availableZones = React.useMemo(() => {
    const rawZones = getZonesForCity(currentCityValue);
    const set = new Set(rawZones);
    set.add("Otra Zona");
    return Array.from(set);
  }, [currentCityValue]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddCustomBenefit = (field: any) => {
    const trimmed = customBenefit.trim();
    if (!trimmed) return;
    const current = field.state.value || [];
    if (!current.includes(trimmed)) {
      field.handleChange([...current, trimmed]);
    }
    setCustomBenefit("");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toggleBenefit = (field: any, benefit: string) => {
    const current: string[] = field.state.value || [];
    if (current.includes(benefit)) {
      field.handleChange(current.filter((b: string) => b !== benefit));
    } else {
      field.handleChange([...current, benefit]);
    }
  };

  const handleSelectProfileLocation = () => {
    setUseProfileLocation(true);
    setIsCustomCityInput(false);
    setIsCustomZoneInput(false);
    form.setFieldValue("location", resolvedCompanyCity);
    form.setFieldValue("zone", resolvedCompanyZone);
  };

  const handleSelectCustomLocation = () => {
    setUseProfileLocation(false);
  };

  const handleCitySelectChange = (newCity: string) => {
    if (newCity === "__custom__") {
      setIsCustomCityInput(true);
      setCustomCityText("");
      return;
    }

    setIsCustomCityInput(false);
    form.setFieldValue("location", newCity);

    // Update dynamic zone for the new city
    const newZones = getZonesForCity(newCity);
    const defaultZone = newZones[0] || (newCity === "Mérida" ? "Centro Mérida" : "Centro");
    form.setFieldValue("zone", defaultZone);
    setIsCustomZoneInput(false);

    if (newCity !== resolvedCompanyCity) {
      setUseProfileLocation(false);
    }
  };

  const handleCustomCityApply = () => {
    const trimmed = customCityText.trim();
    if (!trimmed) return;
    form.setFieldValue("location", trimmed);
    const newZones = getZonesForCity(trimmed);
    form.setFieldValue("zone", newZones[0] || "Centro");
    setIsCustomZoneInput(false);
    setUseProfileLocation(false);
  };

  const handleZoneSelectChange = (newZone: string) => {
    if (newZone === "Otra Zona") {
      setIsCustomZoneInput(true);
      setCustomZoneText("");
      form.setFieldValue("zone", "Otra Zona");
      return;
    }

    setIsCustomZoneInput(false);
    form.setFieldValue("zone", newZone);
  };

  const handleCustomZoneApply = () => {
    const trimmed = customZoneText.trim();
    if (!trimmed) return;
    form.setFieldValue("zone", trimmed);
  };

  const handleDetectGPS = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocalización no disponible", {
        description: "Tu navegador o dispositivo no tiene GPS activo.",
      });
      return;
    }

    setIsLocating(true);

    const onLocationSuccess = async (pos: GeolocationPosition) => {
      try {
        const { latitude, longitude } = pos.coords;
        const resolved = await resolveLocationFromCoords(latitude, longitude);
        form.setFieldValue("location", resolved.city);
        form.setFieldValue("zone", resolved.zone);
        setIsCustomCityInput(false);
        setIsCustomZoneInput(false);
        setUseProfileLocation(false);
        setIsLocating(false);
        toast.success("Ubicación GPS detectada", {
          description: `Se configuró: ${resolved.displayLocation}`,
        });
      } catch {
        setIsLocating(false);
        toast.error("No se pudo resolver la ubicación exacta", {
          description: "Selecciona la ciudad y zona de la lista.",
        });
      }
    };

    const onLocationFailure = (err: GeolocationPositionError) => {
      setIsLocating(false);
      if (err.code === err.PERMISSION_DENIED) {
        toast.error("Permiso de ubicación denegado", {
          description: "Otorga permiso de ubicación o selecciona la zona manualmente.",
        });
      } else {
        toast.error("No se pudo detectar tu ubicación", {
          description: "Selecciona tu ciudad y zona en el menú desplegable.",
        });
      }
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationFailure,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. Ubicación del Puesto */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPin className="size-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Ubicación del Puesto de Trabajo
            </span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {companyName}
          </span>
        </div>

        {/* Tarjetas de Selección de Modalidad de Ubicación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleSelectProfileLocation}
            className={cn(
              "p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer select-none",
              useProfileLocation
                ? "bg-primary/5 border-primary text-foreground shadow-xs ring-1 ring-primary/30"
                : "bg-background hover:bg-muted/40 text-muted-foreground border-border/70"
            )}
          >
            <div
              className={cn(
                "size-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                useProfileLocation
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">
                  Ubicación Principal de la Empresa
                </span>
                {useProfileLocation && (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate font-medium mt-1">
                {companyLocationDisplay} • {resolvedCompanyZone}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSelectCustomLocation}
            className={cn(
              "p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer select-none",
              !useProfileLocation
                ? "bg-primary/5 border-primary text-foreground shadow-xs ring-1 ring-primary/30"
                : "bg-background hover:bg-muted/40 text-muted-foreground border-border/70"
            )}
          >
            <div
              className={cn(
                "size-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold transition-colors",
                !useProfileLocation
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Navigation className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground">
                  Otra Sucursal o Municipio
                </span>
                {!useProfileLocation && (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate font-medium mt-1">
                Para sucursales en otra zona o municipio
              </p>
            </div>
          </button>
        </div>

        {/* Ciudad y Zona en 2 Columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
          {/* Ciudad o Municipio */}
          <form.Field name="location">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Ciudad o Municipio <span className="text-rose-500">*</span>
                  </FieldLabel>
                  {isCustomCityInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCityInput(false);
                        field.handleChange("Mérida");
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Volver a lista
                    </button>
                  )}
                </div>

                {!isCustomCityInput ? (
                  <Select
                    value={field.state.value || resolvedCompanyCity}
                    onValueChange={handleCitySelectChange}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-background border-border/70 text-sm font-semibold cursor-pointer shadow-2xs">
                      <SelectValue placeholder="Selecciona Ciudad o Municipio" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-xl max-h-72">
                      <SelectGroup>
                        <SelectLabel className="text-[11px] font-extrabold text-primary uppercase tracking-wider px-2 py-1.5">
                          Quintana Roo
                        </SelectLabel>
                        {qrooCities.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-xs font-semibold rounded-lg cursor-pointer py-2">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel className="text-[11px] font-extrabold text-primary uppercase tracking-wider px-2 py-1.5">
                          Yucatán
                        </SelectLabel>
                        {yucCities.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-xs font-semibold rounded-lg cursor-pointer py-2">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel className="text-[11px] font-extrabold text-primary uppercase tracking-wider px-2 py-1.5">
                          Campeche
                        </SelectLabel>
                        {campCities.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-xs font-semibold rounded-lg cursor-pointer py-2">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel className="text-[11px] font-extrabold text-primary uppercase tracking-wider px-2 py-1.5">
                          Nacional
                        </SelectLabel>
                        {nacCities.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-xs font-semibold rounded-lg cursor-pointer py-2">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectGroup>
                        <SelectItem value="__custom__" className="text-xs font-bold text-primary rounded-lg cursor-pointer border-t border-border/40 mt-1 py-2.5">
                          ✍️ Escribir otra ciudad...
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={customCityText}
                      onChange={(e) => setCustomCityText(e.target.value)}
                      onBlur={handleCustomCityApply}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCustomCityApply();
                        }
                      }}
                      placeholder="Escribe la ciudad o municipio..."
                      className="h-12 rounded-xl bg-background border-border/70 text-sm font-semibold shadow-2xs"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCustomCityApply}
                      className="h-12 px-5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Aplicar
                    </Button>
                  </div>
                )}

                {field.state.meta.errors?.[0] && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          {/* Zona o Área */}
          <form.Field name="zone">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => {
              const activeVal = field.state.value || availableZones[0] || "Centro";
              const isListed = availableZones.includes(activeVal);

              return (
                <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Zona / Área de Trabajo <span className="text-rose-500">*</span>
                    </FieldLabel>
                    {(isCustomZoneInput || !isListed) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomZoneInput(false);
                          field.handleChange(availableZones[0] || "Centro");
                        }}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Volver a lista
                      </button>
                    )}
                  </div>

                  {!isCustomZoneInput && isListed ? (
                    <Select
                      value={activeVal}
                      onValueChange={handleZoneSelectChange}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-background border-border/70 text-sm font-semibold cursor-pointer shadow-2xs">
                        <SelectValue placeholder="Selecciona la zona" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-xl max-h-72">
                        <SelectGroup>
                          <SelectLabel className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                            Zonas disponibles en {currentCityValue || "la ciudad"}
                          </SelectLabel>
                          {availableZones.map((z) => (
                            <SelectItem key={z} value={z} className="text-xs font-semibold rounded-lg cursor-pointer py-2">
                              {z}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={customZoneText || (!isListed ? activeVal : "")}
                        onChange={(e) => {
                          setCustomZoneText(e.target.value);
                          field.handleChange(e.target.value);
                        }}
                        placeholder="Ej. Fraccionamiento Los Álamos, Supermanzana 15..."
                        className="h-12 rounded-xl bg-background border-border/70 text-sm font-semibold shadow-2xs"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCustomZoneApply}
                        className="h-12 px-5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Aplicar
                      </Button>
                    </div>
                  )}

                  {field.state.meta.errors?.[0] && (
                    <FieldError>{field.state.meta.errors[0]}</FieldError>
                  )}
                </Field>
              );
            }}
          </form.Field>
        </div>

        {/* GPS Quick Detect Footer */}
        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleDetectGPS}
            disabled={isLocating}
            className="h-8 px-3 text-xs font-bold text-primary hover:text-primary/90 hover:bg-primary/5 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            {isLocating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Detectando GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="size-3.5" />
                <span>Detectar sucursal con GPS</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Propuesta Salarial */}
      <div className="space-y-4 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="size-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Propuesta Salarial (Pesos Mexicanos MXN)
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">
            Rango mensual neto o bruto
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Sueldo Mínimo */}
          <form.Field name="salary_min">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
                <FieldLabel htmlFor="salary_min" className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Sueldo Mínimo
                </FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                  <Input
                    id="salary_min"
                    type="number"
                    step={500}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder="10,000"
                    className="h-12 pl-9 rounded-xl bg-background border-border/70 font-mono font-bold text-base shadow-2xs"
                  />
                </div>
                {field.state.meta.errors?.[0] && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>

          {/* Sueldo Máximo */}
          <form.Field name="salary_max">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(field: any) => (
              <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2">
                <FieldLabel htmlFor="salary_max" className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Sueldo Máximo
                </FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                  <Input
                    id="salary_max"
                    type="number"
                    step={500}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder="14,000"
                    className="h-12 pl-9 rounded-xl bg-background border-border/70 font-mono font-bold text-base shadow-2xs"
                  />
                </div>
                {field.state.meta.errors?.[0] && (
                  <FieldError>{field.state.meta.errors[0]}</FieldError>
                )}
              </Field>
            )}
          </form.Field>
        </div>

        {/* Frecuencia de Pago: Botones Segmentados */}
        <form.Field name="payment_frequency">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(field: any) => (
            <Field data-invalid={Boolean(field.state.meta.errors?.length)} className="space-y-2 pt-1">
              <FieldLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                Frecuencia de Pago
              </FieldLabel>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "semanal", label: "Semanal" },
                  { value: "quincenal", label: "Quincenal" },
                  { value: "mensual", label: "Mensual" },
                ].map((freq) => {
                  const isSelected = field.state.value === freq.value;
                  return (
                    <button
                      key={freq.value}
                      type="button"
                      onClick={() => field.handleChange(freq.value)}
                      className={cn(
                        "h-12 rounded-xl font-bold text-sm transition-all border cursor-pointer select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background hover:bg-muted text-muted-foreground border-border/70"
                      )}
                    >
                      {freq.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}
        </form.Field>
      </div>

      {/* 3. Prestaciones y Beneficios */}
      <form.Field name="benefits">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(field: any) => {
          const selectedBenefits: string[] = field.state.value || [];

          return (
            <Field className="space-y-4 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Gift className="size-3.5" />
                  </div>
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Prestaciones y Beneficios ({selectedBenefits.length} seleccionados)
                  </FieldLabel>
                </div>
              </div>
              <FieldDescription className="text-xs text-muted-foreground">
                Haz clic en las prestaciones que ofrece tu empresa para destacarlas en el perfil de la oferta:
              </FieldDescription>

              {/* Matriz de Chips de Beneficios */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {PRESET_BENEFITS.map((benefit) => {
                  const isChecked = selectedBenefits.includes(benefit);
                  return (
                    <button
                      key={benefit}
                      type="button"
                      onClick={() => toggleBenefit(field, benefit)}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer select-none shadow-2xs",
                        isChecked
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/20"
                          : "bg-background hover:bg-muted/60 text-foreground border-border/70"
                      )}
                    >
                      {isChecked && <Check className="size-4 stroke-[3] text-emerald-600 dark:text-emerald-400" />}
                      <span>{benefit}</span>
                    </button>
                  );
                })}
              </div>

              {/* Agregar Beneficio Personalizado */}
              <div className="flex gap-2.5 pt-2">
                <Input
                  value={customBenefit}
                  onChange={(e) => setCustomBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomBenefit(field);
                    }
                  }}
                  placeholder="Escribe otro beneficio adicional y presiona Enter..."
                  className="h-11 rounded-xl bg-background border-border/70 text-xs font-medium shadow-2xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddCustomBenefit(field)}
                  disabled={!customBenefit.trim()}
                  className="h-11 px-5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  <Plus className="size-4 mr-1" />
                  <span>Agregar</span>
                </Button>
              </div>
            </Field>
          );
        }}
      </form.Field>
    </div>
  );
}
