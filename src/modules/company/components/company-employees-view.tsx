"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Users,
  Search,
  MapPin,
  Briefcase,
  Calendar,
  MessageSquare,
  UserCheck,
  MoreHorizontal,
  UserX,
  FileText,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Download,
  X,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import {
  updateEmployeeStartDate,
  terminateEmployee,
  reactivateEmployee,
} from "@/modules/company/actions/employees";
import { EmployeeDossierSheet } from "@/modules/company/components/dossier/employee-dossier-sheet";

interface Employee {
  id: string;
  candidate_id: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  location: string;
  vacancy_title: string;
  vacancy_category: string;
  hired_date: string;
  notes?: string;
  status: "Contratado" | "Baja";
}

interface CompanyEmployeesViewProps {
  userId: string;
  initialEmployees: Employee[];
}

export function CompanyEmployeesView({
  userId: _userId,
  initialEmployees,
}: CompanyEmployeesViewProps) {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Contratado" | "Baja">("all");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "hired_date", desc: true },
  ]);

  // Dossier Sheet state
  const [dossierEmployee, setDossierEmployee] = React.useState<Employee | null>(null);
  const [isDossierOpen, setIsDossierOpen] = React.useState(false);

  const handleOpenDossier = (emp: Employee) => {
    setDossierEmployee(emp);
    setIsDossierOpen(true);
  };

  // Dialog States
  const [selectedEmp, setSelectedEmp] = React.useState<Employee | null>(null);

  // Date dialog
  const [isDateDialogOpen, setIsDateDialogOpen] = React.useState(false);
  const [startDateValue, setStartDateValue] = React.useState("");
  const [isSavingDate, setIsSavingDate] = React.useState(false);

  // Termination dialog
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = React.useState(false);
  const [terminationReason, setTerminationReason] = React.useState("Renuncia voluntaria");
  const [terminationNotes, setTerminationNotes] = React.useState("");
  const [isTerminating, setIsTerminating] = React.useState(false);

  // Notes dialog
  const [isNotesDialogOpen, setIsNotesDialogOpen] = React.useState(false);
  const [employeeNotes, setEmployeeNotes] = React.useState("");
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);

  // Metrics
  const metrics = React.useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "Contratado").length;
    const terminated = employees.filter((e) => e.status === "Baja").length;
    const categoriesSet = new Set(
      employees.map((e) => e.vacancy_category || "General")
    );
    return {
      total,
      active,
      terminated,
      categoriesCount: categoriesSet.size,
    };
  }, [employees]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.vacancy_category) set.add(e.vacancy_category);
    });
    return Array.from(set);
  }, [employees]);

  const filteredData = React.useMemo(() => {
    return employees.filter((emp) => {
      const matchesCategory =
        categoryFilter === "all" || emp.vacancy_category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || emp.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [employees, categoryFilter, statusFilter]);

  const isFiltered =
    searchQuery.trim().length > 0 ||
    categoryFilter !== "all" ||
    statusFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSorting([{ id: "hired_date", desc: true }]);
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

  const getTenure = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const start = new Date(dateStr);
      const now = new Date();
      const diffMonths =
        (now.getFullYear() - start.getFullYear()) * 12 +
        (now.getMonth() - start.getMonth());
      if (diffMonths < 1) return "Reciente";
      if (diffMonths === 1) return "1 mes";
      if (diffMonths < 12) return `${diffMonths} meses`;
      const years = Math.floor(diffMonths / 12);
      const remMonths = diffMonths % 12;
      return remMonths > 0
        ? `${years}a ${remMonths}m`
        : `${years} ${years === 1 ? "año" : "años"}`;
    } catch {
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getWhatsAppLink = (emp: Employee) => {
    if (!emp.phone) return "";
    const cleanPhone = emp.phone.replace(/\D/g, "");
    const msg = `¡Hola ${emp.full_name}! Te contacto de Recursos Humanos respecto a tus actividades laborales en el puesto de ${emp.vacancy_title}.`;
    return `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleExportCSV = () => {
    const exportItems = table.getFilteredRowModel().rows.map((r) => r.original);
    if (exportItems.length === 0) {
      toast.error("No hay empleados para exportar");
      return;
    }

    const headers = [
      "Nombre",
      "Puesto",
      "Área",
      "Teléfono",
      "Ubicación",
      "Fecha de Ingreso",
      "Estatus",
      "Notas",
    ];
    const rows = exportItems.map((e) => [
      `"${e.full_name.replace(/"/g, '""')}"`,
      `"${e.vacancy_title.replace(/"/g, '""')}"`,
      `"${e.vacancy_category.replace(/"/g, '""')}"`,
      `"${e.phone.replace(/"/g, '""')}"`,
      `"${e.location.replace(/"/g, '""')}"`,
      `"${e.hired_date}"`,
      `"${e.status}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `plantilla_colaboradores_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Listado exportado a CSV exitosamente");
  };

  const handleOpenDateDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    const initialDate = emp.hired_date
      ? new Date(emp.hired_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    setStartDateValue(initialDate);
    setIsDateDialogOpen(true);
  };

  const handleSaveStartDate = async () => {
    if (!selectedEmp || !startDateValue) return;
    setIsSavingDate(true);
    try {
      await updateEmployeeStartDate(selectedEmp.id, startDateValue);
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === selectedEmp.id ? { ...e, hired_date: startDateValue } : e
        )
      );
      toast.success("Fecha de inicio actualizada");
      setIsDateDialogOpen(false);
    } catch {
      toast.error("Error al actualizar la fecha");
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleOpenTerminateDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setTerminationReason("Renuncia voluntaria");
    setTerminationNotes("");
    setIsTerminateDialogOpen(true);
  };

  const handleConfirmTermination = async () => {
    if (!selectedEmp) return;
    setIsTerminating(true);
    try {
      const combinedNotes = `${
        selectedEmp.notes ? selectedEmp.notes + "\n" : ""
      }[Baja - ${terminationReason}] ${terminationNotes}`.trim();
      await terminateEmployee(selectedEmp.id, combinedNotes);
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === selectedEmp.id
            ? { ...e, status: "Baja", notes: combinedNotes }
            : e
        )
      );
      toast.success("Baja de colaborador registrada");
      setIsTerminateDialogOpen(false);
    } catch {
      toast.error("Error al registrar la baja");
    } finally {
      setIsTerminating(false);
    }
  };

  const handleReactivate = async (emp: Employee) => {
    try {
      await reactivateEmployee(emp.id);
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, status: "Contratado" } : e))
      );
      toast.success("Colaborador reactivado en la plantilla");
    } catch {
      toast.error("Error al reactivar colaborador");
    }
  };

  const handleOpenNotesDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setEmployeeNotes(emp.notes || "");
    setIsNotesDialogOpen(true);
  };

  // TanStack Table Column Definitions
  const columns = React.useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "full_name",
        id: "full_name",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Colaborador</span>
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
          const emp = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <Avatar
                onClick={() => handleOpenDossier(emp)}
                className="size-9 rounded-xl border border-border/40 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
              >
                <AvatarImage
                  src={emp.avatar_url || undefined}
                  alt={emp.full_name}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-xl font-extrabold text-xs bg-primary/10 text-primary">
                  {getInitials(emp.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenDossier(emp)}
                  className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate block text-left cursor-pointer"
                >
                  {emp.full_name}
                </button>
                {emp.phone && (
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {emp.phone}
                  </p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "vacancy_title",
        id: "vacancy_title",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Puesto & Área</span>
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
          const emp = row.original;
          return (
            <div className="space-y-1 py-1">
              <p className="text-xs font-bold text-foreground line-clamp-1">
                {emp.vacancy_title}
              </p>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0 rounded-md border-border/30 bg-muted/30"
              >
                {emp.vacancy_category || "General"}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        id: "location",
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
          const emp = row.original;
          return (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium py-1">
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{emp.location}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "hired_date",
        id: "hired_date",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Ingreso & Antigüedad</span>
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
          const emp = row.original;
          const tenure = getTenure(emp.hired_date);
          return (
            <div className="space-y-0.5 py-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Calendar className="size-3 text-muted-foreground shrink-0" />
                <span>{formatDate(emp.hired_date)}</span>
              </div>
              {tenure && (
                <p className="text-[10px] text-muted-foreground font-medium pl-4.5">
                  {tenure}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        id: "status",
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
          const emp = row.original;
          const isActive = emp.status === "Contratado";
          return (
            <div className="py-1">
              <Badge
                className={cn(
                  "font-bold text-[10px] px-2.5 py-0.5 rounded-full border-none select-none inline-flex items-center gap-1.5",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isActive ? "bg-emerald-500" : "bg-rose-500"
                  )}
                />
                <span>{isActive ? "Activo" : "Baja"}</span>
              </Badge>
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
          const emp = row.original;
          return (
            <div className="flex items-center justify-end gap-1 py-1">
              {emp.phone && emp.status === "Contratado" && (
                <a
                  href={getWhatsAppLink(emp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer"
                  title="Enviar mensaje WhatsApp"
                >
                  <MessageSquare className="size-3.5 stroke-[2.5]" />
                </a>
              )}

              {/* Open Expediente 360 Sheet */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenDossier(emp)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors"
                title="Ver Expediente Digital 360"
              >
                <Eye className="size-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors flex items-center justify-center" />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl border border-border/50 bg-popover min-w-[190px] shadow-lg p-1.5"
                >
                  <DropdownMenuItem
                    onSelect={() => handleOpenDossier(emp)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground hover:bg-muted"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>Ver Expediente 360</span>
                  </DropdownMenuItem>

                  {emp.phone && (
                    <DropdownMenuItem
                      render={
                        <a
                          href={getWhatsAppLink(emp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-emerald-600 dark:text-emerald-400"
                        />
                      }
                    >
                      <MessageSquare className="size-3.5" />
                      <span>Mensaje WhatsApp</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onSelect={() => handleOpenDateDialog(emp)}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span>Cambiar fecha inicio</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => handleOpenNotesDialog(emp)}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>Notas del colaborador</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  {emp.status === "Contratado" ? (
                    <DropdownMenuItem
                      onSelect={() => handleOpenTerminateDialog(emp)}
                      className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 focus:bg-rose-500/10 py-2 px-2.5 gap-2"
                    >
                      <UserX className="size-3.5" />
                      <span>Registrar Baja</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={() => handleReactivate(emp)}
                      className="cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/10 focus:bg-emerald-500/10 py-2 px-2.5 gap-2"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Reactivar Colaborador</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter: searchQuery,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchQuery,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue || "").toLowerCase();
      const emp = row.original;
      return (
        emp.full_name.toLowerCase().includes(query) ||
        emp.vacancy_title.toLowerCase().includes(query) ||
        emp.vacancy_category.toLowerCase().includes(query) ||
        emp.location.toLowerCase().includes(query) ||
        emp.phone.includes(query)
      );
    },
  });

  const tableRows = table.getRowModel().rows;

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      {/* 1. Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-[800] text-foreground tracking-tight flex items-center gap-2.5">
            <span>Plantilla de Colaboradores</span>
            <Badge
              variant="outline"
              className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg border-border/40"
            >
              {metrics.total}
            </Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Gestión operativa, estatus laboral y expedientes del personal contratado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 font-semibold text-xs rounded-xl px-3.5 flex items-center gap-2 border-border/50 hover:bg-muted/40 cursor-pointer"
          >
            <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            size="sm"
            render={<Link href="/dashboard/company/applications" />}
            className="h-9 font-bold text-xs rounded-xl px-4 flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Users className="size-4" />
            <span>Ver Postulantes</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Plantilla
            </span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.total}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Colaboradores registrados
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Activos
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.active}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Laborando actualmente
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Bajas
            </span>
            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <UserX className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.terminated}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Historial de bajas
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Áreas
            </span>
            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.categoriesCount}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Departamentos activos
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Redesigned Master TanStack DataTable Card */}
      <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Toolbar & Filters Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 space-y-3.5 bg-muted/10">
          
          {/* Top Row: Search Input & Active Filters Summary */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input with Global Filter */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por colaborador, puesto, ubicación o teléfono..."
                className="h-10 pl-10 pr-9 bg-background border-border/50 rounded-xl text-xs sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary"
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

            {/* Quick Helper Label */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <ArrowUpDown className="size-3.5 text-primary" />
              <span>Haz clic en los encabezados para ordenar</span>
            </div>
          </div>

          {/* Filter Row: Status Tabs + Department Filter + Reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-border/30">
            
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
                Todos ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Contratado")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "Contratado"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Activos ({metrics.active})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Baja")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "Baja"
                    ? "bg-background text-rose-600 dark:text-rose-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-rose-500 inline-block" />
                <span>Bajas ({metrics.terminated})</span>
              </button>
            </div>

            {/* Department Filter & Reset Button */}
            <div className="flex items-center gap-2">
              <div className="w-full sm:w-[220px]">
                <Select
                  value={categoryFilter}
                  onValueChange={(val) => setCategoryFilter(val || "all")}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl border-border/50 bg-background text-xs font-semibold">
                    <SelectValue placeholder="Todas las áreas">
                      {categoryFilter === "all"
                        ? `Todas las áreas (${employees.length})`
                        : categoryFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                    <SelectItem
                      value="all"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Todas las áreas ({employees.length})
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat}
                        value={cat}
                        className="text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {cat}
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

        {/* 3. DataTable Body & Empty State */}
        <div className="relative min-h-[300px]">
          {tableRows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
                  <Users className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {isFiltered
                    ? "No se encontraron colaboradores"
                    : "Plantilla de colaboradores vacía"}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? "No hay colaboradores que coincidan con la búsqueda o los filtros aplicados. Intenta ajustar tu consulta."
                    : "Aún no tienes colaboradores registrados en tu plantilla. Puedes contratar candidatos desde tus postulaciones."}
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
                    render={<Link href="/dashboard/company/applications" />}
                    className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer gap-1.5 bg-primary text-primary-foreground"
                  >
                    <UserCheck className="size-3.5" />
                    <span>Explorar Postulaciones</span>
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/30 border-b border-border/40">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
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
                      className={cn(
                        "hover:bg-muted/25 transition-colors group",
                        row.original.status === "Baja" && "opacity-70 bg-muted/5"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 px-4 sm:px-6">
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

              {/* Table Footer Summary */}
              <div className="p-3.5 px-4 sm:px-6 border-t border-border/30 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>
                  Mostrando <strong>{tableRows.length}</strong> de{" "}
                  <strong>{employees.length}</strong> colaboradores
                </span>
                <span className="text-[11px] text-muted-foreground/80">
                  Actualizado en tiempo real
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Expediente Digital 360 Sheet Slide-over Panel */}
      <EmployeeDossierSheet
        employee={dossierEmployee}
        open={isDossierOpen}
        onOpenChange={setIsDossierOpen}
        onOpenDateDialog={handleOpenDateDialog}
        onOpenTerminateDialog={handleOpenTerminateDialog}
        onReactivate={handleReactivate}
      />

      {/* Dialog: Change Start Date */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="rounded-2xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span>Fecha de Inicio de Labores</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Actualiza la fecha en que {selectedEmp?.full_name} comenzó o comenzará a trabajar.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <Label
              htmlFor="start_date"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Fecha de Inicio
            </Label>
            <Input
              id="start_date"
              type="date"
              value={startDateValue}
              onChange={(e) => setStartDateValue(e.target.value)}
              className="h-11 rounded-xl bg-muted/40 border-border/60 font-semibold"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDateDialogOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveStartDate}
              disabled={isSavingDate}
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
            >
              {isSavingDate ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : null}
              <span>Guardar Fecha</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Terminate Employee (Baja) */}
      <Dialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
      >
        <DialogContent className="rounded-2xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              <span>Registrar Baja de Colaborador</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registra el motivo de la baja de{" "}
              <strong>{selectedEmp?.full_name}</strong> en el historial laboral de la empresa.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Motivo de Baja
              </Label>
              <Select
                value={terminationReason}
                onValueChange={(val) =>
                  setTerminationReason(val || "Renuncia voluntaria")
                }
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/60 text-xs font-semibold">
                  <SelectValue placeholder="Selecciona un motivo">
                    {terminationReason}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 bg-popover shadow-lg">
                  <SelectItem
                    value="Renuncia voluntaria"
                    className="text-xs font-semibold rounded-lg"
                  >
                    Renuncia voluntaria
                  </SelectItem>
                  <SelectItem
                    value="Fin de contrato / Proyecto"
                    className="text-xs font-semibold rounded-lg"
                  >
                    Fin de contrato / Proyecto
                  </SelectItem>
                  <SelectItem
                    value="Despido justificado"
                    className="text-xs font-semibold rounded-lg"
                  >
                    Despido justificado
                  </SelectItem>
                  <SelectItem
                    value="Abandono de empleo"
                    className="text-xs font-semibold rounded-lg"
                  >
                    Abandono de empleo
                  </SelectItem>
                  <SelectItem
                    value="Mutuo acuerdo"
                    className="text-xs font-semibold rounded-lg"
                  >
                    Mutuo acuerdo
                  </SelectItem>
                  <SelectItem
                    value="Otro"
                    className="text-xs font-semibold rounded-lg"
                  >
                    Otro
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="term_notes"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Detalles Adicionales (Opcional)
              </Label>
              <Textarea
                id="term_notes"
                value={terminationNotes}
                onChange={(e) => setTerminationNotes(e.target.value)}
                placeholder="Observaciones de entrega de equipo, finiquito o motivos..."
                className="min-h-[90px] rounded-xl bg-muted/40 border-border/60 text-xs font-medium"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsTerminateDialogOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmTermination}
              disabled={isTerminating}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isTerminating ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : null}
              <span>Confirmar Baja</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Employee Notes */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="rounded-2xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span>Notas de Colaborador</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Historial y notas internas para{" "}
              <strong>{selectedEmp?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <Textarea
              value={employeeNotes}
              onChange={(e) => setEmployeeNotes(e.target.value)}
              placeholder="Desempeño, capacitaciones completadas, entrega de uniformes..."
              className="min-h-[120px] rounded-xl bg-muted/40 border-border/60 text-xs font-medium"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNotesDialogOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!selectedEmp) return;
                setIsSavingNotes(true);
                try {
                  await updateEmployeeStartDate(
                    selectedEmp.id,
                    selectedEmp.hired_date
                  );
                  setEmployees((prev) =>
                    prev.map((e) =>
                      e.id === selectedEmp.id
                        ? { ...e, notes: employeeNotes }
                        : e
                    )
                  );
                  toast.success("Notas guardadas correctamente");
                  setIsNotesDialogOpen(false);
                } catch {
                  toast.error("Error al guardar notas");
                } finally {
                  setIsSavingNotes(false);
                }
              }}
              disabled={isSavingNotes}
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
            >
              {isSavingNotes ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : null}
              <span>Guardar Notas</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
