"use client";

import * as React from "react";
import { getActiveCompanyContextAction } from "../actions/tenant-actions";
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
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  X,
  Copy,
  Users,
  AlertCircle,
  ArrowUpDown,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "@/components/ui/icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Briefcase01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  Download01Icon,
  InboxIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useVacancyManager, type VacancyRow } from "@/modules/company/hooks/use-vacancy-manager";
import { cloneVacancyAction } from "../actions/vacancies";

export interface VacancyItem extends VacancyRow {
  applicants_count?: number;
}

type VacancyStatusKey = "active" | "paused" | "draft" | "closed";

function getVacancyStatusKey(v: VacancyItem): VacancyStatusKey {
  const raw = (v.status || "").toLowerCase();
  if (raw.includes("borrador") || raw === "draft") return "draft";
  if (raw.includes("cerrad") || raw === "closed") return "closed";
  if (v.is_active || raw === "activa") return "active";
  return "paused";
}

const STATUS_PILL_CONFIG: Record<
  VacancyStatusKey,
  { label: string; className: string }
> = {
  active: {
    label: "Activa",
    className: "bg-success text-success-foreground",
  },
  paused: {
    label: "Pausada",
    className: "bg-warning text-warning-foreground",
  },
  draft: {
    label: "Borrador",
    className:
      "bg-[#e8f2fb] text-[#184c78] dark:bg-[#213748] dark:text-[#abd6f5]",
  },
  closed: {
    label: "Cerrada",
    className: "bg-muted text-muted-foreground",
  },
};

interface CompanyProfileSummary {
  company_name: string;
  phone: string;
  logo_url: string | null;
  location: string;
  is_validated: boolean;
}

export function VacanciesManager({ userId }: { userId: string }) {
  const router = useRouter();
  const [vacancies, setVacancies] = React.useState<VacancyItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deletingVacancyId, setDeletingVacancyId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const deletingVacancy = React.useMemo(() => {
    return vacancies.find((v) => v.id === deletingVacancyId) || null;
  }, [vacancies, deletingVacancyId]);

  // Filters state (all unified inside the table header)
  const [statusFilter, setStatusFilter] = React.useState<
    "all" | VacancyStatusKey
  >("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [locationFilter, setLocationFilter] = React.useState<string>("all");

  // TanStack sorting & selection state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // States for company profile checking
  const [profile, setProfile] = React.useState<CompanyProfileSummary | null>(
    null
  );
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
      const scopeRes = await getActiveCompanyContextAction();
      const companyScopeId = scopeRes.success ? scopeRes.data.companyId : userId;

      const { data: baseProfile } = await supabase
        .from("profiles")
        .select("full_name, location")
        .eq("id", userId)
        .maybeSingle();

      const { data: compProfile } = await supabase
        .from("company_profiles")
        .select(
          "company_name, contact_phone, fiscal_address, logo_url, verification_status"
        )
        .eq("id", companyScopeId)
        .maybeSingle();

      const company_name =
        compProfile?.company_name || baseProfile?.full_name || "";
      const phone = compProfile?.contact_phone || "configurado";
      const location =
        compProfile?.fiscal_address || baseProfile?.location || "";
      const is_validated = compProfile?.verification_status === "approved";

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
      appCounts?.forEach((app: { vacancy_id: string | null }) => {
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
                  status: nextState ? "Activa" : "Pausada",
                }
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
    } catch (err: unknown) {
      toast.error("Error al actualizar la vacante", {
        description: (err as Error).message,
      });
    }
  }, [toggleVacancyStatus]);

  const handleCloseVacancy = React.useCallback(async (vacancyId: string) => {
    try {
      const success = await toggleVacancyStatus(vacancyId, false, "Cerrada");
      if (success) {
        setVacancies((prev) =>
          prev.map((v) =>
            v.id === vacancyId
              ? {
                  ...v,
                  is_active: false,
                  status: "Cerrada",
                }
              : v
          )
        );
        toast.success("Vacante marcada como cerrada", {
          description: "El proceso de selección quedó cerrado.",
        });
      }
    } catch (err: unknown) {
      toast.error("Error al cerrar la vacante", {
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
    } catch (err: unknown) {
      toast.error("Error al actualizar vacantes seleccionadas", {
        description: err instanceof Error ? err.message : "Error inesperado",
      });
    }
  };

  // Metrics summary
  const metrics = React.useMemo(() => {
    const total = vacancies.length;
    let active = 0;
    let paused = 0;
    let draft = 0;
    let closed = 0;

    vacancies.forEach((v) => {
      const key = getVacancyStatusKey(v);
      if (key === "active") active += 1;
      else if (key === "paused") paused += 1;
      else if (key === "draft") draft += 1;
      else if (key === "closed") closed += 1;
    });

    const totalApplicants = vacancies.reduce(
      (acc, v) => acc + (v.applicants_count || 0),
      0
    );
    return {
      total,
      active,
      paused,
      draft,
      closed,
      totalApplicants,
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
        statusFilter === "all" || getVacancyStatusKey(v) === statusFilter;

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
      return `${formatter.format(min)}–${formatter.format(max)}`;
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
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Puesto y categoría
          </span>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const displayTitle =
            vacancy.title.length > 38
              ? `${vacancy.title.slice(0, 38).trimEnd()}…`
              : vacancy.title;
          return (
            <div className="flex flex-col gap-[2px] max-w-[260px] min-w-0">
              <Link
                href={`/dashboard/company/vacancies/${vacancy.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[14px] font-semibold leading-[20px] text-link hover:underline text-left truncate block cursor-pointer"
                title={vacancy.title}
              >
                {displayTitle}
              </Link>
              <span className="text-[12px] font-normal leading-[16px] text-muted-foreground truncate">
                {vacancy.category || "General"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "zone",
        id: "zone",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Ubicación
          </span>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const zoneText = vacancy.zone || vacancy.location || "—";
          return (
            <span className="text-[14px] font-normal leading-[20px] text-foreground truncate block max-w-[170px]">
              {zoneText}
            </span>
          );
        },
      },
      {
        accessorKey: "salary_min",
        id: "salary_min",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Sueldo
          </span>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <span className="text-[14px] font-normal leading-[20px] text-foreground tabular-nums whitespace-nowrap">
              {formatSalary(vacancy.salary_min, vacancy.salary_max)}
            </span>
          );
        },
      },
      {
        accessorKey: "applicants_count",
        id: "applicants_count",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Postulaciones
          </span>
        ),
        cell: ({ row }) => {
          const count = row.original.applicants_count ?? 0;
          return (
            <Link
              href={`/dashboard/company/applications?vacancy_id=${row.original.id}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "text-[14px] font-semibold leading-[20px] tabular-nums hover:underline inline-block",
                count > 0 ? "text-link" : "text-muted-foreground font-normal"
              )}
              title="Ver candidatos postulados"
            >
              {count}
            </Link>
          );
        },
      },
      {
        accessorKey: "is_active",
        id: "is_active",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground">
            Estado
          </span>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const statusKey = getVacancyStatusKey(vacancy);
          const pill = STATUS_PILL_CONFIG[statusKey];
          return (
            <span
              className={cn(
                "inline-flex items-center justify-center h-[28px] px-[12px] rounded-[8px] text-[13px] font-medium leading-[18px] whitespace-nowrap",
                pill.className
              )}
            >
              {pill.label}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        id: "created_at",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-[4px] text-[12px] font-medium leading-[16px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Publicación</span>
            <ArrowUpDown className="size-[12px] text-link" />
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const statusKey = getVacancyStatusKey(vacancy);
          return (
            <span className="text-[13px] font-normal leading-[18px] text-muted-foreground whitespace-nowrap">
              {statusKey === "draft"
                ? "Sin publicar"
                : formatDate(vacancy.created_at)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="text-[12px] font-medium leading-[16px] text-muted-foreground block text-right pr-1">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div
              className="flex items-center justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Acciones de vacante"
                      className="size-[36px] rounded-[8px] bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors flex items-center justify-center"
                    />
                  }
                >
                  <MoreHorizontal className="size-[16px]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl border border-border/50 bg-popover min-w-[190px] shadow-lg p-1.5"
                >
                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    render={
                      <Link
                        href={`/dashboard/company/vacancies/${vacancy.id}`}
                      />
                    }
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

                  {getVacancyStatusKey(vacancy) !== "closed" && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseVacancy(vacancy.id);
                      }}
                      className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                    >
                      <X className="size-3.5 text-muted-foreground" />
                      <span>Cerrar vacante</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
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
    [handleCloneVacancy, handleCloseVacancy, handleToggleActive]
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
    <div className="flex flex-col gap-[24px] w-full pb-12 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-[8px]">
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
            Vacantes
          </h1>
          <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
            Gestiona tus publicaciones y consulta las postulaciones de cada
            vacante.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/dashboard/company/vacancies/new" />}
          className="h-[44px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 gap-[8px] cursor-pointer shrink-0"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.8} />
          <span>Publicar vacante</span>
        </Button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">
              Vacantes totales
            </span>
            <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Briefcase01Icon} size={18} strokeWidth={1.8} />
            </div>
          </div>
          <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
            {metrics.total}
          </span>
          <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Todos los estados
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">
              Activas
            </span>
            <div className="size-[32px] rounded-[8px] bg-success text-success-foreground flex items-center justify-center shrink-0">
              <HugeiconsIcon
                icon={CheckmarkBadge01Icon}
                size={18}
                strokeWidth={1.8}
              />
            </div>
          </div>
          <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
            {metrics.active}
          </span>
          <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Publicadas y visibles
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">
              Pausadas
            </span>
            <div className="size-[32px] rounded-[8px] bg-warning text-warning-foreground flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={1.8} />
            </div>
          </div>
          <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
            {metrics.paused}
          </span>
          <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Fuera de publicación
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">
              Postulaciones
            </span>
            <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={InboxIcon} size={18} strokeWidth={1.8} />
            </div>
          </div>
          <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
            {metrics.totalApplicants}
          </span>
          <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Recibidas en tus vacantes
          </span>
        </div>
      </div>

      {/* Profile Incomplete Warning Banner */}
      {isProfileIncomplete && !loadingProfile && (
        <Alert
          variant="destructive"
          className="bg-warning border-warning text-warning-foreground p-4 rounded-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-warning-foreground shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <AlertTitle className="text-[14px] font-semibold text-warning-foreground">
                Perfil de Empresa Incompleto
              </AlertTitle>
              <AlertDescription className="text-[13px] text-warning-foreground/90 leading-relaxed">
                Completa los datos esenciales de tu negocio (Nombre, WhatsApp y
                Dirección) para publicar vacantes verificadas.
              </AlertDescription>
            </div>
          </div>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/company/profile" />}
            className="h-[36px] rounded-[8px] bg-card border border-control-border text-foreground hover:bg-accent font-semibold text-[13px] shrink-0 px-3"
          >
            Completar perfil
          </Button>
        </Alert>
      )}

      {/* 3. Listado de vacantes Card */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden flex flex-col">
        {/* Card Header & Filters */}
        <div className="p-[20px] flex flex-col gap-[20px] border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[20px] font-semibold leading-[28px] tracking-[-0.015em] text-foreground">
              Listado de vacantes
            </h2>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 gap-[8px] cursor-pointer"
            >
              <HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={1.8} />
              <span>Exportar CSV</span>
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-[12px]">
            {/* Buscar vacantes */}
            <div className="flex flex-col gap-[6px] flex-1 min-w-0">
              <label
                htmlFor="vacancies-search-input"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Buscar vacantes
              </label>
              <div className="relative">
                <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 text-muted-foreground size-[16px] pointer-events-none" />
                <Input
                  id="vacancies-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Puesto, categoría, zona o sueldo"
                  className="h-[44px] pl-[36px] pr-[36px] rounded-[8px] border-input bg-card text-[14px] font-normal placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Borrar búsqueda"
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-[16px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-[6px] w-full sm:w-[220px] shrink-0">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Categoría
              </span>
              <Select
                value={categoryFilter}
                onValueChange={(val) => setCategoryFilter(val || "all")}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Todas las categorías">
                    {categoryFilter === "all"
                      ? "Todas las categorías"
                      : categoryFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  <SelectItem
                    value="all"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Todas las categorías
                  </SelectItem>
                  {categoriesList.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                    >
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zona */}
            <div className="flex flex-col gap-[6px] w-full sm:w-[220px] shrink-0">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Zona
              </span>
              <Select
                value={locationFilter}
                onValueChange={(val) => setLocationFilter(val || "all")}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Todas las zonas">
                    {locationFilter === "all"
                      ? "Todas las zonas"
                      : locationFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  <SelectItem
                    value="all"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Todas las zonas
                  </SelectItem>
                  {locationsList.map((loc) => (
                    <SelectItem
                      key={loc}
                      value={loc}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
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
                onClick={handleClearFilters}
                className="h-[44px] px-[12px] rounded-[8px] text-[13px] font-medium text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer shrink-0"
              >
                <RotateCcw className="size-3.5" />
                <span>Limpiar</span>
              </Button>
            )}
          </div>

          {/* Status Segmented Tabs */}
          <div className="flex items-center gap-[8px] flex-wrap">
            {(
              [
                { key: "all", label: `Todas · ${metrics.total}` },
                { key: "active", label: `Activas · ${metrics.active}` },
                { key: "paused", label: `Pausadas · ${metrics.paused}` },
                { key: "draft", label: `Borradores · ${metrics.draft}` },
                { key: "closed", label: `Cerradas · ${metrics.closed}` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  "h-[36px] px-[12px] rounded-[8px] text-[14px] font-medium leading-[20px] transition-colors cursor-pointer",
                  statusFilter === tab.key
                    ? "bg-sidebar-accent text-link"
                    : "bg-muted text-foreground hover:bg-muted/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Batch Actions Bar (when rows are selected) */}
          {selectedRowIds.length > 0 && (
            <div className="p-3 bg-sidebar-accent/50 border border-border rounded-[12px] flex items-center justify-between flex-wrap gap-2 animate-in fade-in-50 duration-200">
              <span className="text-[13px] font-semibold text-link">
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
                  className="h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-success-foreground border-border bg-card hover:bg-muted cursor-pointer"
                >
                  <PlayCircle className="size-3.5 mr-1" />
                  <span>Activar</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBatchStatusChange(selectedRowIds, "Pausada")}
                  className="h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-warning-foreground border-border bg-card hover:bg-muted cursor-pointer"
                >
                  <PauseCircle className="size-3.5 mr-1" />
                  <span>Pausar</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRowSelection({})}
                  className="h-[34px] px-3 rounded-[8px] text-[13px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Deseleccionar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Table Body & Empty State */}
        <div className="relative min-h-[260px]">
          {isLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10 w-full rounded-[8px]" />
              <Skeleton className="h-14 w-full rounded-[8px]" />
              <Skeleton className="h-14 w-full rounded-[8px]" />
              <Skeleton className="h-14 w-full rounded-[8px]" />
            </div>
          ) : tableRows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-sidebar-accent text-link">
                  <Briefcase className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {isFiltered
                    ? "No se encontraron vacantes"
                    : "No tienes vacantes publicadas"}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? "No hay ofertas de empleo que coincidan con la búsqueda o filtros aplicados."
                    : "Comienza a reclutar talento local publicando tu primera oferta de empleo en K'anPro."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {isFiltered ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="rounded-[8px] font-medium text-[13px] h-[36px] px-4 cursor-pointer border-control-border gap-1.5"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Restablecer filtros</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/dashboard/company/vacancies/new" />}
                    className="rounded-[8px] font-medium text-[13px] h-[36px] px-4 cursor-pointer gap-1.5 bg-primary text-primary-foreground"
                  >
                    <Plus className="size-3.5" />
                    <span>Publicar vacante</span>
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted border-b border-border">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="hover:bg-transparent border-0"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="h-[44px] py-[8px] px-[16px]"
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
                <TableBody>
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
                        router.push(`/dashboard/company/vacancies/${row.original.id}`);
                      }}
                      className="border-b border-border hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="min-h-[60px] py-[10px] px-[16px]"
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
              <div className="px-[16px] py-[14px] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                  {filteredVacancies.length}{" "}
                  {filteredVacancies.length === 1 ? "vacante" : "vacantes"} ·
                  Sueldos en MXN
                </span>

                {table.getPageCount() > 1 && (
                  <div className="flex items-center gap-[8px]">
                    <button
                      type="button"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      aria-label="Página anterior"
                      className="size-[36px] rounded-[8px] bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="size-[16px]" />
                    </button>
                    <span className="text-[13px] font-normal leading-[18px] text-foreground px-[4px]">
                      Página {table.getState().pagination.pageIndex + 1} de{" "}
                      {table.getPageCount()}
                    </span>
                    <button
                      type="button"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      aria-label="Página siguiente"
                      className="size-[36px] rounded-[8px] bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                    >
                      <ChevronRight className="size-[16px]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
