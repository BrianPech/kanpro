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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRESET_ZONES,
  PRESET_BENEFITS,
  type VacancyWizardValues,
} from "../../schemas/vacancy-wizard.schema";
import { cn } from "@/lib/utils";

interface Step2CompensationProps {
  form: any;
  companyLocation?: string;
  companyName?: string;
}

export function Step2Compensation({
  form,
  companyLocation = "Mérida, Yucatán",
  companyName = "Tu Empresa",
}: Step2CompensationProps) {
  const [customBenefit, setCustomBenefit] = React.useState("");
  const [useProfileLocation, setUseProfileLocation] = React.useState<boolean>(() => {
    // If the current form location matches or if just starting
    const currentLoc = form.getFieldValue("location");
    return !currentLoc || currentLoc === companyLocation;
  });

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
    form.setFieldValue("location", companyLocation);
  };

  const handleSelectCustomLocation = () => {
    setUseProfileLocation(false);
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
              <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
                {companyLocation || "Mérida, Yucatán"}
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

        {/* Location & Zone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Location / City */}
          <form.Field
            name="location"
            children={(field: any) => (
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ciudad o Municipio <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={field.state.value || ""}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                    if (useProfileLocation && e.target.value !== companyLocation) {
                      setUseProfileLocation(false);
                    }
                  }}
                  placeholder="Ej. Mérida, Yucatán / Playa del Carmen, Q. Roo"
                  className="h-11 rounded-xl bg-card border-border/60 text-sm font-semibold"
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-xs font-semibold text-rose-500">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          />

          {/* Zone */}
          <form.Field
            name="zone"
            children={(field: any) => (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Zona / Área de Trabajo <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={field.state.value || "Centro Mérida"}
                  onValueChange={(val) => field.handleChange(val)}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-card border-border/60 text-xs sm:text-sm font-semibold cursor-pointer">
                    <SelectValue placeholder="Selecciona la zona" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-lg max-h-64">
                    {PRESET_ZONES.map((zone) => (
                      <SelectItem key={zone} value={zone} className="text-xs font-semibold rounded-lg cursor-pointer">
                        {zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
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
