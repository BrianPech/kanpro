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
          const { data: profile } = await supabase
            .from("profiles")
            .select("job_alerts_enabled, category, location")
            .eq("id", user.id)
            .single();

          if (profile) {
            if (profile.job_alerts_enabled !== undefined && profile.job_alerts_enabled !== null) {
              setAlertsEnabled(!!profile.job_alerts_enabled);
            }
            if (profile.category) {
              setSelectedCategories([profile.category]);
            }
            if (profile.location) {
              setSelectedLocations([profile.location]);
            }
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
      if (user) {
        const primaryCat = selectedCategories[0] || "Hotelería & Recepción";
        const primaryLoc = selectedLocations[0] || "Playa del Carmen, Q. Roo";

        await supabase
          .from("profiles")
          .update({
            job_alerts_enabled: alertsEnabled,
            category: primaryCat,
            location: primaryLoc,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      showToast("Preferencias de alertas guardadas");
      setTimeout(() => {
        handleBack();
      }, 700);
    } catch (err) {
      console.error("Error saving preferences:", err);
      showToast("Error al guardar en la base de datos");
    } fontally: {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-grow min-h-full bg-transparent dark:bg-zinc-950 px-5 sm:px-8 lg:px-12 pt-3 pb-24 md:pb-4 max-w-2xl mx-auto w-full animate-in fade-in duration-300 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[12px] text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AppBar */}
      <div className="flex items-center justify-between py-3 border-b border-transparent">
        <button
          onClick={handleBack}
          aria-label="Regresar"
          className="w-[36px] h-[36px] bg-[#f5f7fa] dark:bg-zinc-900 rounded-full flex items-center justify-center text-[#344558] dark:text-zinc-200 hover:bg-[#ebeef3] dark:hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        <h1 className="text-[17px] font-[800] text-[#1f2732] dark:text-zinc-100 text-center tracking-[-0.4px]">
          Configuración de Alertas
        </h1>

        <div className="w-9" />
      </div>

      {/* Form Area */}
      <div className="pt-4 space-y-7">
        
        {/* 1. Master Switch Card */}
        <div className="p-[18px] bg-[#2f3c4b] dark:bg-fiord-950 rounded-[20px] text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-[44px] h-[44px] rounded-full bg-[#344558] flex items-center justify-center text-white shrink-0">
              <BellRing className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-white leading-tight">
                Notificaciones de Alertas
              </h3>
              <p className="text-[12px] text-[#aabccf] font-medium leading-tight mt-0.5">
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
            className={`w-[48px] h-[28px] rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
              alertsEnabled ? "bg-emerald-400" : "bg-[#344558]"
            }`}
          >
            <div
              className={`w-[20px] h-[20px] rounded-full bg-white transition-transform ${
                alertsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* 2. Options (if alertsEnabled is true) */}
        {alertsEnabled && (
          <div className="space-y-7 animate-in fade-in duration-200">
            
            {/* Categories Section */}
            <div className="space-y-3">
              <div>
                <h2 className="text-[16px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px]">
                  Categorías de Interés
                </h2>
                <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 mt-1">
                  Selecciona los sectores donde deseas recibir ofertas laborales:
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_CATEGORIES.map((cat) => {
                  const isSel = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3.5 py-2 rounded-[16px] text-[13px] tracking-[-0.2px] transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold border border-transparent"
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
            <div className="space-y-3">
              <div>
                <h2 className="text-[16px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px]">
                  Zonas y Ciudades Preferidas
                </h2>
                <p className="text-[13px] text-[#5c7c9b] dark:text-zinc-400 mt-1">
                  Recibirás notificaciones de vacantes publicadas en estas zonas:
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_LOCATIONS.map((loc) => {
                  const isSel = selectedLocations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleLocation(loc)}
                      className={`px-3.5 py-2 rounded-[16px] text-[13px] tracking-[-0.2px] transition-all cursor-pointer ${
                        isSel
                          ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold border border-transparent"
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px]">
                  Sueldo Mínimo Deseado
                </h2>
                <div className="px-3 py-1.5 bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 rounded-[12px]">
                  <span className="text-[13px] font-bold text-[#1f2732] dark:text-zinc-100">
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
                className="w-full h-2 bg-[#ebeef3] dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#1f2732] dark:accent-zinc-100"
              />
            </div>

            {/* Frequency Selection Segmented */}
            <div className="space-y-3">
              <h2 className="text-[16px] font-[800] text-[#1f2732] dark:text-zinc-100 tracking-[-0.3px]">
                Frecuencia de Notificación
              </h2>
              
              <div className="grid grid-cols-3 gap-2">
                {["Instantánea", "Resumen Diario", "Semanal"].map((freq) => {
                  const isSel = alertFrequency === freq;
                  return (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setAlertFrequency(freq)}
                      className={`h-[44px] rounded-[14px] text-[12px] font-bold transition-all cursor-pointer ${
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
            className="w-full h-[52px] bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-[#2f3c4b] dark:hover:bg-zinc-200 rounded-[16px] text-[16px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 border-none"
          >
            {isSaving ? "Guardando..." : "Guardar Preferencias de Alertas"}
          </Button>
        </div>

      </div>

    </div>
  );
}
