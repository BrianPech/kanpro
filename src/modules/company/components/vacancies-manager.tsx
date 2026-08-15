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
  SlidersHorizontal,
  FileDown,
  LayoutGrid,
  List,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useVacancyManager, type VacancyRow } from "@/hooks/use-vacancy-manager";
import { VacanciesTable } from "./vacancies-table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

export function VacanciesManager({ userId }: { userId: string }) {
  const [vacancies, setVacancies] = React.useState<VacancyRow[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deletingVacancyId, setDeletingVacancyId] = React.useState<string | null>(null);
  
  // View mode switcher: "list" | "grid"
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  
  // Advanced filters state
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // States for company profile checking
  const [profile, setProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  const loadProfile = React.useCallback(async () => {
    try {
      setLoadingProfile(true);
      const supabase = createClient();
      
      const { data: baseProfile } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", userId)
        .single();

      const { data: compProfile } = await supabase
        .from("company_profiles")
        .select("company_name, contact_phone, fiscal_address, logo_url, verification_status")
        .eq("id", userId)
        .maybeSingle();

      const company_name = compProfile?.company_name || baseProfile?.full_name || "";
      const phone = compProfile?.contact_phone || "configurado";
      const location = compProfile?.fiscal_address || baseProfile?.location || "";
      const is_validated = (compProfile?.verification_status as any) === "verified" || (compProfile?.verification_status as any) === "approved";

      setProfile({
        company_name,
        phone,
        logo_url: compProfile?.logo_url || null,
        location,
        is_validated
      });
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
    if (!profile) return false;

    const name = profile.company_name?.trim() || "";
    const addr = profile.location?.trim() || "";

    return !name || name === "Nueva Empresa" || !addr;
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

  const confirmDeleteVacancy = async (id: string) => {
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
    } finally {
      setDeletingVacancyId(null);
    }
  };

  // Standard default categories and zones for pre-populating filter dropdowns
  const DEFAULT_CATEGORIES = [
    "Alimentos y Bebidas",
    "Hotelería y Turismo",
    "Mantenimiento y Limpieza",
    "Ventas y Comercio",
    "Administración y Operaciones",
    "Atención al Cliente",
    "Otro",
  ];

  const DEFAULT_ZONES = [
    "Centro Mérida",
    "Altabrisa",
    "Caucel",
    "Las Américas",
    "Francisco de Montejo",
    "Kanasín",
    "Paseo de Montejo",
    "Playa del Carmen",
  ];

  // Categories extracted from loaded vacancies + defaults
  const categoriesList = React.useMemo(() => {
    const cats = new Set<string>(DEFAULT_CATEGORIES);
    vacancies.forEach(v => {
      if (v.category) cats.add(v.category);
    });
    return Array.from(cats);
  }, [vacancies]);

  // Locations / Zones extracted from loaded vacancies + defaults
  const locationsList = React.useMemo(() => {
    const locs = new Set<string>(DEFAULT_ZONES);
    vacancies.forEach(v => {
      const displayLoc = v.zone || v.location;
      if (displayLoc) locs.add(displayLoc);
    });
    return Array.from(locs);
  }, [vacancies]);

  // Advanced Filtering logic
  const filteredVacancies = React.useMemo(() => {
    return vacancies.filter((v) => {
      // Search text matches title or category or location/zone
      const matchesSearch =
        searchQuery === "" ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (v.zone?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (v.location?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      // Category filter matches
      const matchesCategory =
        categoryFilter === "all" || v.category === categoryFilter;

      // Location filter matches
      const matchesLocation =
        locationFilter === "all" ||
        v.zone === locationFilter ||
        v.location === locationFilter;

      // Status filter matches
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && v.is_active) ||
        (statusFilter === "paused" && !v.is_active);

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [vacancies, searchQuery, categoryFilter, locationFilter, statusFilter]);

  const handleClearFilters = () => {
    setCategoryFilter("all");
    setLocationFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  // CSV Export action
  const handleExportCSV = () => {
    if (filteredVacancies.length === 0) {
      toast.error("No hay vacantes para exportar");
      return;
    }
    const headers = [
      "Puesto",
      "Categoría",
      "Ubicación / Zona",
      "Sueldo Mínimo (MXN)",
      "Sueldo Máximo (MXN)",
      "Estado",
      "Fecha de Publicación"
    ];
    const rows = filteredVacancies.map((v) => [
      v.title,
      v.category || "No especificada",
      v.zone || v.location || "No especificada",
      v.salary_min || 0,
      v.salary_max || 0,
      v.is_active ? "Activa" : "Pausada",
      new Date(v.created_at).toLocaleDateString("es-MX")
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const companyLabel = profile?.company_name
      ? profile.company_name.toLowerCase().replace(/\s+/g, "_")
      : "empresa";
    link.setAttribute("download", `vacantes_${companyLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado con éxito");
  };

  // Format salary with MXN currency format
  const formatSalary = (min: number | null, max: number | null) => {
    const formatter = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    });

    if (min != null && max != null) {
      return `${formatter.format(min)} - ${formatter.format(max)} MXN`;
    } else if (min != null) {
      return `Desde ${formatter.format(min)} MXN`;
    } else if (max != null) {
      return `Hasta ${formatter.format(max)} MXN`;
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

  const handleBatchStatusChange = async (ids: string[], newStatus: "Activa" | "Pausada" | "Cerrada") => {
    const isActive = newStatus === "Activa";
    try {
      for (const id of ids) {
        await toggleVacancyStatus(id, isActive);
      }
      setVacancies((prev) =>
        prev.map((v) =>
          ids.includes(v.id)
            ? { ...v, is_active: isActive, status: newStatus }
            : v
        )
      );
      toast.success(
        newStatus === "Pausada"
          ? `${ids.length} vacantes pausadas con éxito`
          : newStatus === "Cerrada"
          ? `${ids.length} vacantes marcadas como cerradas`
          : `${ids.length} vacantes activadas con éxito`
      );
    } catch (err: any) {
      toast.error("Error al actualizar vacantes seleccionadas", {
        description: err.message,
      });
    }
  };

  const hasActiveFilters = categoryFilter !== "all" || locationFilter !== "all" || statusFilter !== "all" || searchQuery !== "";

  return (
    <div className="flex-grow bg-[#f5f7fa]/60 dark:bg-[#18181B] px-6 sm:px-10 lg:px-14 py-6 sm:py-8 max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      
      {/* Verification status pill banner (if applicable) */}
      {!isProfileIncomplete && !loadingProfile && profile && (
        <div>
          {!profile.is_validated ? (
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-extrabold px-4 py-1.5 text-xs sm:text-sm rounded-full w-fit animate-pulse">
              ✨ Perfil Completo • Verificación de Empresa en Proceso
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-extrabold px-4 py-1.5 text-xs sm:text-sm rounded-full w-fit flex items-center gap-2">
              <CheckCircle2 className="size-4.5" />
              <span>Empresa Verificada</span>
            </Badge>
          )}
        </div>
      )}

      {isProfileIncomplete && !loadingProfile && (
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 p-6 sm:p-7 rounded-[26px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xs">
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0">⚠️</span>
            <div className="space-y-1">
              <AlertTitle className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Perfil de Empresa Incompleto
              </AlertTitle>
              <AlertDescription className="text-xs sm:text-sm font-semibold leading-relaxed text-amber-700 dark:text-amber-300/90">
                Para comenzar a publicar ofertas express y activar tu radar, primero completa la información esencial de tu negocio (Nombre, WhatsApp y Dirección) en la sección de Mi Perfil.
              </AlertDescription>
            </div>
          </div>
          <Button
            asChild
            className="w-full sm:w-fit h-12 rounded-[16px] bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider shrink-0 border-none cursor-pointer px-6 shadow-sm"
          >
            <Link href="/dashboard/company/profile">
              Completar Perfil
            </Link>
          </Button>
        </Alert>
      )}

      {/* Global recruitment paused banner alert */}
      {vacancies.length > 0 && vacancies.every((v) => !v.is_active) && (
        <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 p-5 rounded-[22px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <span className="text-2xl shrink-0">⏸️</span>
            <div>
              <AlertTitle className="text-sm font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Reclutamiento Temporalmente Pausado
              </AlertTitle>
              <AlertDescription className="text-xs font-semibold text-amber-800 dark:text-amber-300/90 mt-0.5">
                Todas tus vacantes se encuentran inactivas y ocultas en el feed de candidatos. Puedes activarlas individualmente o reanudar tu operación en Ajustes.
              </AlertDescription>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-9 px-4 rounded-[12px] border-amber-600/40 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 text-xs font-bold shrink-0 cursor-pointer"
          >
            <Link href="/dashboard/company/settings">
              Ver Ajustes
            </Link>
          </Button>
        </Alert>
      )}

      {/* ========================================== */}
      {/* ALWAYS VISIBLE UNIFIED FILTER CARD          */}
      {/* ========================================== */}
      <Card className="bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-5 sm:p-6 shadow-xs space-y-5 shrink-0">
        
        {/* Top Control Bar: Search Input, View Mode Switcher, Actions */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-[#ebeef3] dark:border-zinc-800/80 pb-5">
          
          {/* Global Search Input */}
          <div className="relative flex-grow md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5c7c9b] size-4.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 h-12 bg-[#f5f7fa]/60 dark:bg-zinc-900/40 border border-[#d2dbe5] dark:border-zinc-800 rounded-[16px] text-sm font-semibold placeholder-[#5c7c9b] text-[#1f2732] dark:text-zinc-100 outline-none focus:border-[#1f2732] dark:focus:border-zinc-700 transition-all"
              placeholder="Buscar puesto o categoría..."
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5c7c9b] hover:text-[#1f2732] cursor-pointer"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Right Action Group: View Mode Switcher & Export */}
          <div className="flex items-center gap-3 justify-between sm:justify-end">
            {/* Toggle List/Grid */}
            <div className="inline-flex p-1 rounded-[16px] bg-[#f5f7fa]/80 dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 shrink-0">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-4 py-2 rounded-[12px] text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                    : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-200"
                )}
              >
                <List className="size-4" />
                <span>Lista</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-4 py-2 rounded-[12px] text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer",
                  viewMode === "grid"
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                    : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-200"
                )}
              >
                <LayoutGrid className="size-4" />
                <span>Cuadrícula</span>
              </button>
            </div>

            {/* Clear All Filters button (if active) */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-12 px-4 rounded-[16px] text-xs sm:text-sm font-bold text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-1.5"
              >
                <span>Limpiar todo</span>
                <X className="size-4" />
              </Button>
            )}

            {/* Export CSV Button */}
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="h-12 bg-white dark:bg-zinc-900 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 text-[#1f2732] dark:text-zinc-200 font-extrabold text-xs sm:text-sm rounded-[16px] px-4 flex items-center gap-2 border border-[#d2dbe5] dark:border-zinc-800 cursor-pointer"
            >
              <FileDown className="size-4.5" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>

        {/* Always Visible Filters Grid Row (Using shadcnui Select) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
          
          {/* Filter 1: Category with shadcnui Select */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#5c7c9b] dark:text-zinc-400">Categoría</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full h-12 rounded-[16px] border border-[#d2dbe5] dark:border-zinc-800 bg-[#f5f7fa]/60 dark:bg-zinc-900/40 text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-100 cursor-pointer px-4">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent className="rounded-[18px] border border-[#ebeef3] dark:border-zinc-800 bg-popover shadow-lg">
                <SelectItem value="all" className="font-semibold text-xs sm:text-sm cursor-pointer rounded-[12px]">
                  Todas las categorías
                </SelectItem>
                {categoriesList.map((cat) => (
                  <SelectItem key={cat} value={cat} className="font-semibold text-xs sm:text-sm cursor-pointer rounded-[12px]">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter 2: Location / Zone with shadcnui Select */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#5c7c9b] dark:text-zinc-400">Zona / Ubicación</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full h-12 rounded-[16px] border border-[#d2dbe5] dark:border-zinc-800 bg-[#f5f7fa]/60 dark:bg-zinc-900/40 text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-100 cursor-pointer px-4">
                <SelectValue placeholder="Todas las zonas" />
              </SelectTrigger>
              <SelectContent className="rounded-[18px] border border-[#ebeef3] dark:border-zinc-800 bg-popover shadow-lg">
                <SelectItem value="all" className="font-semibold text-xs sm:text-sm cursor-pointer rounded-[12px]">
                  Todas las zonas
                </SelectItem>
                {locationsList.map((loc) => (
                  <SelectItem key={loc} value={loc} className="font-semibold text-xs sm:text-sm cursor-pointer rounded-[12px]">
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter 3: Status Toggle Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#5c7c9b] dark:text-zinc-400">Estado de Publicación</label>
            <div className="grid grid-cols-3 gap-2 p-1 rounded-[16px] bg-[#f5f7fa]/80 dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800 h-12 items-center">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "h-10 rounded-[12px] text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center",
                  statusFilter === "all"
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                    : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-200"
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "h-10 rounded-[12px] text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center",
                  statusFilter === "active"
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                    : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-200"
                )}
              >
                Activas
              </button>
              <button
                onClick={() => setStatusFilter("paused")}
                className={cn(
                  "h-10 rounded-[12px] text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center",
                  statusFilter === "paused"
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                    : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-200"
                )}
              >
                Pausadas
              </button>
            </div>
          </div>

        </div>
      </Card>

      {/* ========================================== */}
      {/* DATA AREA: TABLE OR GRID VIEW              */}
      {/* ========================================== */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] bg-white dark:bg-[#18181b] overflow-hidden shadow-xs p-8 space-y-4">
            <Skeleton className="h-12 w-full rounded-[16px]" />
            <Skeleton className="h-16 w-full rounded-[16px]" />
            <Skeleton className="h-16 w-full rounded-[16px]" />
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="text-center py-10 sm:py-12 px-6 border-2 border-dashed border-[#d2dbe5] dark:border-zinc-800 rounded-[28px] bg-white dark:bg-[#18181b]/50 shadow-xs">
            <Briefcase className="size-12 stroke-[1.4] mx-auto mb-3 text-[#5c7c9b]/60 dark:text-zinc-600" />
            <p className="text-base sm:text-lg font-extrabold text-[#1f2732] dark:text-zinc-100">No se encontraron vacantes</p>
            <p className="text-xs sm:text-sm font-medium mt-1 max-w-sm mx-auto leading-relaxed text-[#5c7c9b] dark:text-zinc-400">
              No hay ofertas de empleo que coincidan con los filtros o la búsqueda aplicada actualmente.
            </p>
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                className="mt-5 bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#253240] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-extrabold text-xs sm:text-sm px-6 h-11 rounded-[14px] border-none cursor-pointer shadow-xs"
              >
                Limpiar Filtros
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === "list" ? (
              // ==========================================
              // LIST VIEW (TABLE)
              // ==========================================
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <VacanciesTable
                  data={filteredVacancies}
                  onToggleActive={handleToggleActive}
                  onBatchStatusChange={handleBatchStatusChange}
                  onDeleteVacancy={(id) => setDeletingVacancyId(id)}
                  formatSalary={formatSalary}
                  formatDate={formatDate}
                />
              </motion.div>
            ) : (
              // ==========================================
              // GRID VIEW
              // ==========================================
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredVacancies.map((vacancy) => (
                  <Card
                    key={vacancy.id}
                    className={cn(
                      "bg-white dark:bg-[#18181b] border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] p-6 flex flex-col justify-between h-[280px] shadow-xs relative group hover:border-[#1f2732]/30 dark:hover:border-zinc-700 transition-all duration-200",
                      !vacancy.is_active && "opacity-75"
                    )}
                  >
                    <div>
                      {/* Top Header Row of Card */}
                      <div className="flex justify-between items-start">
                        <div className="size-12 rounded-[16px] bg-[#f5f7fa] dark:bg-zinc-900 text-[#1f2732] dark:text-zinc-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Briefcase className="size-6 text-[#1f2732] dark:text-zinc-100" />
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100 p-2 cursor-pointer rounded-xl hover:bg-[#f5f7fa] dark:hover:bg-zinc-800">
                              <MoreHorizontal className="size-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-[18px] border border-[#ebeef3] dark:border-zinc-800 bg-popover min-w-[170px] shadow-lg p-2">
                            <DropdownMenuItem asChild className="cursor-pointer text-xs sm:text-sm font-bold text-[#1f2732] dark:text-zinc-200 rounded-[12px] hover:bg-muted py-3 px-3 gap-3">
                              <Link href={`/dashboard/company/vacancies/${vacancy.id}`}>
                                <Eye className="size-4 text-[#5c7c9b]" />
                                <span>Ver detalles</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer text-xs sm:text-sm font-bold text-[#1f2732] dark:text-zinc-200 rounded-[12px] hover:bg-muted py-3 px-3 gap-3">
                              <Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`}>
                                <Edit2 className="size-4 text-[#5c7c9b]" />
                                <span>Editar</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setDeletingVacancyId(vacancy.id)}
                              className="cursor-pointer text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 rounded-[12px] hover:bg-rose-500/10 focus:bg-rose-500/10 py-3 px-3 gap-3"
                            >
                              <Trash2 className="size-4 text-rose-500" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Title & Category info */}
                      <div className="mt-4 space-y-1">
                        <h4 className="text-[16px] sm:text-[17px] font-[800] text-[#1f2732] dark:text-zinc-100 line-clamp-1 leading-snug">
                          {vacancy.title}
                        </h4>
                        <p className="text-[11px] text-[#5c7c9b] dark:text-zinc-400 font-extrabold uppercase tracking-wider">
                          {vacancy.category}
                        </p>
                      </div>

                      {/* Location badges */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge className="bg-[#f5f7fa] dark:bg-zinc-900 text-[#1f2732] dark:text-zinc-200 hover:bg-[#eef2f6] border-none font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-[#5c7c9b]" />
                          <span>{vacancy.zone || vacancy.location}</span>
                        </Badge>
                        <Badge 
                          onClick={() => handleToggleActive(vacancy.id, vacancy.is_active)}
                          className={cn(
                            "border-none font-extrabold text-xs px-3 py-1 rounded-full cursor-pointer transition-opacity select-none",
                            vacancy.is_active
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:opacity-80"
                          )}
                        >
                          {vacancy.is_active ? "Activa" : "Pausada"}
                        </Badge>
                      </div>
                    </div>

                    {/* Bottom row of card */}
                    <div className="flex items-center justify-between border-t border-[#ebeef3] dark:border-zinc-800 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#5c7c9b]">Sueldo</span>
                        <span className="text-sm sm:text-base font-[800] text-[#1f2732] dark:text-zinc-100">
                          {formatSalary(vacancy.salary_min, vacancy.salary_max)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#5c7c9b] dark:text-zinc-400 font-semibold">
                        <Calendar className="size-3.5" />
                        <span>{formatDate(vacancy.created_at)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Alert Dialog for Confirming Deletion */}
      <AlertDialog
        open={deletingVacancyId !== null}
        onOpenChange={(open) => !open && setDeletingVacancyId(null)}
      >
        <AlertDialogContent className="rounded-[28px] border border-[#ebeef3] dark:border-zinc-800 p-7">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-extrabold text-[#1f2732] dark:text-zinc-100">
              ¿Estás seguro de que deseas eliminar esta vacante?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm font-semibold text-[#5c7c9b] dark:text-zinc-400 leading-relaxed mt-2">
              Esta acción es permanente y no se podrá deshacer. Los candidatos ya no podrán postularse ni ver esta oferta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel 
              onClick={() => setDeletingVacancyId(null)}
              className="rounded-[16px] font-bold text-xs sm:text-sm h-12 px-6"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingVacancyId) {
                  confirmDeleteVacancy(deletingVacancyId);
                }
              }}
              className="rounded-[16px] font-extrabold text-xs sm:text-sm h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white border-none"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
