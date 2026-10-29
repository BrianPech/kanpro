"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
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
  X,
  Calendar,
  Copy,
  Users,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useVacancyManager, type VacancyRow } from "@/modules/company/hooks/use-vacancy-manager";
import { cloneVacancyAction } from "../actions/vacancies";
import { VacancyPreviewDrawer } from "./vacancy-preview-drawer";
import { CompanyPageHeader } from "./shared/company-page-header";
import { CompanyStatusBadge } from "./shared/company-status-badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export interface VacancyItem extends VacancyRow {
  applicants_count?: number;
}

export function VacanciesManager({ userId }: { userId: string }) {
  const [vacancies, setVacancies] = React.useState<VacancyItem[]>([]);
  const [previewVacancy, setPreviewVacancy] = React.useState<VacancyItem | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deletingVacancyId, setDeletingVacancyId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const deletingVacancy = React.useMemo(() => {
    return vacancies.find((v) => v.id === deletingVacancyId) || null;
  }, [vacancies, deletingVacancyId]);

  // Filters state (all unified inside the table header)
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "paused">("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = React.useState(false);

  // TanStack sorting & selection state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // States for company profile checking
  const [profile, setProfile] = React.useState<any>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  const {
    toggleVacancyStatus,
    fetchCompanyVacancies,
    deleteVacancy,
    loading: isLoading,
  } = useVacancyManager();

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
        .select(
          "company_name, contact_phone, fiscal_address, logo_url, verification_status"
        )
        .eq("id", userId)
        .maybeSingle();

      const company_name =
        compProfile?.company_name || baseProfile?.full_name || "";
      const phone = compProfile?.contact_phone || "configurado";
      const location =
        compProfile?.fiscal_address || baseProfile?.location || "";
      const is_validated =
        (compProfile?.verification_status as any) === "verified" ||
        (compProfile?.verification_status as any) === "approved";

      setProfile({
        company_name,
        phone,
        logo_url: compProfile?.logo_url || null,
        location,
        is_validated,
      });
    } catch (err) {
      console.error("Error loading company profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  }, [userId]);

  const loadVacancies = React.useCallback(async () => {
    try {
      const data = await fetchCompanyVacancies();
      const supabase = createClient();
      const { data: appCounts } = await supabase
        .from("applications")
        .select("vacancy_id");

      const countsMap: Record<string, number> = {};
      appCounts?.forEach((app: any) => {
        if (app.vacancy_id) {
          countsMap[app.vacancy_id] = (countsMap[app.vacancy_id] || 0) + 1;
        }
      });

      const enriched: VacancyItem[] = data.map((v) => ({
        ...v,
        applicants_count: countsMap[v.id] || 0,
      }));

      setVacancies(enriched);
    } catch (err) {
      console.error(err);
    }
  }, [fetchCompanyVacancies]);

  React.useEffect(() => {
    loadProfile();
    loadVacancies();
  }, [loadProfile, loadVacancies]);

  const isProfileIncomplete = React.useMemo(() => {
    if (loadingProfile) return false;
    if (!profile) return false;
    const name = profile.company_name?.trim() || "";
    const addr = profile.location?.trim() || "";
    return !name || name === "Nueva Empresa" || !addr;
  }, [profile, loadingProfile]);

  const handleToggleActive = React.useCallback(async (vacancyId: string, currentActive: boolean) => {
    const nextState = !currentActive;
    try {
      const success = await toggleVacancyStatus(vacancyId, nextState);
      if (success) {
        setVacancies((prev) =>
          prev.map((v) =>
            v.id === vacancyId
              ? {
                  ...v,
                  is_active: nextState,
                  status: nextState ? "Activa" : "Cerrada",
                }
              : v
          )
        );
        setPreviewVacancy((prev) =>
          prev && prev.id === vacancyId
            ? {
                ...prev,
                is_active: nextState,
                status: nextState ? "Activa" : "Cerrada",
              }
            : prev
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
    } catch (err: unknown) {
      toast.error("Error al actualizar la vacante", {
        description: (err as Error).message,
      });
    }
  }, [toggleVacancyStatus]);

  const confirmDeleteVacancy = React.useCallback(async (id: string) => {
    try {
      setIsDeleting(true);
      const success = await deleteVacancy(id);
      if (success) {
        setVacancies((prev) => prev.filter((v) => v.id !== id));
        toast.success("Vacante eliminada con éxito", {
          description: "La oferta ha sido removida permanentemente.",
        });
      }
    } catch (err: unknown) {
      toast.error("Error al eliminar la vacante", {
        description: (err as Error).message || "No se pudo eliminar la vacante.",
      });
    } finally {
      setIsDeleting(false);
      setDeletingVacancyId(null);
    }
  }, [deleteVacancy]);

  const handleCloneVacancy = React.useCallback(async (id: string) => {
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
    } catch (err: unknown) {
      toast.error("Error al duplicar vacante", {
        id: "clone-vac",
        description: (err as Error).message || "No se pudo duplicar la vacante.",
      });
    }
  }, [loadVacancies]);

  const handleBatchStatusChange = async (
    ids: string[],
    newStatus: "Activa" | "Pausada" | "Cerrada"
  ) => {
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
      setRowSelection({});
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

  // Metrics summary
  const metrics = React.useMemo(() => {
    const total = vacancies.length;
    const active = vacancies.filter((v) => v.is_active).length;
    const paused = total - active;
    const totalApplicants = vacancies.reduce(
      (acc, v) => acc + (v.applicants_count || 0),
      0
    );
    const categoriesSet = new Set(
      vacancies.map((v) => v.category).filter(Boolean)
    );
    return {
      total,
      active,
      paused,
      totalApplicants,
      categoriesCount: categoriesSet.size,
    };
  }, [vacancies]);

  // Categories and Zones Lists
  const categoriesList = React.useMemo(() => {
    const cats = new Set<string>();
    vacancies.forEach((v) => {
      if (v.category) cats.add(v.category);
    });
    return Array.from(cats);
  }, [vacancies]);

  const locationsList = React.useMemo(() => {
    const locs = new Set<string>();
    vacancies.forEach((v) => {
      const displayLoc = v.zone || v.location;
      if (displayLoc) locs.add(displayLoc);
    });
    return Array.from(locs);
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

      return (
        matchesSearch && matchesCategory && matchesLocation && matchesStatus
      );
    });
  }, [vacancies, searchQuery, categoryFilter, locationFilter, statusFilter]);

  const isFiltered =
    searchQuery.trim().length > 0 ||
    categoryFilter !== "all" ||
    locationFilter !== "all" ||
    statusFilter !== "all";

  const activeSecondaryFiltersCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (locationFilter !== "all" ? 1 : 0);

  const handleClearFilters = () => {
    setCategoryFilter("all");
    setLocationFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
    setSorting([{ id: "created_at", desc: true }]);
  };

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
    return "A convenir";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Reciente";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
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
      "Modalidad",
      "Sueldo Mínimo",
      "Sueldo Máximo",
      "Postulantes",
      "Estado",
      "Fecha de Publicación",
    ];
    const rows = filteredVacancies.map((v) => [
      `"${v.title.replace(/"/g, '""')}"`,
      `"${(v.category || "General").replace(/"/g, '""')}"`,
      `"${(v.zone || v.location || "Mérida").replace(/"/g, '""')}"`,
      `"${(v.modality || "Presencial").replace(/"/g, '""')}"`,
      v.salary_min || 0,
      v.salary_max || 0,
      v.applicants_count || 0,
      v.is_active ? "Activa" : "Pausada",
      formatDate(v.created_at),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `vacantes_${profile?.company_name ? profile.company_name.toLowerCase().replace(/\s+/g, "_") : "empresa"}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Listado de vacantes exportado a CSV exitosamente");
  };

  // TanStack Table Column Definitions
  const columns = React.useMemo<ColumnDef<VacancyItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="px-1 flex items-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={
                table.getIsSomePageRowsSelected() &&
                !table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Seleccionar todas las vacantes"
              className="cursor-pointer"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-1 flex items-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Seleccionar fila"
              className="cursor-pointer"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "title",
        id: "title",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Puesto / Categoría</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div className="space-y-0.5 py-1 min-w-[200px]">
              <button
                type="button"
                onClick={() => setPreviewVacancy(vacancy)}
                className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-1 block text-left cursor-pointer"
                title="Ver detalles de la vacante"
              >
                {vacancy.title}
              </button>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold px-2 py-0 border-border/30 bg-muted/40"
                >
                  {vacancy.category || "General"}
                </Badge>
                {vacancy.employment_type && (
                  <span className="text-[10px] text-muted-foreground">
                    • {vacancy.employment_type}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "zone",
        id: "zone",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Ubicación</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const zoneText = vacancy.zone || vacancy.location || "Riviera Maya";
          return (
            <div className="space-y-0.5 py-1 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <MapPin className="size-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[170px] text-foreground font-semibold">
                  {zoneText}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground pl-5 block">
                {vacancy.modality || "Presencial"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "salary_min",
        id: "salary_min",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Sueldo Ofrecido</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div className="py-1">
              <span className="font-mono text-xs font-bold text-foreground block">
                {formatSalary(vacancy.salary_min, vacancy.salary_max)}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                MXN Mensual
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "applicants_count",
        id: "applicants_count",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Postulaciones</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const count = row.original.applicants_count ?? 0;
          return (
            <div className="py-1">
              <Link
                href={`/dashboard/company/applications?vacancy_id=${row.original.id}`}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold font-mono transition-colors",
                  count > 0
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                )}
                title="Ver candidatos postulados"
              >
                <Users className="size-3.5" />
                <span>{count}</span>
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Publicación</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground py-1">
              <Calendar className="size-3 text-muted-foreground shrink-0" />
              <span>{formatDate(vacancy.created_at)}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "is_active",
        id: "is_active",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estatus</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-primary" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-80 transition-opacity" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const isActive = vacancy.is_active;
          return (
            <div className="py-1">
              <button
                type="button"
                onClick={() => handleToggleActive(vacancy.id, isActive)}
                className="cursor-pointer transition-transform hover:scale-105 select-none"
                title={
                  isActive
                    ? "Clic para pausar vacante"
                    : "Clic para activar vacante"
                }
              >
                <CompanyStatusBadge
                  status={isActive ? "activo" : "pausado"}
                  label={isActive ? "Activa" : "Pausada"}
                />
              </button>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground block text-right pr-2">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div
              className="flex items-center justify-end gap-1 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Eye Button: View Vacancy Details in Drawer */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewVacancy(vacancy);
                }}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors"
                title="Ver detalles de la vacante"
              >
                <Eye className="size-4" />
              </Button>

              {/* View Applicants Shortcut */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                render={
                  <Link
                    href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                  />
                }
                className="size-8 rounded-lg text-primary hover:bg-primary/10 p-1 cursor-pointer transition-colors"
                title="Ver candidatos postulados"
              >
                <Users className="size-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors flex items-center justify-center"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl border border-border/50 bg-popover min-w-[190px] shadow-lg p-1.5"
                >
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewVacancy(vacancy);
                    }}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2 text-foreground"
                  >
                    <Eye className="size-3.5 text-primary" />
                    <span>Ver detalles</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    render={
                      <Link
                        href={`/dashboard/company/applications?vacancy_id=${vacancy.id}`}
                      />
                    }
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2 text-primary"
                  >
                    <Users className="size-3.5 text-primary" />
                    <span>Ver postulaciones ({vacancy.applicants_count || 0})</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    render={
                      <Link
                        href={`/dashboard/company/vacancies/${vacancy.id}/edit`}
                      />
                    }
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    <Edit2 className="size-3.5 text-muted-foreground" />
                    <span>Editar vacante</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloneVacancy(vacancy.id);
                    }}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    <Copy className="size-3.5 text-muted-foreground" />
                    <span>Duplicar oferta</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(vacancy.id, vacancy.is_active);
                    }}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    {vacancy.is_active ? (
                      <>
                        <PauseCircle className="size-3.5 text-amber-500" />
                        <span>Pausar vacante</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="size-3.5 text-emerald-500" />
                        <span>Activar vacante</span>
                      </>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewVacancy(null);
                      setDeletingVacancyId(vacancy.id);
                    }}
                    className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 focus:bg-rose-500/10 py-2 px-2.5 gap-2"
                  >
                    <Trash2 className="size-3.5 text-rose-500" />
                    <span>Eliminar vacante</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [handleCloneVacancy, handleToggleActive]
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: filteredVacancies,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const selectedRowIds = Object.keys(rowSelection)
    .filter((k) => rowSelection[k])
    .map((index) => table.getRowModel().rows[Number(index)]?.original?.id)
    .filter(Boolean);

  const tableRows = table.getRowModel().rows;

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      {/* 1. Header Unificado */}
      <CompanyPageHeader
        title="Mis Vacantes Laborales"
        description="Gestiona tus convocatorias de empleo, postulantes y estado de publicación en la plataforma."
      >
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {metrics.total}
          </Badge>
          {!loadingProfile && profile?.is_validated && (
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1">
              <CheckCircle2 className="size-3" />
              <span>Verificada</span>
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="cursor-pointer"
          >
            <FileDown data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </Button>
          <Button
            size="sm"
            render={<Link href="/dashboard/company/vacancies/new" />}
            className="cursor-pointer font-medium"
          >
            <Plus data-icon="inline-start" />
            <span>Publicar Oferta</span>
          </Button>
        </div>
      </CompanyPageHeader>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Ofertas
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.total}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Convocatorias registradas
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Activas
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.active}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Visibles para candidatos
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pausadas
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.paused}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Temporalmente ocultas
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Postulantes
            </span>
            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.totalApplicants}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Candidatos recibidos
            </p>
          </div>
        </Card>
      </div>

      {/* Profile Incomplete Warning Banner */}
      {isProfileIncomplete && !loadingProfile && (
        <Alert
          variant="destructive"
          className="bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
        >
          <div className="flex items-start gap-3.5">
            <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <AlertTitle className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Perfil de Empresa Incompleto
              </AlertTitle>
              <AlertDescription className="text-xs font-medium text-amber-800 dark:text-amber-300/90 leading-relaxed">
                Completa los datos esenciales de tu negocio (Nombre, WhatsApp y Dirección) para publicar vacantes verificadas.
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

      {/* 3. Master TanStack DataTable Card */}
      <Card className="overflow-hidden">
        
        {/* Unified Toolbar & Filters inside Card Header */}
        <div className="p-3 sm:p-5 border-b border-border space-y-2 sm:space-y-3.5 bg-muted/20">
          
          {/* === MOBILE FILTERS VIEW (sm:hidden) === */}
          <div className="flex flex-col gap-2 sm:hidden">
            {/* Row 1: Search Input + Filter Drawer Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/80 group-focus-within:text-primary size-4 pointer-events-none transition-colors" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar vacante..."
                  className="pl-9 pr-8 text-xs font-semibold"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md hover:bg-muted/60"
                    aria-label="Borrar búsqueda"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Filters Trigger Button */}
              <Button
                type="button"
                variant={activeSecondaryFiltersCount > 0 ? "default" : "outline"}
                size="sm"
                onClick={() => setIsMobileFilterDrawerOpen(true)}
                className="gap-1.5 shrink-0 cursor-pointer"
                aria-label="Abrir filtros de categoría y zona"
              >
                <SlidersHorizontal className="size-3.5 shrink-0" />
                <span className="text-xs">Filtros</span>
                {activeSecondaryFiltersCount > 0 && (
                  <span className="size-4.5 rounded-full bg-white text-primary text-[10px] font-black flex items-center justify-center shrink-0 shadow-2xs">
                    {activeSecondaryFiltersCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Row 2: Horizontally Scrollable Strip for Status Pills and Active Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 select-none">
              {/* Status Pills */}
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer active:scale-95",
                  statusFilter === "all"
                    ? "bg-foreground text-background shadow-2xs font-extrabold"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground border border-border/30"
                )}
              >
                Todas ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95",
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground border border-border/30"
                )}
              >
                <span className={cn("size-1.5 rounded-full inline-block", statusFilter === "active" ? "bg-white" : "bg-emerald-500")} />
                <span>Activas ({metrics.active})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("paused")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95",
                  statusFilter === "paused"
                    ? "bg-amber-600 text-white shadow-2xs font-extrabold"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground border border-border/30"
                )}
              >
                <span className={cn("size-1.5 rounded-full inline-block", statusFilter === "paused" ? "bg-white" : "bg-amber-500")} />
                <span>Pausadas ({metrics.paused})</span>
              </button>

              {/* Active Category Chip (Removable) */}
              {categoryFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/25 shrink-0 cursor-pointer active:scale-95 hover:bg-primary/20 transition-all"
                  aria-label={`Eliminar filtro de categoría ${categoryFilter}`}
                >
                  <span className="truncate max-w-[120px]">{categoryFilter}</span>
                  <X className="size-3 shrink-0" />
                </button>
              )}

              {/* Active Location Chip (Removable) */}
              {locationFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setLocationFilter("all")}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-primary/25 shrink-0 cursor-pointer active:scale-95 hover:bg-primary/20 transition-all"
                  aria-label={`Eliminar filtro de zona ${locationFilter}`}
                >
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate max-w-[100px]">{locationFilter}</span>
                  <X className="size-3 shrink-0" />
                </button>
              )}

              {/* Clear All Button if any filter active */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 shrink-0 cursor-pointer active:scale-95 transition-all"
                  aria-label="Restablecer todos los filtros"
                >
                  <RotateCcw className="size-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* === DESKTOP FILTERS VIEW (hidden sm:block) === */}
          <div className="hidden sm:block space-y-3.5">
            {/* Top Row: Search Input & Quick Sort Helper */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-lg group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80 group-focus-within:text-primary size-4 pointer-events-none transition-colors" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por puesto, categoría, zona o sueldo..."
                  className="pl-10 pr-9 text-xs sm:text-sm font-semibold"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md hover:bg-muted/60"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Sort Helper */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <ArrowUpDown className="size-3.5 text-primary" />
                <span>Haz clic en los encabezados para ordenar</span>
              </div>
            </div>

            {/* Filter Row: Status Segmented Pills + Category + Zone + Clear */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-border/30">
              {/* Status Segmented Tabs */}
              <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    statusFilter === "all"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todas ({metrics.total})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    statusFilter === "active"
                      ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Activas ({metrics.active})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("paused")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    statusFilter === "paused"
                      ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                  <span>Pausadas ({metrics.paused})</span>
                </button>
              </div>

              {/* Selectors Group */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Category Select */}
                <div className="w-full sm:w-[200px]">
                  <Select
                    value={categoryFilter}
                    onValueChange={(val) => setCategoryFilter(val || "all")}
                  >
                    <SelectTrigger className="w-full text-xs font-semibold">
                      <SelectValue placeholder="Todas las categorías">
                        {categoryFilter === "all"
                          ? `Todas las categorías (${categoriesList.length})`
                          : categoryFilter}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="all"
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Todas las categorías ({vacancies.length})
                      </SelectItem>
                      {categoriesList.map((cat) => (
                        <SelectItem
                          key={cat}
                          value={cat}
                          className="text-xs font-semibold cursor-pointer"
                        >
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Select */}
                <div className="w-full sm:w-[180px]">
                  <Select
                    value={locationFilter}
                    onValueChange={(val) => setLocationFilter(val || "all")}
                  >
                    <SelectTrigger className="w-full text-xs font-semibold">
                      <SelectValue placeholder="Todas las zonas">
                        {locationFilter === "all"
                          ? "Todas las zonas"
                          : locationFilter}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="all"
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Todas las zonas
                      </SelectItem>
                      {locationsList.map((loc) => (
                        <SelectItem
                          key={loc}
                          value={loc}
                          className="text-xs font-semibold cursor-pointer"
                        >
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-9 px-2.5 text-xs font-bold text-muted-foreground hover:text-foreground gap-1 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="size-3.5" />
                    <span className="hidden sm:inline">Limpiar</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Batch Actions Bar (when rows are selected) */}
          {selectedRowIds.length > 0 && (
            <div className="p-2.5 px-3.5 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between flex-wrap gap-2 animate-in fade-in-50 duration-200">
              <span className="text-xs font-bold text-primary">
                {selectedRowIds.length}{" "}
                {selectedRowIds.length === 1
                  ? "vacante seleccionada"
                  : "vacantes seleccionadas"}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchStatusChange(selectedRowIds, "Activa")}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                >
                  <PlayCircle className="size-3.5 mr-1" />
                  <span>Activar</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchStatusChange(selectedRowIds, "Pausada")}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                >
                  <PauseCircle className="size-3.5 mr-1" />
                  <span>Pausar</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRowSelection({})}
                  className="h-8 px-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Deseleccionar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Table Body & Empty State */}
        <div className="relative min-h-[300px]">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : tableRows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
                  <Briefcase className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {isFiltered
                    ? "No se encontraron vacantes"
                    : "No tienes vacantes publicadas"}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? "No hay ofertas de empleo que coincidan con la búsqueda o filtros aplicados. Intenta restablecer los filtros."
                    : "Comienza a reclutar talento local publicando tu primera oferta de empleo en K'anPro."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {isFiltered ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer border-border/50 gap-1.5"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Restablecer Filtros</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    render={<Link href="/dashboard/company/vacancies/new" />}
                    className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer gap-1.5 bg-primary text-primary-foreground"
                  >
                    <Plus className="size-3.5" />
                    <span>Crear Primera Vacante</span>
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/30 border-b border-border/40">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="py-3 px-4 sm:px-6"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {tableRows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest(
                            "button, a, input, [role='checkbox'], [role='menuitem'], [data-slot='dropdown-menu-trigger'], [data-slot='dropdown-menu-content'], [data-slot='dropdown-menu-item'], [data-slot='alert-dialog'], [data-slot='alert-dialog-content']"
                          )
                        ) {
                          return;
                        }
                        if (deletingVacancyId !== null) return;
                        setPreviewVacancy(row.original);
                      }}
                      className={cn(
                        "hover:bg-muted/30 transition-colors group cursor-pointer",
                        !row.original.is_active && "opacity-75 bg-muted/5"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="py-3 px-4 sm:px-6"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Table Footer with Summary and Pagination */}
              <div className="p-3.5 px-4 sm:px-6 border-t border-border/30 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-medium">
                <span>
                  Mostrando <strong>{tableRows.length}</strong> de{" "}
                  <strong>{filteredVacancies.length}</strong> vacantes
                </span>

                {/* Pagination Controls */}
                {table.getPageCount() > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="h-8 px-2.5 rounded-lg text-xs"
                    >
                      <ChevronLeft className="size-3.5 mr-1" />
                      <span>Anterior</span>
                    </Button>
                    <span className="px-2 font-semibold">
                      Página {table.getState().pagination.pageIndex + 1} de{" "}
                      {table.getPageCount()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="h-8 px-2.5 rounded-lg text-xs"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="size-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Alert Dialog for Confirming Deletion */}
      <AlertDialog
        open={deletingVacancyId !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingVacancyId(null);
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl border border-border/80 p-6 bg-card max-w-md shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trash2 className="size-4 text-rose-500" />
              <span>¿Eliminar vacante permanentemente?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed mt-1">
              Esta acción es definitiva e irreversible. La vacante será dada de baja y los candidatos no podrán postularse.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deletingVacancy && (
            <div className="p-3 bg-muted/40 rounded-xl border border-border/60 text-xs font-semibold text-foreground space-y-1">
              <p className="font-extrabold text-foreground text-sm">{deletingVacancy.title}</p>
              <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                <span>{deletingVacancy.category || "General"}</span>
                <span>•</span>
                <span>{deletingVacancy.zone || deletingVacancy.location || "Mérida"}</span>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setDeletingVacancyId(null)}
              className="rounded-xl font-semibold text-xs h-10 px-4 cursor-pointer"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                if (deletingVacancyId) {
                  confirmDeleteVacancy(deletingVacancyId);
                }
              }}
              className="rounded-xl font-bold text-xs h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white border-none cursor-pointer gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  <span>Eliminar Definitivamente</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vacancy Preview Drawer */}
      <VacancyPreviewDrawer
        vacancy={previewVacancy}
        open={!!previewVacancy && deletingVacancyId === null}
        onOpenChange={(open) => !open && setPreviewVacancy(null)}
        onToggleActive={handleToggleActive}
        formatSalary={formatSalary}
        formatDate={formatDate}
      />

      {/* Mobile Filter Drawer */}
      <Drawer
        open={isMobileFilterDrawerOpen}
        onOpenChange={setIsMobileFilterDrawerOpen}
        showSwipeHandle
        swipeDirection="down"
      >
        <DrawerContent className="[--drawer-inset:0px] max-h-[85vh] rounded-t-[28px] rounded-b-none border-x-0 border-b-0 border-t border-border/70 bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col">
          <DrawerHeader className="px-5 pt-3 pb-3 border-b border-border/40 flex flex-row items-center justify-between shrink-0">
            <div className="text-left">
              <DrawerTitle className="text-base font-extrabold tracking-tight text-foreground">
                Filtros de Vacantes
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
                Refina por estado, categoría y ubicación
              </DrawerDescription>
            </div>
            <DrawerClose
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 cursor-pointer"
                  aria-label="Cerrar filtros"
                />
              }
            >
              <X className="size-4" />
            </DrawerClose>
          </DrawerHeader>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
            {/* Estado de la Oferta */}
            <div className="space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                Estado de la Oferta
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer active:scale-95",
                    statusFilter === "all"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todas ({metrics.total})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer active:scale-95",
                    statusFilter === "active"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Activas ({metrics.active})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("paused")}
                  className={cn(
                    "p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer active:scale-95",
                    statusFilter === "paused"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Pausadas ({metrics.paused})
                </button>
              </div>
            </div>

            {/* Categorías */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Categoría
                </span>
                {categoryFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("all")}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-1 -m-1">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95",
                    categoryFilter === "all"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todas las categorías ({vacancies.length})
                </button>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95",
                      categoryFilter === cat
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Ubicación / Zona */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground block">
                  Zona / Ubicación
                </span>
                {locationFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setLocationFilter("all")}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1 -m-1">
                <button
                  type="button"
                  onClick={() => setLocationFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95",
                    locationFilter === "all"
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todas las zonas
                </button>
                {locationsList.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocationFilter(loc)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center gap-1",
                      locationFilter === loc
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/40 border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MapPin className="size-3 shrink-0" />
                    <span>{loc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <DrawerFooter className="p-4 border-t border-border/40 bg-muted/10 gap-2.5 flex-row items-center justify-between pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shrink-0">
            {isFiltered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 px-3.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
              >
                <RotateCcw className="size-3.5 mr-1" />
                Limpiar todo
              </Button>
            ) : (
              <div className="text-xs text-muted-foreground font-medium">
                Sin filtros aplicados
              </div>
            )}

            <Button
              size="sm"
              onClick={() => setIsMobileFilterDrawerOpen(false)}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer ml-auto"
            >
              Ver {filteredVacancies.length} {filteredVacancies.length === 1 ? "vacante" : "vacantes"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
