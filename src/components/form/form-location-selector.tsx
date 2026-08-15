"use client";

import React, { useState } from "react";
import { MapPin, Crosshair, Loader2, Sparkles, Navigation } from "lucide-react";
import { GEO_CONFIG, resolveLocationFromCoords } from "@/config/geo";
import { normalizeLocation, parseLocation } from "@/lib/formatters";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface FormLocationSelectorProps {
  value?: string | null;
  cityValue?: string | null;
  zoneValue?: string | null;
  onChange: (data: { city: string; zone: string; locationStr: string }) => void;
  label?: string;
  subtitle?: string;
  showRadarBadge?: boolean;
  className?: string;
  disabled?: boolean;
}

export function FormLocationSelector({
  value,
  cityValue,
  zoneValue,
  onChange,
  label = "Zona de Trabajo y Cobertura",
  subtitle = "Configura tu ciudad y zona para conectar con oportunidades cercanas.",
  showRadarBadge = true,
  className = "",
  disabled = false,
}: FormLocationSelectorProps) {
  // Determine current active city and zone
  const parsed = React.useMemo(() => {
    if (cityValue && zoneValue) {
      return { city: cityValue, zone: zoneValue };
    }
    return parseLocation(value);
  }, [value, cityValue, zoneValue]);

  const [currentCity, setCurrentCity] = useState<string>(parsed.city || "Mérida");
  const [currentZone, setCurrentZone] = useState<string>(parsed.zone || "Centro Mérida");
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Synchronize when outer values update
  React.useEffect(() => {
    if (parsed.city && parsed.city !== currentCity) {
      setCurrentCity(parsed.city);
    }
    if (parsed.zone && parsed.zone !== currentZone) {
      setCurrentZone(parsed.zone);
    }
  }, [parsed.city, parsed.zone]);

  const availableCities = React.useMemo(() => {
    const keys = Object.keys(GEO_CONFIG);
    if (currentCity && !keys.includes(currentCity)) {
      return [currentCity, ...keys];
    }
    return keys;
  }, [currentCity]);

  const availableZones = React.useMemo(() => {
    if (!currentCity) return [];
    const configZones = Object.keys(GEO_CONFIG[currentCity]?.zones || {});
    if (currentZone && !configZones.includes(currentZone)) {
      return [currentZone, ...configZones];
    }
    return configZones;
  }, [currentCity, currentZone]);

  const handleCityChange = (newCity: string) => {
    setCurrentCity(newCity);
    const defaultZone = Object.keys(GEO_CONFIG[newCity]?.zones || {})[0] || "Centro";
    setCurrentZone(defaultZone);
    const locStr = normalizeLocation(newCity, defaultZone);
    onChange({ city: newCity, zone: defaultZone, locationStr: locStr });
  };

  const handleZoneChange = (newZone: string) => {
    setCurrentZone(newZone);
    const locStr = normalizeLocation(currentCity, newZone);
    onChange({ city: currentCity, zone: newZone, locationStr: locStr });
  };

  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocalización no disponible", {
        description: "Tu navegador o dispositivo no cuenta con servicio de geolocalización.",
      });
      return;
    }

    setIsLocating(true);

    const onLocationSuccess = async (pos: GeolocationPosition) => {
      try {
        const { latitude, longitude } = pos.coords;
        const resolved = await resolveLocationFromCoords(latitude, longitude);
        setCurrentCity(resolved.city);
        setCurrentZone(resolved.zone);
        setIsLocating(false);
        onChange({
          city: resolved.city,
          zone: resolved.zone,
          locationStr: resolved.displayLocation,
        });
        toast.success("Ubicación detectada con éxito", {
          description: `Se configuró: ${resolved.displayLocation}`,
        });
      } catch (e) {
        setIsLocating(false);
        toast.error("No se pudo procesar tu ubicación", {
          description: "Puedes seleccionar tu ciudad y zona en los menús de abajo.",
        });
      }
    };

    const onLocationFailure = (err: GeolocationPositionError) => {
      // If high accuracy failed/timed out, gracefully fallback to standard accuracy
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        navigator.geolocation.getCurrentPosition(
          onLocationSuccess,
          (fallbackErr) => {
            setIsLocating(false);
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              toast.error("Permiso de ubicación denegado", {
                description: "Habilita los permisos de ubicación en tu navegador o selecciona tu zona manualmente.",
              });
            } else {
              toast.error("No se pudo detectar tu ubicación automática", {
                description: "Selecciona tu ciudad y zona en las opciones de abajo.",
              });
            }
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
        );
        return;
      }

      setIsLocating(false);
      if (err.code === err.PERMISSION_DENIED) {
        toast.error("Permiso de ubicación denegado", {
          description: "Permite el acceso a tu ubicación en el navegador o selecciona tu zona manualmente.",
        });
      } else {
        toast.error("Ubicación no disponible", {
          description: "Selecciona tu ciudad y zona de la lista.",
        });
      }
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationFailure,
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  };

  const fullLocationStr = normalizeLocation(currentCity, currentZone);

  return (
    <div className={`p-6 bg-white dark:bg-zinc-900 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 shadow-2xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#1f2732] dark:text-zinc-100">
              {label}
            </h3>
            <p className="text-[12px] text-[#5c7c9b] dark:text-zinc-400 font-medium">
              {fullLocationStr ? `Ubicación activa: ${fullLocationStr}` : subtitle}
            </p>
          </div>
        </div>
        {showRadarBadge && fullLocationStr && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Radar Activo
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* City Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Ciudad
          </Label>
          <Select
            value={currentCity}
            onValueChange={handleCityChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-zinc-950/40 border border-border/60 rounded-xl px-4 text-xs font-semibold">
              <SelectValue placeholder="Selecciona Ciudad" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              {availableCities.map((cityKey) => (
                <SelectItem key={cityKey} value={cityKey}>
                  {GEO_CONFIG[cityKey]?.name || cityKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zone Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Zona de Trabajo / Cobertura
          </Label>
          <Select
            value={currentZone}
            onValueChange={handleZoneChange}
            disabled={disabled || !currentCity}
          >
            <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-zinc-950/40 border border-border/60 rounded-xl px-4 text-xs font-semibold">
              <SelectValue placeholder="Selecciona Zona" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              {availableZones.map((zoneKey) => (
                <SelectItem key={zoneKey} value={zoneKey}>
                  {GEO_CONFIG[currentCity]?.zones?.[zoneKey]?.name || zoneKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Automatic Location Detection Button */}
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={handleDetectLocation}
          disabled={disabled || isLocating}
          className="w-full sm:w-auto h-10 rounded-xl border-border text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-98 transition-all"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Detectando tu ubicación...</span>
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 text-primary" />
              <span>Detectar mi ubicación actual</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
