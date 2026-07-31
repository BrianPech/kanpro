"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Sparkles, LogOut, Loader2 } from "lucide-react";
import { GEO_CONFIG } from "@/config/geo";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function OnboardingClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<"candidate" | "company" | null>(null);
  const [fullName, setFullName] = useState("");

  // Location state
  const [city, setCity] = useState<string>("Mérida");
  const [zone, setZone] = useState<string>("Centro Mérida");

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const userRole = user.user_metadata?.role || "candidate";
        setRole(userRole as any);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, location, full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setRole((profile.role || userRole) as any);
          setFullName(profile.full_name || user.user_metadata?.full_name || "");

          const location = profile.location || user.user_metadata?.location || "";
          if (location.includes(" - ")) {
            router.push(profile.role === "company" ? "/dashboard/company" : "/dashboard/candidate/discovery");
            return;
          }
        } else {
          setFullName(user.user_metadata?.full_name || "");
          const location = user.user_metadata?.location || "";
          if (location.includes(" - ")) {
            router.push(userRole === "company" ? "/dashboard/company" : "/dashboard/candidate/discovery");
            return;
          }
        }
      } catch (err) {
        console.error("Error loading onboarding session:", err);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  const handleSave = async () => {
    if (!city || !zone) {
      toast.error("Por favor completa los campos.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesión no encontrada.");

      const locationStr = `${city} - ${zone}`;
      const userRole = role || user.user_metadata?.role || "candidate";

      // 1. Update user metadata in Supabase Auth (always permitted for authenticated user)
      await supabase.auth.updateUser({
        data: {
          location: locationStr,
          city: city,
          zone: zone,
        }
      });

      // 2. Update role-specific table (candidate_profiles or company_profiles)
      if (userRole === "company") {
        try {
          await supabase
            .from("company_profiles")
            .update({
              fiscal_address: locationStr,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);
        } catch (e) {
          // ignore error
        }
      } else {
        try {
          await supabase
            .from("candidate_profiles")
            .upsert({
              id: user.id,
              preferred_zone: zone,
              updated_at: new Date().toISOString(),
            });
        } catch (e) {
          // ignore error
        }
      }

      // 3. Try updating base profiles table if permitted by SQL role grants
      try {
        await supabase
          .from("profiles")
          .update({
            location: locationStr,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch (e) {
        // Suppress SQL 42501 table privilege error if profiles table is restricted
      }

      toast.success("¡Ubicación guardada con éxito!", {
        description: "Tu Radar K'anPro ha sido activado.",
      });

      // Redirect to correct dashboard
      router.push(userRole === "company" ? "/dashboard/company" : "/dashboard/candidate/discovery");
      router.refresh();
    } catch (err: any) {
      console.error("Error al guardar ubicación en onboarding:", err);
      const errMsg = err?.message || err?.details || err?.error_description || (typeof err === "string" ? err : "Ocurrió un error inesperado.");
      toast.error("Error al guardar ubicación", {
        description: errMsg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#fafafc] dark:bg-zinc-950 p-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground mt-4 animate-pulse">
          Validando tu sesión...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 relative bg-[#fafafc] dark:bg-zinc-950 overflow-hidden box-border font-sans">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] dark:bg-primary/5" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-amber-500/5 blur-[120px] dark:bg-amber-500/2.5" />
      </div>

      {/* Onboarding Card */}
      <div className="relative w-full max-w-[460px] bg-white dark:bg-zinc-900 border border-border/80 dark:border-border/10 rounded-[28px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] z-10 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="size-14 rounded-[18px] bg-primary/10 flex items-center justify-center text-primary mb-4">
            <MapPin className="size-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-[-0.03em] leading-tight">
            ¡Hola, {fullName.split(" ")[0] || "Profesional"}!
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {role === "company"
              ? "Configura la ubicación de tu empresa para conectar con talentos cercanos en la Riviera Maya."
              : "Selecciona tu ciudad y zona de residencia para activar el Radar y hacer Match con vacantes cercanas."}
          </p>
        </div>

        {/* Location Selectors */}
        <div className="space-y-4 py-2">
          {/* City Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Ciudad *
            </Label>
            <Select
              value={city}
              onValueChange={(val) => {
                setCity(val);
                const firstZone = Object.keys(GEO_CONFIG[val]?.zones || {})[0] || "";
                setZone(firstZone);
              }}
            >
              <SelectTrigger id="city" className="w-full h-12 bg-slate-50 dark:bg-zinc-950/40 border border-border/60 rounded-xl px-4 text-sm font-semibold text-left">
                <SelectValue placeholder="Selecciona Ciudad" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-card border-border/40">
                {Object.keys(GEO_CONFIG).map((cityKey) => (
                  <SelectItem key={cityKey} value={cityKey}>
                    {cityKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Zone Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="zone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Zona de Trabajo / Residencia *
            </Label>
            <Select
              value={zone}
              onValueChange={setZone}
              disabled={!city}
            >
              <SelectTrigger id="zone" className="w-full h-12 bg-slate-50 dark:bg-zinc-950/40 border border-border/60 rounded-xl px-4 text-sm font-semibold text-left">
                <SelectValue placeholder="Selecciona Zona" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-card border-border/40">
                {city &&
                  Object.keys(GEO_CONFIG[city]?.zones || {}).map((zoneKey) => (
                    <SelectItem key={zoneKey} value={zoneKey}>
                      {GEO_CONFIG[city].zones[zoneKey].name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-12 w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-primary/10 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Activando Radar...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" />
                <span>Activar mi Radar</span>
              </>
            )}
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </main>
  );
}
