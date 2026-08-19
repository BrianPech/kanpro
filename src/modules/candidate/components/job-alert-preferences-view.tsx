"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Bell, 
  BellRing, 
  CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

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
      router.back();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
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

      showToast("Preferencias de alertas guardadas con éxito");
      setTimeout(() => {
        handleBack();
      }, 700);
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      showToast("Error al guardar en la base de datos");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-6 sm:px-10 lg:px-14 pt-4 pb-28 md:pb-8 max-w-3xl mx-auto w-full animate-in fade-in duration-300 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[14px] text-sm font-bold shadow-lg flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AppBar */}
      <div className="flex items-center justify-between py-4 border-b border-transparent">
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-[44px] h-[44px] bg-[#f5f7fa] dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
        </button>

        <h1 className="text-[20px] sm:text-[24px] font-[800] text-[#1f2732] dark:text-zinc-100 text-center tracking-[-0.4px]">
          Configuración de Alertas
        </h1>

        <div className="w-11" />
      </div>

      {/* Form Area */}
      <div className="pt-5 space-y-8">
        
        {/* 1. Master Switch Card */}
        <div className="p-5 sm:p-6 bg-[#2f3c4b] dark:bg-fiord-950 rounded-[24px] text-white flex items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-[50px] h-[50px] rounded-full bg-[#344558] flex items-center justify-center text-white shrink-0">
              <BellRing className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold text-white leading-tight">
                Notificaciones de Alertas
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#aabccf] font-medium leading-normal mt-1">
                Recibe avisos cuando se publiquen vacantes acordes a tu perfil
              </p>
            </div>
          </div>

          {/* Master Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={alertsEnabled}
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className={`w-[54px] h-[32px] rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              alertsEnabled ? "bg-emerald-400" : "bg-[#344558]"
            }`}
          >
            <div
              className={`w-[24px] h-[24px] rounded-full bg-white transition-transform ${
                alertsEnabled ? "translate-x-[22px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 2. Options (if alertsEnabled is true) */}
        {alertsEnabled && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Categories Section */}
            <div className="space-y-3.5">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px]">
                  Categorías de Interés
                </h2>
                <p className="text-[14px] sm:text-[15px] text-[#5c7c9b] dark:text-zinc-400 font-medium mt-1">
                  Selecciona los sectores donde deseas recibir ofertas laborales:
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {ALL_CATEGORIES.map((cat) => {
                  const isSel = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-4 py-2.5 rounded-[18px] text-[14px] tracking-[-0.2px] transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold border border-transparent shadow-xs"
                          : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#344558] dark:text-zinc-300 font-semibold border border-[#ebeef3] dark:border-zinc-800 hover:bg-[#ebeef3]"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Locations Section */}
            <div className="space-y-3.5">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px]">
                  Zonas y Ciudades Preferidas
                </h2>
                <p className="text-[14px] sm:text-[15px] text-[#5c7c9b] dark:text-zinc-400 font-medium mt-1">
                  Recibirás notificaciones de vacantes publicadas en estas zonas:
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {ALL_LOCATIONS.map((loc) => {
                  const isSel = selectedLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className={`px-4 py-2.5 rounded-[18px] text-[14px] tracking-[-0.2px] transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold border border-transparent shadow-xs"
                          : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#344558] dark:text-zinc-300 font-semibold border border-[#ebeef3] dark:border-zinc-800 hover:bg-[#ebeef3]"
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minimum Salary Slider Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] sm:text-[20px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px]">
                  Sueldo Mínimo Deseado
                </h2>
                <div className="px-3.5 py-1.5 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[14px]">
                  <span className="text-[14px] font-bold text-[#1f2732] dark:text-zinc-100">
                    ${Math.round(minSalaryExpectation / 1000)}k MXN /mes
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={8000}
                max={35000}
                step={1000}
                value={minSalaryExpectation}
                onChange={(e) => setMinSalaryExpectation(Number(e.target.value))}
                className="w-full h-2.5 bg-[#ebeef3] dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#1f2732] dark:accent-zinc-100"
              />
            </div>

            {/* Frequency Selection Segmented */}
            <div className="space-y-3.5">
              <h2 className="text-[18px] sm:text-[20px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px]">
                Frecuencia de Notificación
              </h2>
              
              <div className="grid grid-cols-3 gap-2.5">
                {["Instantánea", "Resumen Diario", "Semanal"].map((freq) => {
                  const isSel = alertFrequency === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setAlertFrequency(freq)}
                      className={`h-[50px] rounded-[16px] text-[13px] sm:text-[14px] font-bold transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                          : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#344558] dark:text-zinc-300 border border-[#ebeef3] dark:border-zinc-800 hover:bg-[#ebeef3]"
                      }`}
                    >
                      {freq}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Save CTA Button */}
        <div className="pt-6">
          <Button
            type="button"
            onClick={handleSavePreferences}
            disabled={isSaving}
            className="w-full h-[54px] bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[18px] text-[16px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 border-none"
          >
            {isSaving ? "Guardando..." : "Guardar Preferencias de Alertas"}
          </Button>
        </div>

      </div>

    </div>
  );
}
