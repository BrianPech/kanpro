"use client";

import React, { useState } from "react";
import { MapPin, Loader2, Sparkles, Navigation } from "@/components/ui/icons";
import { GEO_CONFIG, resolveLocationFromCoords } from "@/config/geo";
import { normalizeLocation, parseLocation } from "@/lib/formatters";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
    <div className={cn("rounded-xl border border-border/60 bg-card p-3.5 sm:p-4 space-y-3 shadow-xs", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MapPin className="size-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {label}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {fullLocationStr ? `Ubicación activa: ${fullLocationStr}` : subtitle}
            </p>
          </div>
        </div>
        {showRadarBadge && fullLocationStr && (
          <Badge variant="outline" className="hidden sm:inline-flex items-center gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium px-2 py-0.5">
            <Sparkles className="size-3" />
            Radar Activo
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
        {/* City Selector */}
        <div className="space-y-1">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Ciudad
          </Label>
          <Select
            value={currentCity}
            onValueChange={(newCity) => handleCityChange(newCity || "")}
            disabled={disabled}
          >
            <SelectTrigger className="w-full h-8.5 sm:h-9 rounded-lg text-xs font-medium border-border/70">
              <SelectValue placeholder="Selecciona Ciudad" />
            </SelectTrigger>
            <SelectContent className="rounded-lg max-h-60">
              {availableCities.map((cityKey) => (
                <SelectItem key={cityKey} value={cityKey} className="text-xs">
                  {GEO_CONFIG[cityKey]?.name || cityKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Zone Selector */}
        <div className="space-y-1">
          <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Zona de Trabajo / Cobertura
          </Label>
          <Select
            value={currentZone}
            onValueChange={(newZone) => handleZoneChange(newZone || "")}
            disabled={disabled || !currentCity}
          >
            <SelectTrigger className="w-full h-8.5 sm:h-9 rounded-lg text-xs font-medium border-border/70">
              <SelectValue placeholder="Selecciona Zona" />
            </SelectTrigger>
            <SelectContent className="rounded-lg max-h-60">
              {availableZones.map((zoneKey) => (
                <SelectItem key={zoneKey} value={zoneKey} className="text-xs">
                  {GEO_CONFIG[currentCity]?.zones?.[zoneKey]?.name || zoneKey}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Automatic Location Detection Button */}
      <div className="pt-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDetectLocation}
          disabled={disabled || isLocating}
          className="w-full sm:w-auto h-7.5 px-2.5 text-xs font-medium gap-1.5 rounded-lg cursor-pointer"
        >
          {isLocating ? (
            <>
              <Loader2 className="size-3 animate-spin text-primary" />
              <span>Detectando tu ubicación...</span>
            </>
          ) : (
            <>
              <Navigation className="size-3 text-primary" />
              <span>Detectar mi ubicación actual</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

