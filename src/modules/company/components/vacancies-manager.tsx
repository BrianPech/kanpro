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
  FileDown,
  LayoutGrid,
  List,
  X,
  Calendar,
  Copy,
  Users,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { cloneVacancyAction } from "../actions/vacancies";

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
          nextState ? "Vacante activada con éxito" : "Vacante pausada",
          {
            description: nextState
              ? "La oferta vuelve a estar visible para candidatos locales."
              : "La oferta se ha pausado temporalmente.",
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

  const handleCloneVacancy = async (id: string) => {
    try {
      toast.loading("Duplicando vacante...", { id: "clone-vac" });
      const res = await cloneVacancyAction(id);
      if (res.success) {
        toast.success("¡Vacante duplicada exitosamente!", {
          id: "clone-vac",
          description: `Se ha creado "${res.title}" en borrador.`,
        });
        await loadVacancies();
      }
    } catch (err: any) {
      toast.error("Error al duplicar vacante", {
        id: "clone-vac",
        description: err.message || "No se pudo duplicar la vacante.",
      });
    }
  };

  // Standard default categories and zones
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
    "Tulum",
  ];

  const categoriesList = React.useMemo(() => {
    const cats = new Set<string>(DEFAULT_CATEGORIES);
    vacancies.forEach(v => {
      if (v.category) cats.add(v.category);
    });
    return Array.from(cats);
  }, [vacancies]);

  const locationsList = React.useMemo(() => {
    const locs = new Set<string>(DEFAULT_ZONES);
    vacancies.forEach(v => {
      const displayLoc = v.zone || v.location;
      if (displayLoc) locs.add(displayLoc);
    });
    return Array.from(locs);
  }, [vacancies]);

  // Metrics summary
  const metrics = React.useMemo(() => {
    const total = vacancies.length;
    const active = vacancies.filter((v) => v.is_active).length;
    const paused = total - active;
    const totalApplicants = vacancies.reduce((acc, v: any) => acc + (v.applicants_count || 0), 0);
    return { total, active, paused, totalApplicants };
  }, [vacancies]);

  // Filtering logic
  const filteredVacancies = React.useMemo(() => {
    return vacancies.filter((v) => {
      const matchesSearch =
        searchQuery === "" ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.category?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (v.zone?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (v.location?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || v.category === categoryFilter;

      const matchesLocation =
        locationFilter === "all" ||
        v.zone === locationFilter ||
        v.location === locationFilter;

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
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const companyLabel = profile?.company_name
      ? profile.company_name.toLowerCase().replace(/\s+/g, "_")
      : "empresa";
    link.setAttribute("download", `vacantes_${companyLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("¡Reporte de vacantes exportado con éxito!");
  };

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
    return "A convenir";
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
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      
      {/* Verification status pill (if verified) */}
      {!loadingProfile && profile?.is_validated && (
        <div className="flex items-center">
          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold text-xs px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" />
            <span>Empresa Verificada</span>
          </Badge>
        </div>
      )}

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Ofertas</span>
            <div className="size-8 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight leading-none">
              {metrics.total}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">convocatorias registradas</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Activas</span>
            <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight leading-none">
              {metrics.active}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">visibles para candidatos</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pausadas</span>
            <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight leading-none">
              {metrics.paused}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">temporalmente ocultas</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Postulantes</span>
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight leading-none">
              {metrics.totalApplicants}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">candidatos recibidos</p>
          </div>
        </Card>
      </div>

      {/* Profile Incomplete Warning Banner */}
      {isProfileIncomplete && !loadingProfile && (
        <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <AlertTitle className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Perfil de Empresa Incompleto
              </AlertTitle>
              <AlertDescription className="text-xs font-medium text-amber-800 dark:text-amber-300/90 leading-relaxed">
                Completa los datos esenciales de tu negocio (Nombre, WhatsApp y Dirección) para publicar vacantes con verificación.
              </AlertDescription>
            </div>
          </div>
          <Button
            size="sm"
            render={<Link href="/dashboard/company/profile" />}
            className="h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 px-4"
          >
            Completar Perfil
          </Button>
        </Alert>
      )}

      {/* 3. Unified Filters & Data Card */}
      <Card className="bg-card border border-border/60 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Toolbar & Filters (Inside Card Header) */}
        <div className="p-4 sm:p-5 space-y-4 border-b border-border/60">
          {/* Top Control Bar: Search & View Switcher */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            
            {/* Global Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 h-10 bg-muted/40 border border-border/60 rounded-xl text-xs sm:text-sm font-medium placeholder:text-muted-foreground text-foreground outline-none focus:border-primary transition-all"
                placeholder="Buscar por puesto, categoría o zona..."
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Right Action Group: View Mode Switcher & Export */}
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              {/* Toggle List/Grid */}
              <div className="inline-flex p-1 rounded-xl bg-muted border border-border/50 shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="size-3.5" />
                  <span className="hidden sm:inline">Lista</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="size-3.5" />
                  <span className="hidden sm:inline">Cuadrícula</span>
                </button>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer flex items-center gap-1"
                >
                  <span>Limpiar</span>
                  <X className="size-3.5" />
                </Button>
              )}

              {/* Export CSV Button */}
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="h-9 font-semibold text-xs rounded-xl px-3 flex items-center gap-1.5 border border-border/60 cursor-pointer"
              >
                <FileDown className="size-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>

          {/* Dropdown Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Categoría</label>
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
                <SelectTrigger className="w-full h-9 rounded-xl border border-border/60 bg-muted/40 text-xs font-medium text-foreground cursor-pointer px-3">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-lg">
                  <SelectItem value="all" className="font-medium text-xs cursor-pointer rounded-lg">
                    Todas las categorías
                  </SelectItem>
                  {categoriesList.map((cat) => (
                    <SelectItem key={cat} value={cat} className="font-medium text-xs cursor-pointer rounded-lg">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Zona / Ubicación</label>
              <Select value={locationFilter} onValueChange={(val) => setLocationFilter(val || "all")}>
                <SelectTrigger className="w-full h-9 rounded-xl border border-border/60 bg-muted/40 text-xs font-medium text-foreground cursor-pointer px-3">
                  <SelectValue placeholder="Todas las zonas" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-lg">
                  <SelectItem value="all" className="font-medium text-xs cursor-pointer rounded-lg">
                    Todas las zonas
                  </SelectItem>
                  {locationsList.map((loc) => (
                    <SelectItem key={loc} value={loc} className="font-medium text-xs cursor-pointer rounded-lg">
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Estado</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-muted border border-border/50 h-9 items-center">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                    statusFilter === "all"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={cn(
                    "h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                    statusFilter === "active"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Activas
                </button>
                <button
                  onClick={() => setStatusFilter("paused")}
                  className={cn(
                    "h-7 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center",
                    statusFilter === "paused"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Pausadas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Area: Table or Grid View (Inside Unified Card) */}
        <div>
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : filteredVacancies.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Briefcase className="size-10 stroke-[1.4] mx-auto mb-3 text-muted-foreground/60" />
              <p className="text-base font-bold text-foreground">No se encontraron vacantes</p>
              <p className="text-xs font-medium mt-1 max-w-sm mx-auto leading-relaxed text-muted-foreground">
                No hay ofertas de empleo que coincidan con los filtros o la búsqueda aplicada.
              </p>
              {hasActiveFilters && (
                <Button
                  onClick={handleClearFilters}
                  size="sm"
                  className="mt-4 font-bold text-xs px-5 h-9 rounded-xl cursor-pointer shadow-xs"
                >
                  Limpiar Filtros
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === "list" ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <VacanciesTable
                    data={filteredVacancies}
                    onToggleActive={handleToggleActive}
                    onBatchStatusChange={handleBatchStatusChange}
                    onDeleteVacancy={(id) => setDeletingVacancyId(id)}
                    onCloneVacancy={handleCloneVacancy}
                    formatSalary={formatSalary}
                    formatDate={formatDate}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filteredVacancies.map((vacancy) => (
                    <Card
                      key={vacancy.id}
                      className={cn(
                        "bg-card border border-border/60 rounded-xl p-4 flex flex-col justify-between min-h-[200px] shadow-xs relative group hover:border-primary/40 transition-all duration-200",
                        !vacancy.is_active && "opacity-80"
                      )}
                    >
                      <div>
                        {/* Top Header Row of Card */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-md font-semibold">
                              {vacancy.category || "General"}
                            </Badge>
                            <Badge 
                              onClick={() => handleToggleActive(vacancy.id, vacancy.is_active)}
                              className={cn(
                                "border-none font-bold text-[9px] px-2 py-0.5 rounded-full cursor-pointer select-none transition-all",
                                vacancy.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              )}
                            >
                              {vacancy.is_active ? "Activa" : "Pausada"}
                            </Badge>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <button className="text-muted-foreground hover:text-foreground p-1 cursor-pointer rounded-lg hover:bg-muted transition-colors" />
                              }
                            >
                              <MoreHorizontal className="size-4.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border border-border/60 bg-popover min-w-[160px] shadow-lg p-1.5">
                              <DropdownMenuItem
                                render={<Link href={`/dashboard/company/vacancies/${vacancy.id}`} />}
                                className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2.5"
                              >
                                <Eye className="size-3.5 text-muted-foreground" />
                                <span>Ver detalles</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                render={<Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`} />}
                                className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2.5"
                              >
                                <Edit2 className="size-3.5 text-muted-foreground" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleCloneVacancy(vacancy.id)}
                                className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2.5"
                              >
                                <Copy className="size-3.5 text-muted-foreground" />
                                <span>Duplicar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setDeletingVacancyId(vacancy.id)}
                                className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 focus:bg-rose-500/10 py-2 px-2.5 gap-2.5"
                              >
                                <Trash2 className="size-3.5 text-rose-500" />
                                <span>Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Title & Salary */}
                        <div className="mt-3 space-y-1">
                          <Link href={`/dashboard/company/vacancies/${vacancy.id}`} className="hover:underline">
                            <h4 className="text-sm sm:text-base font-bold text-foreground line-clamp-1">
                              {vacancy.title}
                            </h4>
                          </Link>
                          <p className="text-xs font-bold text-foreground font-mono">
                            {formatSalary(vacancy.salary_min, vacancy.salary_max)}
                          </p>
                        </div>

                        {/* Location */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{vacancy.zone || vacancy.location || "Mérida"}</span>
                        </div>
                      </div>

                      {/* Bottom row of card */}
                      <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground font-medium">
                          <Calendar className="size-3" />
                          <span>{formatDate(vacancy.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                          <Users className="size-3 text-muted-foreground" />
                          <span>{(vacancy as any).applicants_count ?? 0}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </Card>

      {/* Alert Dialog for Confirming Deletion */}
      <AlertDialog
        open={deletingVacancyId !== null}
        onOpenChange={(open) => !open && setDeletingVacancyId(null)}
      >
        <AlertDialogContent className="rounded-2xl border border-border/60 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              ¿Eliminar esta vacante?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed mt-1">
              Esta acción es permanente. Los candidatos ya no podrán postularse ni visualizar esta oferta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel 
              onClick={() => setDeletingVacancyId(null)}
              className="rounded-xl font-semibold text-xs h-10 px-4"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingVacancyId) {
                  confirmDeleteVacancy(deletingVacancyId);
                }
              }}
              className="rounded-xl font-bold text-xs h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white border-none"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
