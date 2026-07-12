"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Briefcase,
  MapPin,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVacancyManager, type VacancyRow } from "@/hooks/use-vacancy-manager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

// Custom Switch component for local use
function Switch({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function VacanciesManager({ userId }: { userId: string }) {
  const [vacancies, setVacancies] = React.useState<VacancyRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  // States for company profile checking
  const [profile, setProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  const loadProfile = React.useCallback(async () => {
    try {
      setLoadingProfile(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("profiles_view")
        .select("company_name, phone, logo_url, location, is_validated")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile({
          company_name: data.company_name,
          phone: data.phone,
          logo_url: data.logo_url,
          location: data.location,
          is_validated: data.is_validated ?? false
        });
      }
    } catch (err) {
      console.error("Error loading company profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isProfileIncomplete = React.useMemo(() => {
    if (loadingProfile) return false;
    if (!profile) return true;

    const name = profile.company_name?.trim() || "";
    const wp = profile.phone?.trim() || "";
    const addr = profile.location?.trim() || "";

    return !name || !wp || !addr;
  }, [profile, loadingProfile]);

  const {
    toggleVacancyStatus,
    fetchCompanyVacancies,
    loading: isLoading,
  } = useVacancyManager();

  const loadVacancies = React.useCallback(async () => {
    try {
      const data = await fetchCompanyVacancies();
      setVacancies(data);
    } catch (err) {
      console.error(err);
    }
  }, [fetchCompanyVacancies]);

  React.useEffect(() => {
    loadVacancies();
  }, [loadVacancies]);

  const handleToggleActive = async (vacancyId: string, currentActive: boolean) => {
    const nextState = !currentActive;
    try {
      const success = await toggleVacancyStatus(vacancyId, nextState);
      if (success) {
        setVacancies((prev) =>
          prev.map((v) =>
            v.id === vacancyId
              ? { ...v, is_active: nextState, status: nextState ? "Activa" : "Cerrada" }
              : v
          )
        );
        toast.success(
          nextState ? "Vacante activada con éxito" : "¡Vacante Cubierta!",
          {
            description: nextState
              ? "La oferta vuelve a estar visible para candidatos."
              : "Se ha marcado como cubierta (felicidades por la colocación).",
          }
        );
      }
    } catch (err: any) {
      toast.error("Error al actualizar la vacante", {
        description: err.message,
      });
    }
  };

  // Filtered vacancies for list view
  const filteredVacancies = React.useMemo(() => {
    return vacancies.filter(
      (v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.zone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vacancies, searchQuery]);

  return (
    <div className="flex-grow min-h-screen bg-slate-50/50 dark:bg-slate-950/20 px-4 py-8 md:px-10 lg:px-12 space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER BARS */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight md:text-3xl">
              Gestionar Vacantes
            </h2>
            {!isProfileIncomplete && !loadingProfile && profile && !profile.is_validated && (
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold px-3 py-1 text-xs rounded-full w-fit animate-pulse">
                ✨ Perfil Completo • Verificación en Proceso
              </Badge>
            )}
            {!isProfileIncomplete && !loadingProfile && profile && profile.is_validated && (
              <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 text-xs rounded-full w-fit flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                <span>Empresa Verificada</span>
              </Badge>
            )}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 font-semibold">
            Controla las ofertas activas y marca las plazas cubiertas.
          </p>
        </div>

        <Button
          asChild
          disabled={isProfileIncomplete}
          className="bg-primary hover:bg-primary/90 text-white font-extrabold px-5 h-12 rounded-xl flex items-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-wider disabled:opacity-50 disabled:pointer-events-none"
        >
          {isProfileIncomplete ? (
            <span>Nueva Vacante</span>
          ) : (
            <Link href="/dashboard/company/vacancies/new" className="flex items-center gap-2">
              <Plus className="size-4" />
              <span>Nueva Vacante</span>
            </Link>
          )}
        </Button>
      </div>

      {isProfileIncomplete && !loadingProfile && (
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0 mt-0.5">⚠️</span>
            <div className="space-y-1">
              <AlertTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Perfil de Empresa Incompleto
              </AlertTitle>
              <AlertDescription className="text-xs font-semibold leading-relaxed text-amber-600 dark:text-amber-300/90">
                Para comenzar a publicar ofertas express y activar tu radar, primero completa la información esencial de tu negocio (Nombre, WhatsApp y Dirección) en la sección de Mi Perfil.
              </AlertDescription>
            </div>
          </div>
          <Button
            asChild
            className="w-full sm:w-fit h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shrink-0"
          >
            <Link href="/dashboard/company/profile">
              Completar Perfil
            </Link>
          </Button>
        </Alert>
      )}

      {/* ================= VISTA B: EL GESTOR DE VACANTES EXPRESS ================= */}
      <div className="space-y-6">
        {/* Search bar list controller */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-12 bg-card border-border/60 rounded-xl text-sm font-semibold focus-visible:ring-primary/20"
            placeholder="Buscar por título, categoría o zona..."
          />
        </div>

        {/* Vacancies Feed / List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="border border-border/40 p-6 bg-card">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-24 animate-pulse" />
                    <Skeleton className="h-5 w-16 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40 animate-pulse" />
                    <Skeleton className="h-3 w-28 animate-pulse" />
                  </div>
                  <Skeleton className="h-4 w-32 animate-pulse" />
                  <Skeleton className="h-10 w-full animate-pulse" />
                  <div className="pt-4 border-t border-border/20 flex items-center justify-between">
                    <Skeleton className="h-6 w-16 animate-pulse" />
                    <Skeleton className="h-5 w-20 animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border/40 rounded-3xl bg-card/20">
            <Briefcase className="size-12 stroke-[1.5] mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Aún no tienes vacantes publicadas</p>
            <p className="text-xs mt-1">Presiona "Nueva Vacante" para iniciar en 30 segundos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVacancies.map((vacancy) => (
              <Card
                key={vacancy.id}
                className={cn(
                  "border border-border/50 rounded-3xl overflow-hidden transition-all duration-300 shadow-sm",
                  !vacancy.is_active ? "opacity-75 bg-slate-50/50 dark:bg-slate-900/10" : "bg-card"
                )}
              >
                <CardContent className="p-6 flex flex-col justify-between h-full gap-5">
                  <div className="space-y-3">
                    {/* Badge / Status Tag */}
                    <div className="flex items-center justify-between gap-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] font-bold tracking-wider uppercase px-2 h-5 flex items-center border",
                          vacancy.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        )}
                      >
                        {vacancy.is_active ? "Activa / Buscando" : "Vacante Cubierta"}
                      </Badge>
                      
                      {!vacancy.is_active && (
                        <Badge className="bg-emerald-600/15 hover:bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-extrabold text-[9px] uppercase tracking-wider px-2 h-5 flex items-center gap-1">
                          <FileCheck className="size-3" />
                          <span>Colocación Exitosa</span>
                        </Badge>
                      )}
                    </div>

                    {/* Info principal */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base md:text-lg text-foreground line-clamp-1">
                        {vacancy.title}
                      </h3>
                      <p className="text-xs font-semibold text-primary">{vacancy.category}</p>
                    </div>

                    {/* Locación */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                      <MapPin className="size-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{vacancy.zone || vacancy.location}</span>
                    </div>

                    {/* Requisitos extracto */}
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed">
                      {vacancy.requirements || vacancy.description}
                    </p>
                  </div>

                  {/* Footer Actions (Toggles and Metrics) */}
                  <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={vacancy.is_active}
                        onCheckedChange={() => handleToggleActive(vacancy.id, vacancy.is_active)}
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {vacancy.is_active ? "Activa" : "Cubierta"}
                      </span>
                    </div>

                    {vacancy.salary_range && (
                      <span className="text-xs font-extrabold text-foreground px-3 py-1 bg-muted/60 dark:bg-muted/20 rounded-md">
                        {vacancy.salary_range}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
