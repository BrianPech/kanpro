"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Briefcase,
  MapPin,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useVacancyManager, type VacancyRow } from "@/hooks/use-vacancy-manager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

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
    deleteVacancy,
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

  const handleDeleteVacancy = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta vacante?")) {
      try {
        const success = await deleteVacancy(id);
        if (success) {
          setVacancies((prev) => prev.filter((v) => v.id !== id));
          toast.success("Vacante eliminada con éxito");
        }
      } catch (err: any) {
        toast.error("Error al eliminar la vacante", {
          description: err.message,
        });
      }
    }
  };

  // Filtered vacancies for list view
  const filteredVacancies = React.useMemo(() => {
    return vacancies.filter(
      (v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.zone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vacancies, searchQuery]);

  // Formatter helpers
  const formatSalary = (min: number | null, max: number | null) => {
    const formatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    });

    if (min != null && max != null) {
      return `${formatter.format(min)} - ${formatter.format(max)}`;
    } else if (min != null) {
      return `Desde ${formatter.format(min)}`;
    } else if (max != null) {
      return `Hasta ${formatter.format(max)}`;
    }
    return "No especificado";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date
      .toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(".", "");
  };

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
            Controla las ofertas activas y marca las plazas cubiertas desde tu panel.
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

      {/* ================= GESTOR DE VACANTES: DATA TABLE ================= */}
      <div className="space-y-6">
        {/* Search bar controller */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-12 bg-card border-border/60 rounded-xl text-sm font-semibold focus-visible:ring-primary/20"
            placeholder="Buscar por título, categoría o ubicación..."
          />
        </div>

        {/* Data Table */}
        {isLoading ? (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border/40 rounded-3xl bg-card/20">
            <Briefcase className="size-12 stroke-[1.5] mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">Aún no tienes vacantes publicadas</p>
            <p className="text-xs mt-1">Presiona "Nueva Vacante" para iniciar en 30 segundos.</p>
          </div>
        ) : (
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/70 dark:bg-zinc-900/50">
                  <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Puesto</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Ubicación</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Sueldo</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Estado</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Fecha</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-right w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVacancies.map((vacancy) => (
                    <TableRow
                      key={vacancy.id}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800/60 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20",
                        !vacancy.is_active && "opacity-75"
                      )}
                    >
                      {/* Puesto Column */}
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                            {vacancy.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {vacancy.category}
                          </span>
                        </div>
                      </TableCell>

                      {/* Ubicación Column */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <MapPin className="size-3.5 text-zinc-400 shrink-0" />
                          <span>{vacancy.zone || vacancy.location}</span>
                        </div>
                      </TableCell>

                      {/* Sueldo Column */}
                      <TableCell className="py-4 font-bold text-xs text-zinc-800 dark:text-zinc-200">
                        {formatSalary(vacancy.salary_min, vacancy.salary_max)}
                      </TableCell>

                      {/* Estado Column */}
                      <TableCell className="py-4">
                        <Badge
                          variant="secondary"
                          onClick={() => handleToggleActive(vacancy.id, vacancy.is_active)}
                          className={cn(
                            "text-[10px] font-bold tracking-wider uppercase px-2.5 h-6 flex items-center w-fit border cursor-pointer hover:opacity-85 select-none",
                            vacancy.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                          )}
                        >
                          {vacancy.is_active ? "Activa" : "Pausada"}
                        </Badge>
                      </TableCell>

                      {/* Fecha Column */}
                      <TableCell className="py-4 text-xs text-muted-foreground font-semibold">
                        {formatDate(vacancy.created_at)}
                      </TableCell>

                      {/* Acciones Column */}
                      <TableCell className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 rounded-lg border border-border/10 hover:bg-muted"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border border-border/40 bg-popover min-w-[140px] shadow-md">
                            <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-muted py-2 gap-2">
                              <Link href={`/dashboard/candidate/discovery?jobId=${vacancy.id}`}>
                                <Eye className="size-3.5 text-zinc-400" />
                                <span>Ver detalles</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-muted py-2 gap-2">
                              <Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`}>
                                <Edit2 className="size-3.5 text-zinc-400" />
                                <span>Editar</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteVacancy(vacancy.id)}
                              className="cursor-pointer text-xs font-semibold text-red-600 focus:text-red-700 rounded-lg hover:bg-red-500/5 focus:bg-red-500/5 py-2 gap-2"
                            >
                              <Trash2 className="size-3.5 text-red-500" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
