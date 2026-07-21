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
  const [showFilters, setShowFilters] = React.useState(false);
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

  // Categories extracted from loaded vacancies
  const categoriesList = React.useMemo(() => {
    const cats = new Set<string>();
    vacancies.forEach(v => {
      if (v.category) cats.add(v.category);
    });
    return Array.from(cats);
  }, [vacancies]);

  // Locations / Zones extracted from loaded vacancies
  const locationsList = React.useMemo(() => {
    const locs = new Set<string>();
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

  const hasActiveFilters = categoryFilter !== "all" || locationFilter !== "all" || statusFilter !== "all" || searchQuery !== "";

  return (
    <div className="flex-grow min-h-screen bg-fiord-50/20 dark:bg-[#18181B] px-4 py-8 md:px-10 lg:px-12 space-y-8 animate-in fade-in duration-300">
      
      {/* ========================================== */}
      {/* HEADER SECTION                             */}
      {/* ========================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pb-2 border-b border-fiord-100/50 dark:border-fiord-800/40">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <h2 className="text-2xl font-bold text-fiord-900 dark:text-fiord-50 tracking-tight md:text-3xl">
              Gestionar Vacantes
            </h2>
            {!isProfileIncomplete && !loadingProfile && profile && !profile.is_validated && (
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold px-3 py-0.5 text-xs rounded-full w-fit animate-pulse">
                ✨ Perfil Completo • Verificación en Proceso
              </Badge>
            )}
            {!isProfileIncomplete && !loadingProfile && profile && profile.is_validated && (
              <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-0.5 text-xs rounded-full w-fit flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                <span>Empresa Verificada</span>
              </Badge>
            )}
          </div>
          <p className="text-xs md:text-sm text-fiord-400 dark:text-fiord-500 mt-1 font-semibold">
            Controla las ofertas activas y marca las plazas cubiertas desde tu panel.
          </p>
        </div>

        <Button
          asChild
          disabled={isProfileIncomplete}
          className="bg-fiord-950 dark:bg-fiord-50 hover:bg-fiord-900 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 font-bold px-5 h-10 rounded-xl flex items-center gap-2 active:scale-95 transition-all text-xs tracking-wider disabled:opacity-50 disabled:pointer-events-none"
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
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            className="w-full sm:w-fit h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shrink-0 border-none"
          >
            <Link href="/dashboard/company/profile">
              Completar Perfil
            </Link>
          </Button>
        </Alert>
      )}

      {/* ========================================== */}
      {/* FILTER & VIEW TOGGLE CONTROLLER BAR        */}
      {/* ========================================== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#202023] p-3 rounded-2xl border border-fiord-100/60 dark:border-fiord-800/40 shadow-xs shrink-0">
        
        {/* Toggle List/Grid (Left side) */}
        <div className="inline-flex p-1 rounded-xl bg-fiord-50/50 dark:bg-fiord-900/30 border border-fiord-100/30 dark:border-fiord-800/20 shrink-0">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
              viewMode === "list"
                ? "bg-white dark:bg-fiord-950 text-fiord-950 dark:text-fiord-50 shadow-xs"
                : "text-fiord-500 hover:text-fiord-900 dark:text-fiord-400 dark:hover:text-fiord-200"
            )}
          >
            <List className="size-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
              viewMode === "grid"
                ? "bg-white dark:bg-fiord-950 text-fiord-950 dark:text-fiord-50 shadow-xs"
                : "text-fiord-500 hover:text-fiord-900 dark:text-fiord-400 dark:hover:text-fiord-200"
            )}
          >
            <LayoutGrid className="size-3.5" />
            <span>Grid</span>
          </button>
        </div>

        {/* Global Search & Actions Buttons (Right side) */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search input in control bar */}
          <div className="relative flex-grow md:max-w-xs min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fiord-400 dark:text-fiord-500 size-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 bg-fiord-50/20 dark:bg-fiord-950/20 border border-fiord-100 dark:border-fiord-800 rounded-xl text-xs font-semibold placeholder-fiord-400 dark:placeholder-fiord-500 text-fiord-900 dark:text-fiord-100 outline-none focus:border-fiord-300 dark:focus:border-fiord-700 focus:ring-1 focus:ring-fiord-300/35 transition-all"
              placeholder="Buscar puesto o categoría..."
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fiord-400 hover:text-fiord-900"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Filter Trigger Button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={cn(
              "h-9 rounded-xl text-xs font-bold px-4 flex items-center gap-2 border border-fiord-100/80 dark:border-fiord-800/80 transition-all",
              showFilters || hasActiveFilters
                ? "bg-fiord-950 dark:bg-fiord-50 text-white dark:text-fiord-950 hover:bg-fiord-900 dark:hover:bg-fiord-100"
                : "bg-white dark:bg-fiord-900/10 text-fiord-700 dark:text-fiord-300 hover:bg-fiord-50 dark:hover:bg-fiord-900/40"
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
            )}
          </Button>

          {/* Export CSV Button */}
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="h-9 bg-white dark:bg-fiord-900/10 hover:bg-fiord-50 dark:hover:bg-fiord-900/40 text-fiord-700 dark:text-fiord-300 font-bold text-xs rounded-xl px-4 flex items-center gap-2 border border-fiord-100/80 dark:border-fiord-800/80"
          >
            <FileDown className="size-3.5" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* ========================================== */}
      {/* COLLAPSIBLE ADVANCED FILTER PANEL          */}
      {/* ========================================== */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.25 } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <Card className="bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-fiord-900 dark:text-fiord-100">Filtros Avanzados</span>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs font-semibold text-fiord-500 hover:text-fiord-950 dark:hover:text-fiord-50 flex items-center gap-1 transition-colors"
                  >
                    <span>Limpiar todo</span>
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Filter 1: Category */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500">Categoría</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full h-9 rounded-xl border border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-xs px-3 font-semibold text-fiord-700 dark:text-fiord-300 outline-none focus:border-fiord-300 transition-all"
                  >
                    <option value="all">Todas las categorías</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Filter 2: Location / Zone */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500">Zona / Ubicación</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full h-9 rounded-xl border border-fiord-100 dark:border-fiord-800 bg-fiord-50/20 dark:bg-fiord-950/20 text-xs px-3 font-semibold text-fiord-700 dark:text-fiord-300 outline-none focus:border-fiord-300 transition-all"
                  >
                    <option value="all">Todas las zonas</option>
                    {locationsList.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Filter 3: Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-fiord-400 dark:text-fiord-500">Estado de Publicación</label>
                  <div className="grid grid-cols-3 gap-1.5 p-0.5 rounded-xl bg-fiord-50/30 dark:bg-fiord-950/30 border border-fiord-100/50 dark:border-fiord-800/40">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={cn(
                        "py-1 rounded-lg text-[10.5px] font-bold transition-all",
                        statusFilter === "all"
                          ? "bg-white dark:bg-fiord-950 text-fiord-950 dark:text-fiord-50 shadow-xs"
                          : "text-fiord-500 hover:text-fiord-800 dark:text-fiord-400"
                      )}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setStatusFilter("active")}
                      className={cn(
                        "py-1 rounded-lg text-[10.5px] font-bold transition-all",
                        statusFilter === "active"
                          ? "bg-white dark:bg-fiord-950 text-fiord-950 dark:text-fiord-50 shadow-xs"
                          : "text-fiord-500 hover:text-fiord-800 dark:text-fiord-400"
                      )}
                    >
                      Activas
                    </button>
                    <button
                      onClick={() => setStatusFilter("paused")}
                      className={cn(
                        "py-1 rounded-lg text-[10.5px] font-bold transition-all",
                        statusFilter === "paused"
                          ? "bg-white dark:bg-fiord-950 text-fiord-950 dark:text-fiord-50 shadow-xs"
                          : "text-fiord-500 hover:text-fiord-800 dark:text-fiord-400"
                      )}
                    >
                      Pausadas
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* DATA AREA: TABLE OR GRID VIEW              */}
      {/* ========================================== */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="border border-fiord-100 dark:border-fiord-800 rounded-[24px] bg-white dark:bg-[#202023] overflow-hidden shadow-xs">
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        ) : filteredVacancies.length === 0 ? (
          <div className="text-center py-20 text-fiord-400 dark:text-fiord-500 border border-dashed border-fiord-200 dark:border-fiord-800 rounded-[28px] bg-white dark:bg-[#202023]/20 shadow-xs">
            <Briefcase className="size-12 stroke-[1.2] mx-auto mb-3 text-fiord-300 dark:text-fiord-600" />
            <p className="text-sm font-bold text-fiord-900 dark:text-fiord-100">No se encontraron vacantes</p>
            <p className="text-xs mt-1 max-w-[280px] mx-auto leading-relaxed text-fiord-400">
              No hay ofertas que coincidan con los filtros de búsqueda aplicados actualmente.
            </p>
            {hasActiveFilters && (
              <Button
                onClick={handleClearFilters}
                className="mt-4 bg-fiord-950 dark:bg-fiord-50 hover:bg-fiord-900 dark:hover:bg-fiord-100 text-white dark:text-fiord-950 font-semibold text-xs px-4 py-2 rounded-xl border-none"
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
                className="border border-fiord-100 dark:border-fiord-800/80 rounded-[24px] bg-white dark:bg-[#202023] overflow-hidden shadow-xs"
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-fiord-50/40 dark:bg-[#202023]/60 border-b border-fiord-100 dark:border-fiord-800/80">
                      <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-fiord-500 dark:text-fiord-400 py-4.5 px-6">Puesto</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-fiord-500 dark:text-fiord-400 py-4.5">Ubicación / Zona</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-fiord-500 dark:text-fiord-400 py-4.5">Sueldo Ofrecido</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-fiord-500 dark:text-fiord-400 py-4.5">Estado</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-fiord-500 dark:text-fiord-400 py-4.5">Fecha</TableHead>
                        <TableHead className="font-bold text-xs uppercase tracking-wider text-fiord-500 dark:text-fiord-400 py-4.5 text-right w-[80px] px-6">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVacancies.map((vacancy) => (
                        <TableRow
                          key={vacancy.id}
                          className={cn(
                            "border-b border-fiord-100/50 dark:border-fiord-800/30 transition-colors hover:bg-fiord-50/20 dark:hover:bg-fiord-900/10 border-none",
                            !vacancy.is_active && "opacity-75"
                          )}
                        >
                          {/* Puesto Column */}
                          <TableCell className="py-4.5 px-6">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-[13.5px] text-fiord-900 dark:text-fiord-50">
                                {vacancy.title}
                              </span>
                              <span className="text-[11px] text-fiord-450 dark:text-fiord-500 font-semibold uppercase tracking-wider">
                                {vacancy.category}
                              </span>
                            </div>
                          </TableCell>

                          {/* Ubicación Column */}
                          <TableCell className="py-4.5">
                            <div className="flex items-center gap-1.5 text-xs text-fiord-600 dark:text-fiord-300 font-semibold">
                              <MapPin className="size-3.5 text-fiord-400 shrink-0" />
                              <span>{vacancy.zone || vacancy.location}</span>
                            </div>
                          </TableCell>

                          {/* Sueldo Column */}
                          <TableCell className="py-4.5 font-bold text-xs text-fiord-800 dark:text-fiord-200">
                            {formatSalary(vacancy.salary_min, vacancy.salary_max)}
                          </TableCell>

                          {/* Estado Column */}
                          <TableCell className="py-4.5">
                            <Badge
                              variant="secondary"
                              onClick={() => handleToggleActive(vacancy.id, vacancy.is_active)}
                              className={cn(
                                "text-[9.5px] font-bold tracking-wider uppercase px-2.5 h-6 flex items-center w-fit border cursor-pointer hover:opacity-85 select-none rounded-full",
                                vacancy.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border-emerald-500/20"
                                  : "bg-fiord-50 text-fiord-500 border-fiord-100 dark:bg-fiord-800 dark:text-fiord-400 dark:border-fiord-700"
                              )}
                            >
                              {vacancy.is_active ? "Activa" : "Pausada"}
                            </Badge>
                          </TableCell>

                          {/* Fecha Column */}
                          <TableCell className="py-4.5 text-xs text-fiord-450 dark:text-fiord-500 font-semibold">
                            {formatDate(vacancy.created_at)}
                          </TableCell>

                          {/* Acciones Column */}
                          <TableCell className="py-4.5 text-right px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 rounded-lg border border-fiord-100/50 dark:border-fiord-800/40 hover:bg-fiord-50 dark:hover:bg-fiord-900/60"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-fiord-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border border-fiord-100/80 dark:border-fiord-800 bg-popover min-w-[140px] shadow-sm">
                                <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold text-fiord-700 dark:text-fiord-350 rounded-lg hover:bg-muted py-2 gap-2">
                                  <Link href={`/dashboard/company/vacancies/${vacancy.id}`}>
                                    <Eye className="size-3.5 text-fiord-400" />
                                    <span>Ver detalles</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold text-fiord-700 dark:text-fiord-350 rounded-lg hover:bg-muted py-2 gap-2">
                                  <Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`}>
                                    <Edit2 className="size-3.5 text-fiord-400" />
                                    <span>Editar</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => setDeletingVacancyId(vacancy.id)}
                                  className="cursor-pointer text-xs font-semibold text-red-650 focus:text-red-750 dark:text-red-400 dark:focus:text-red-400 rounded-lg hover:bg-red-500/5 focus:bg-red-500/5 py-2 gap-2"
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
                      "bg-white dark:bg-[#202023] border-fiord-100/60 dark:border-fiord-800/40 rounded-[24px] p-5 flex flex-col justify-between h-[250px] shadow-sm relative group hover:border-fiord-200 dark:hover:border-fiord-700 transition-all duration-200",
                      !vacancy.is_active && "opacity-75"
                    )}
                  >
                    <div>
                      {/* Top Header Row of Card */}
                      <div className="flex justify-between items-start">
                        <div className="size-10 rounded-xl bg-fiord-50 dark:bg-fiord-900/40 text-fiord-900 dark:text-fiord-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Briefcase className="size-5" />
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-fiord-400 hover:text-fiord-900 dark:hover:text-fiord-100 p-1">
                              <MoreHorizontal className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border border-fiord-100/80 dark:border-fiord-800 bg-popover min-w-[140px] shadow-sm">
                            <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold text-fiord-700 dark:text-fiord-350 rounded-lg hover:bg-muted py-2 gap-2">
                              <Link href={`/dashboard/company/vacancies/${vacancy.id}`}>
                                <Eye className="size-3.5 text-fiord-400" />
                                <span>Ver detalles</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer text-xs font-semibold text-fiord-700 dark:text-fiord-350 rounded-lg hover:bg-muted py-2 gap-2">
                              <Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`}>
                                <Edit2 className="size-3.5 text-fiord-400" />
                                <span>Editar</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setDeletingVacancyId(vacancy.id)}
                              className="cursor-pointer text-xs font-semibold text-red-650 focus:text-red-750 dark:text-red-400 dark:focus:text-red-400 rounded-lg hover:bg-red-500/5 focus:bg-red-500/5 py-2 gap-2"
                            >
                              <Trash2 className="size-3.5 text-red-500" />
                              <span>Eliminar</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Title & Category info */}
                      <div className="mt-4 space-y-1">
                        <h4 className="text-[14.5px] font-bold text-fiord-900 dark:text-fiord-50 line-clamp-1 leading-snug">
                          {vacancy.title}
                        </h4>
                        <p className="text-[10px] text-fiord-450 dark:text-fiord-500 font-bold uppercase tracking-wider">
                          {vacancy.category}
                        </p>
                      </div>

                      {/* Location badges */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        <Badge className="bg-fiord-50 dark:bg-fiord-900/30 text-fiord-700 dark:text-fiord-300 hover:bg-fiord-100 border-none font-bold text-[9px] px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <MapPin className="size-2.5" />
                          <span>{vacancy.zone || vacancy.location}</span>
                        </Badge>
                        <Badge 
                          onClick={() => handleToggleActive(vacancy.id, vacancy.is_active)}
                          className={cn(
                            "border-none font-bold text-[9px] px-2.5 py-0.5 rounded-full cursor-pointer transition-opacity select-none",
                            vacancy.is_active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-fiord-50 text-fiord-500 dark:bg-fiord-900/40 dark:text-fiord-400 hover:opacity-80"
                          )}
                        >
                          {vacancy.is_active ? "Activa" : "Pausada"}
                        </Badge>
                      </div>
                    </div>

                    {/* Bottom row of card */}
                    <div className="flex items-center justify-between border-t border-fiord-100/50 dark:border-fiord-800/40 pt-3.5">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase tracking-wider font-bold text-fiord-400 dark:text-fiord-500">Sueldo</span>
                        <span className="text-xs font-bold text-fiord-800 dark:text-fiord-200">
                          {formatSalary(vacancy.salary_min, vacancy.salary_max)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-fiord-400 dark:text-fiord-500 font-bold uppercase tracking-wider">
                        <Calendar className="size-3" />
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
        <AlertDialogContent className="rounded-2xl border-fiord-100 dark:border-fiord-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-fiord-900 dark:text-fiord-50">
              ¿Estás seguro de que deseas eliminar esta vacante?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-semibold text-fiord-500 dark:text-fiord-400 leading-relaxed">
              Esta acción es permanente y no se podrá deshacer. Los candidatos ya no podrán postularse ni ver esta oferta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => setDeletingVacancyId(null)}
              className="rounded-xl font-bold text-xs h-10"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingVacancyId) {
                  confirmDeleteVacancy(deletingVacancyId);
                }
              }}
              className="rounded-xl font-bold text-xs h-10 bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
