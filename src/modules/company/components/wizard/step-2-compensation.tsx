"use client";

import * as React from "react";
import {
  DollarSign,
  MapPin,
  Gift,
  Plus,
  X,
  Check,
  Building2,
  CheckCircle2,
  Navigation,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  type VacancyWizardValues,
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
  const currentZoneValue = form.state?.values?.zone || form.getFieldValue("zone") || resolvedCompanyZone;

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
        setUseProfileLocation(true);
      }
    }
  }, [companyCity, companyZone, resolvedCompanyCity, resolvedCompanyZone, companyLocation]);

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

  const formatMXN = (val: number | null | undefined) => {
    if (val == null || isNaN(val)) return "$0 MXN";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleAddCustomBenefit = (field: any) => {
    const trimmed = customBenefit.trim();
    if (!trimmed) return;
    const current = field.state.value || [];
    if (!current.includes(trimmed)) {
      field.handleChange([...current, trimmed]);
    }
    setCustomBenefit("");
  };

  const toggleBenefit = (field: any, benefit: string) => {
    const current: string[] = field.state.value || [];
    if (current.includes(benefit)) {
      field.handleChange(current.filter((b) => b !== benefit));
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
      } catch (e) {
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
    <div className="space-y-6">
      {/* 1. Company Profile Location Integration Banner */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Ubicación del Puesto de Trabajo
            </span>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground">
            {companyName}
          </span>
        </div>

        {/* Location mode selector pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleSelectProfileLocation}
            className={cn(
              "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none",
              useProfileLocation
                ? "bg-primary/5 border-primary text-foreground shadow-2xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
            )}
          >
            <div
              className={cn(
                "size-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                useProfileLocation
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Building2 className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  Ubicación de tu Perfil
                </span>
                {useProfileLocation && (
                  <CheckCircle2 className="size-3.5 text-primary" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-semibold mt-0.5">
                {companyLocationDisplay} • {resolvedCompanyZone}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSelectCustomLocation}
            className={cn(
              "p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none",
              !useProfileLocation
                ? "bg-primary/5 border-primary text-foreground shadow-2xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
            )}
          >
            <div
              className={cn(
                "size-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                !useProfileLocation
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Navigation className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">
                  Otra Sucursal o Municipio
                </span>
                {!useProfileLocation && (
                  <CheckCircle2 className="size-3.5 text-primary" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
                Para sucursales en otra zona o ciudad
              </p>
            </div>
          </button>
        </div>

        {/* Location & Dynamic Zone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Location / City Selector */}
          <form.Field
            name="location"
            children={(field: any) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ciudad o Municipio <span className="text-rose-500">*</span>
                  </Label>
                  {isCustomCityInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCityInput(false);
                        field.handleChange("Mérida");
                      }}
                      className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Volver a lista de ciudades
                    </button>
                  )}
                </div>

                {!isCustomCityInput ? (
                  <Select
                    value={field.state.value || resolvedCompanyCity}
                    onValueChange={handleCitySelectChange}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 text-xs sm:text-sm font-semibold cursor-pointer">
                      <SelectValue placeholder="Selecciona Ciudad o Municipio" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-xl max-h-72">
                      <SelectGroup>
                        <SelectLabel className="text-[11px] font-extrabold text-primary uppercase tracking-wider px-2 py-1">
                          Quintana Roo
                        </SelectLabel>
                        {qrooCities.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-xs font-semibold rounded-lg cursor-pointer">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel className="text-[11px] font-extrabold text-primary uppercase tracking-wider px-2 py-1">
                          Yucatán
                        </SelectLabel>
                        {yucCities.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-xs font-semibold rounded-lg cursor-pointer">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel className="text-[11px] font-extrabold text-primary uppercase tracking-wider px-2 py-1">
                          Campeche
                        </SelectLabel>
                        {campCities.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-xs font-semibold rounded-lg cursor-pointer">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel className="text-[11px] font-extrabold text-primary uppercase tracking-wider px-2 py-1">
                          Nacional
                        </SelectLabel>
                        {nacCities.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-xs font-semibold rounded-lg cursor-pointer">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      <SelectGroup>
                        <SelectItem value="__custom__" className="text-xs font-bold text-primary rounded-lg cursor-pointer border-t border-border/40 mt-1">
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
                      className="h-11 rounded-xl bg-card border-border/60 text-sm font-semibold"
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCustomCityApply}
                      className="h-11 px-4 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Aplicar
                    </Button>
                  </div>
                )}

                {field.state.meta.errors?.[0] && (
                  <p className="text-xs font-semibold text-rose-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          />

          {/* Dynamic Zone Selector */}
          <form.Field
            name="zone"
            children={(field: any) => {
              const activeVal = field.state.value || availableZones[0] || "Centro";
              const isListed = availableZones.includes(activeVal);

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Zona / Área de Trabajo <span className="text-rose-500">*</span>
                    </Label>
                    {(isCustomZoneInput || !isListed) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomZoneInput(false);
                          field.handleChange(availableZones[0] || "Centro");
                        }}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Volver a lista de zonas
                      </button>
                    )}
                  </div>

                  {!isCustomZoneInput && isListed ? (
                    <Select
                      value={activeVal}
                      onValueChange={handleZoneSelectChange}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 text-xs sm:text-sm font-semibold cursor-pointer">
                        <SelectValue placeholder="Selecciona la zona" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-xl max-h-64">
                        <SelectGroup>
                          <SelectLabel className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider px-2 py-1">
                            Zonas en {currentCityValue || "la ciudad"}
                          </SelectLabel>
                          {availableZones.map((z) => (
                            <SelectItem key={z} value={z} className="text-xs font-semibold rounded-lg cursor-pointer">
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
                        className="h-11 rounded-xl bg-card border-border/60 text-sm font-semibold"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCustomZoneApply}
                        className="h-11 px-4 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Aplicar
                      </Button>
                    </div>
                  )}

                  {field.state.meta.errors?.[0] && (
                    <p className="text-xs font-semibold text-rose-500">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              );
            }}
          />
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


      {/* 2. Salary & Payment Frequency Section */}
      <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Propuesta Salarial (Pesos Mexicanos MXN)
            </span>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground">
            Neto o Bruto mensual
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Salary Min */}
          <form.Field
            name="salary_min"
            children={(field: any) => (
              <div className="space-y-1.5">
                <Label htmlFor="salary_min" className="text-xs font-semibold text-muted-foreground">
                  Sueldo Mínimo
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                  <Input
                    id="salary_min"
                    type="number"
                    step={500}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder="10,000"
                    className="h-11 pl-8 rounded-xl bg-card border-border/60 font-mono font-bold text-sm"
                  />
                </div>
              </div>
            )}
          />

          {/* Salary Max */}
          <form.Field
            name="salary_max"
            children={(field: any) => (
              <div className="space-y-1.5">
                <Label htmlFor="salary_max" className="text-xs font-semibold text-muted-foreground">
                  Sueldo Máximo
                </Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">$</span>
                  <Input
                    id="salary_max"
                    type="number"
                    step={500}
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                    placeholder="14,000"
                    className="h-11 pl-8 rounded-xl bg-card border-border/60 font-mono font-bold text-sm"
                  />
                </div>
              </div>
            )}
          />
        </div>

        {/* Payment Frequency Pills */}
        <form.Field
          name="payment_frequency"
          children={(field: any) => (
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Frecuencia de Pago
              </Label>
              <div className="grid grid-cols-3 gap-2">
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
                        "h-10 rounded-xl font-bold text-xs transition-all border cursor-pointer select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card hover:bg-muted text-muted-foreground border-border/60"
                      )}
                    >
                      {freq.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        />
      </div>

      {/* 3. Benefits & Perks Interactive Badges */}
      <form.Field
        name="benefits"
        children={(field: any) => {
          const selectedBenefits: string[] = field.state.value || [];

          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="size-4 text-primary" />
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Prestaciones y Beneficios ({selectedBenefits.length} seleccionados)
                  </Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Haz clic en las prestaciones que ofrece tu empresa para destacarlas en el perfil de la oferta:
              </p>

              {/* Preset Badges Grid */}
              <div className="flex flex-wrap gap-2 pt-1">
                {PRESET_BENEFITS.map((benefit) => {
                  const isChecked = selectedBenefits.includes(benefit);
                  return (
                    <button
                      key={benefit}
                      type="button"
                      onClick={() => toggleBenefit(field, benefit)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer select-none",
                        isChecked
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40 shadow-xs"
                          : "bg-card hover:bg-muted text-muted-foreground border-border/60"
                      )}
                    >
                      {isChecked && <Check className="size-3.5 stroke-[3]" />}
                      <span>{benefit}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Benefit Input */}
              <div className="flex gap-2 pt-2">
                <Input
                  value={customBenefit}
                  onChange={(e) => setCustomBenefit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomBenefit(field);
                    }
                  }}
                  placeholder="Escribe otro beneficio personalizado y presiona Enter..."
                  className="h-10 rounded-xl bg-card border-border/60 text-xs font-medium"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddCustomBenefit(field)}
                  disabled={!customBenefit.trim()}
                  className="h-10 px-4 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  <Plus className="size-3.5 mr-1" />
                  <span>Agregar</span>
                </Button>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
