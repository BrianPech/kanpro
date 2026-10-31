"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  BellRing, 
  Loader2,
  Check
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobAlertPreferencesViewProps {
  onBack?: () => void;
}

const ALL_CATEGORIES = [
  "Hotelería & Recepción",
  "Alimentos & Bebidas",
  "Cocina & Gastronomía",
  "Ventas & Atención al Cliente",
  "Eventos & Entretenimiento",
  "Ama de Llaves & Mantenimiento",
  "Administración & RH",
  "Coctelería & Bar",
];

const ALL_LOCATIONS = [
  "Playa del Carmen, Q. Roo",
  "Cancún, Q. Roo",
  "Tulum, Q. Roo",
  "Mérida, Yucatán",
  "Cozumel, Q. Roo",
  "Isla Mujeres, Q. Roo",
  "Riviera Maya",
];

export function JobAlertPreferencesView({ onBack }: JobAlertPreferencesViewProps) {
  const router = useRouter();
  const supabase = createClient();

  // Local state
  const [alertsEnabled, setAlertsEnabled] = React.useState<boolean>(true);
  const [minSalaryExpectation, setMinSalaryExpectation] = React.useState<number>(14000);
  const [alertFrequency, setAlertFrequency] = React.useState<string>("Instantánea");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([
    "Hotelería & Recepción",
    "Alimentos & Bebidas",
  ]);
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([
    "Playa del Carmen, Q. Roo",
    "Cancún, Q. Roo",
  ]);

  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  // Load preferences from Supabase
  React.useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [{ data: baseProfile }, { data: candProfile }] = await Promise.all([
            supabase
              .from("profiles")
              .select("location")
              .eq("id", user.id)
              .maybeSingle(),
            supabase
              .from("candidate_profiles")
              .select("job_alerts_enabled, preferred_zone, specialization_area, social_links")
              .eq("id", user.id)
              .maybeSingle()
          ]);

          if (candProfile) {
            if (candProfile.job_alerts_enabled !== undefined && candProfile.job_alerts_enabled !== null) {
              setAlertsEnabled(!!candProfile.job_alerts_enabled);
            }
            const metadataAlerts = (candProfile.social_links as any)?.alert_preferences;
            if (metadataAlerts) {
              if (Array.isArray(metadataAlerts.categories) && metadataAlerts.categories.length > 0) {
                setSelectedCategories(metadataAlerts.categories);
              }
              if (Array.isArray(metadataAlerts.locations) && metadataAlerts.locations.length > 0) {
                setSelectedLocations(metadataAlerts.locations);
              }
              if (metadataAlerts.min_salary) {
                setMinSalaryExpectation(Number(metadataAlerts.min_salary));
              }
              if (metadataAlerts.frequency) {
                setAlertFrequency(metadataAlerts.frequency);
              }
            } else {
              if (candProfile.specialization_area) {
                setSelectedCategories([candProfile.specialization_area]);
              }
              if (candProfile.preferred_zone || baseProfile?.location) {
                const loc = candProfile.preferred_zone || baseProfile?.location;
                if (loc) setSelectedLocations([loc]);
              }
            }
          } else if (baseProfile?.location) {
            setSelectedLocations([baseProfile.location]);
          }
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
      }
    }
    loadData();
  }, [supabase]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/candidate/profile");
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter((c) => c !== cat) : prev;
      } else {
        return [...prev, cat];
      }
    });
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) => {
      if (prev.includes(loc)) {
        return prev.length > 1 ? prev.filter((l) => l !== loc) : prev;
      } else {
        return [...prev, loc];
      }
    });
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario autenticado");

      const primaryCat = selectedCategories[0] || "Hotelería & Recepción";
      const primaryLoc = selectedLocations[0] || "Playa del Carmen, Q. Roo";

      // 1. Get existing social_links to preserve other metadata
      const { data: existingCand } = await supabase
        .from("candidate_profiles")
        .select("social_links")
        .eq("id", user.id)
        .maybeSingle();

      const existingSocial = (existingCand?.social_links as Record<string, any>) || {};
      const updatedSocial = {
        ...existingSocial,
        alert_preferences: {
          categories: selectedCategories,
          locations: selectedLocations,
          min_salary: minSalaryExpectation,
          frequency: alertFrequency,
          updated_at: new Date().toISOString(),
        }
      };

      // 2. Persist to candidate_profiles
      const { error: candError } = await supabase
        .from("candidate_profiles")
        .upsert({
          id: user.id,
          job_alerts_enabled: alertsEnabled,
          specialization_area: primaryCat,
          preferred_zone: primaryLoc,
          social_links: updatedSocial as any,
          updated_at: new Date().toISOString(),
        });

      if (candError) {
        console.warn("Warning updating candidate_profiles alert preferences:", candError.message || candError);
      }

      // 3. Update base profile location and auth metadata
      try {
        await supabase
          .from("profiles")
          .update({
            location: primaryLoc,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        await supabase.auth.updateUser({
          data: {
            job_alerts_enabled: alertsEnabled,
            alert_preferences: updatedSocial.alert_preferences,
          }
        });
      } catch (e) {
        console.warn("Non-fatal sync with auth metadata:", e);
      }

      toast.success("Preferencias de alertas guardadas con éxito");
      setTimeout(() => {
        handleBack();
      }, 500);
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      toast.error("Error al guardar en la base de datos");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 min-h-full bg-transparent px-4 sm:px-6 lg:px-8 pt-2 pb-28 md:pb-12 max-w-3xl mx-auto w-full animate-in fade-in duration-300 relative space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleBack}
          aria-label="Regresar"
          className="size-10 rounded-full cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="text-center space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Configuración de Alertas
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Personaliza tus notificaciones de vacantes acordes a tu perfil
          </p>
        </div>

        <div className="size-10" />
      </div>

      {/* Form Area */}
      <div className="space-y-6">
        
        {/* 1. Master Switch Card */}
        <Card className="rounded-4xl border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-xs">
          <CardContent className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-10 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BellRing className="size-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Notificaciones de Alertas
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Recibe avisos cuando se publiquen vacantes acordes a tu perfil
                </p>
              </div>
            </div>

            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
              className="shrink-0"
              aria-label="Habilitar alertas de empleo"
            />
          </CardContent>
        </Card>

        {/* 2. Options (if alertsEnabled is true) */}
        {alertsEnabled && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Categories Section */}
            <Card className="rounded-4xl border-border/70 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Categorías de Interés</CardTitle>
                <CardDescription className="text-xs">
                  Selecciona los sectores donde deseas recibir ofertas laborales:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const isSel = selectedCategories.includes(cat);
                    return (
                      <Button
                        key={cat}
                        type="button"
                        variant={isSel ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "h-9 rounded-3xl text-xs font-medium gap-1.5 cursor-pointer transition-all",
                          isSel && "shadow-xs"
                        )}
                      >
                        {isSel && <Check className="size-3.5" />}
                        <span>{cat}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Locations Section */}
            <Card className="rounded-4xl border-border/70 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Zonas y Ciudades Preferidas</CardTitle>
                <CardDescription className="text-xs">
                  Recibirás avisos de vacantes publicadas en estas zonas:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ALL_LOCATIONS.map((loc) => {
                    const isSel = selectedLocations.includes(loc);
                    return (
                      <Button
                        key={loc}
                        type="button"
                        variant={isSel ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleLocation(loc)}
                        className={cn(
                          "h-9 rounded-3xl text-xs font-medium gap-1.5 cursor-pointer transition-all",
                          isSel && "shadow-xs"
                        )}
                      >
                        {isSel && <Check className="size-3.5" />}
                        <span>{loc}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Minimum Salary Slider Section */}
            <Card className="rounded-4xl border-border/70 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold">Sueldo Mínimo Deseado</CardTitle>
                    <CardDescription className="text-xs">
                      Filtra vacantes que cumplan con tu expectativa salarial mínima.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono font-bold px-3 py-1 rounded-3xl">
                    ${Math.round(minSalaryExpectation / 1000)}k MXN /mes
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  type="range"
                  min={8000}
                  max={35000}
                  step={1000}
                  value={minSalaryExpectation}
                  onChange={(e) => setMinSalaryExpectation(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                  <span>$8,000 MXN</span>
                  <span>$35,000+ MXN</span>
                </div>
              </CardContent>
            </Card>

            {/* Frequency Selection */}
            <Card className="rounded-4xl border-border/70 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Frecuencia de Notificación</CardTitle>
                <CardDescription className="text-xs">
                  ¿Con qué frecuencia deseas recibir resúmenes y alertas?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2.5">
                  {["Instantánea", "Resumen Diario", "Semanal"].map((freq) => {
                    const isSel = alertFrequency === freq;
                    return (
                      <Button
                        key={freq}
                        type="button"
                        variant={isSel ? "default" : "outline"}
                        onClick={() => setAlertFrequency(freq)}
                        className={cn(
                          "h-9 rounded-3xl text-xs sm:text-sm font-semibold transition-all cursor-pointer",
                          isSel && "shadow-xs"
                        )}
                      >
                        {freq}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Save CTA Button */}
        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="w-full sm:w-auto h-9 rounded-4xl font-semibold text-xs sm:text-sm gap-2 min-w-44 cursor-pointer shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar Preferencias</span>
            )}
          </Button>
        </div>

      </div>

    </div>
  );
}
