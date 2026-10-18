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
  Calendar,
  MessageSquare,
  UserCheck,
  MoreHorizontal,
  UserX,
  UserPlus,
  FileText,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Download,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Phone,
  Clock,
  Send,
  Copy,
  Check,
  Share2,
  Trash2,
  MailCheck,
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
  getCompanyInvitationsAction,
  resendEmployeeInvitationAction,
  cancelEmployeeInvitationAction,
} from "@/modules/company/actions/employees";
import { EmployeeDossierSheet } from "@/modules/company/components/dossier/employee-dossier-sheet";
import { RegisterEmployeeModal } from "@/modules/company/components/employees/register-employee-modal";

export interface EmployeeInvitationItem {
  id: string;
  company_id: string;
  employee_id: string | null;
  email: string;
  full_name: string;
  position: string;
  salary: number | null;
  hire_date: string | null;
  contract_type: string | null;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface Employee {
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
  base_salary_monthly?: number | null;
  payment_frequency?: string | null;
  employee_code?: string | null;
  department?: string | null;
  job_title?: string | null;
  rfc?: string | null;
  curp?: string | null;
  nss?: string | null;
  work_schedule?: string | null;
  email?: string | null;
}

interface CompanyEmployeesViewProps {
  userId: string;
  initialEmployees: Employee[];
  initialInvitations?: EmployeeInvitationItem[];
}

export function CompanyEmployeesView({
  initialEmployees,
  initialInvitations = [],
}: CompanyEmployeesViewProps) {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);
  const [invitations, setInvitations] = React.useState<EmployeeInvitationItem[]>(initialInvitations);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Contratado" | "Baja" | "invitaciones">("all");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "hired_date", desc: true },
  ]);

  // Sync state with incoming server props
  React.useEffect(() => {
    setEmployees(initialEmployees);
  }, [initialEmployees]);

  React.useEffect(() => {
    setInvitations(initialInvitations);
  }, [initialInvitations]);

  // Dossier Sheet state
  const [dossierEmployee, setDossierEmployee] = React.useState<Employee | null>(null);
  const [isDossierOpen, setIsDossierOpen] = React.useState(false);

  // New direct employee modal state
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = React.useState(false);

  // Resend invitation link modal state
  const [isResendDialogOpen, setIsResendDialogOpen] = React.useState(false);
  const [resendResult, setResendResult] = React.useState<{ name: string; rawToken: string } | null>(null);
  const [isCopiedResend, setIsCopiedResend] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleOpenModal = () => setIsNewEmployeeModalOpen(true);
    window.addEventListener("open-register-employee-modal", handleOpenModal);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "new") {
        setIsNewEmployeeModalOpen(true);
      }
    }

    return () => {
      window.removeEventListener("open-register-employee-modal", handleOpenModal);
    };
  }, []);

  const reloadInvitations = React.useCallback(async () => {
    try {
      const data = await getCompanyInvitationsAction();
      setInvitations(data);
    } catch (err) {
      console.error("Error refreshing invitations:", err);
    }
  }, []);

  const handleEmployeeCreated = async (newEmp: {
    id: string;
    employee_id?: string | null;
    full_name: string;
    phone?: string | null;
    avatar_url?: string | null;
    department?: string | null;
    job_title?: string | null;
    hire_date?: string | null;
    notes?: string | null;
  }) => {
    if (newEmp && newEmp.id) {
      const formatted: Employee = {
        id: newEmp.id,
        candidate_id: newEmp.employee_id || newEmp.id,
        full_name: newEmp.full_name,
        phone: newEmp.phone || "",
        avatar_url: newEmp.avatar_url || null,
        location: newEmp.department || "Mérida, Yucatán",
        vacancy_title: newEmp.job_title?.trim() ? newEmp.job_title : "Sin puesto asignado",
        vacancy_category: newEmp.department?.trim() ? newEmp.department : "Sin área",
        hired_date: newEmp.hire_date || new Date().toISOString(),
        notes: newEmp.notes || "",
        status: "Contratado",
      };
      setEmployees((prev) => [formatted, ...prev.filter((e) => e.id !== newEmp.id)]);
    }
    await reloadInvitations();
  };

  const handleResendInvitation = async (inv: EmployeeInvitationItem) => {
    setActionLoadingId(inv.id);
    try {
      const res = await resendEmployeeInvitationAction(inv.id);
      if (res.success && res.rawToken) {
        setResendResult({
          name: inv.full_name,
          rawToken: res.rawToken,
        });
        setIsResendDialogOpen(true);
        toast.success("Invitación reenviada exitosamente", {
          description: `Se renovó la vigencia a 7 días para ${inv.full_name}.`,
        });
        await reloadInvitations();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Intenta nuevamente.";
      toast.error("Error al reenviar invitación", {
        description: message,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelInvitation = async (inv: EmployeeInvitationItem) => {
    if (!confirm(`¿Estás seguro de cancelar la invitación para ${inv.full_name}?`)) {
      return;
    }
    setActionLoadingId(inv.id);
    try {
      await cancelEmployeeInvitationAction(inv.id);
      toast.success("Invitación cancelada", {
        description: `La invitación para ${inv.full_name} ha sido dada de baja.`,
      });
      await reloadInvitations();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Intenta nuevamente.";
      toast.error("Error al cancelar invitación", {
        description: message,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyResendLink = () => {
    if (!resendResult) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/invite/${resendResult.rawToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setIsCopiedResend(true);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setIsCopiedResend(false), 2500);
  };

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
    const pendingInvitations = invitations.filter(
      (i) => i.status === "pending" || i.status === "sent"
    ).length;
    const categoriesSet = new Set(
      employees.map((e) => e.vacancy_category || "General")
    );
    return {
      total,
      active,
      terminated,
      pendingInvitations,
      categoriesCount: categoriesSet.size,
    };
  }, [employees, invitations]);

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

  const filteredInvitations = React.useMemo(() => {
    return invitations.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        inv.full_name?.toLowerCase().includes(q) ||
        inv.email?.toLowerCase().includes(q) ||
        inv.position?.toLowerCase().includes(q)
      );
    });
  }, [invitations, searchQuery]);

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
      `plantilla_empleados_${new Date().toISOString().split("T")[0]}.csv`
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
      toast.success("Baja de empleado registrada");
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
      toast.success("Empleado reactivado en la plantilla");
    } catch {
      toast.error("Error al reactivar empleado");
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
            <span>Empleado</span>
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
                {emp.vacancy_title?.trim() ? emp.vacancy_title : "Sin puesto asignado"}
              </p>
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0 rounded-md border-border/30 bg-muted/30"
              >
                {emp.vacancy_category?.trim() ? emp.vacancy_category : "Sin área"}
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
                    <span>Notas del empleado</span>
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
                      <span>Reactivar Empleado</span>
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
      {/* Accessible semantic heading for screen readers */}
      <h1 className="sr-only">Plantilla de Empleados</h1>

      {/* Master TanStack DataTable Card */}
      <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Toolbar & Filters Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 space-y-3.5 bg-muted/10">
          
          {/* Fila 1: Input de búsqueda alineado con los botones de Registrar Empleado y Exportar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Input de búsqueda con filtro global */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por empleado, puesto, ubicación o teléfono..."
                className="h-10 pl-10 pr-9 bg-background border-border/50 rounded-xl text-xs sm:text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary w-full shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Botón de acción: Exportar */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-10 font-semibold text-xs rounded-xl px-3.5 flex items-center gap-2 border-border/50 hover:bg-muted/40 cursor-pointer bg-background shadow-2xs"
              >
                <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Exportar</span>
              </Button>
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
                onClick={() => setStatusFilter("invitaciones")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "invitaciones"
                    ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="size-3 text-amber-500" />
                <span>Invitaciones ({metrics.pendingInvitations})</span>
                {metrics.pendingInvitations > 0 && (
                  <span className="size-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                )}
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
          {statusFilter === "invitaciones" ? (
            filteredInvitations.length === 0 ? (
              <Empty className="py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Clock className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No hay invitaciones registradas</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery
                      ? "Ninguna invitación coincide con tu búsqueda."
                      : "Aún no has enviado invitaciones para nuevos empleados."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    size="sm"
                    onClick={() => setIsNewEmployeeModalOpen(true)}
                    className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer gap-1.5 bg-primary text-primary-foreground"
                  >
                    <UserPlus className="size-4" />
                    <span>+ Invitar Empleado</span>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border/40">
                      <TableHead className="py-3 px-4 text-[11px] font-bold text-muted-foreground uppercase">
                        Empleado Invitado
                      </TableHead>
                      <TableHead className="py-3 px-4 text-[11px] font-bold text-muted-foreground uppercase">
                        Puesto / Cargo
                      </TableHead>
                      <TableHead className="py-3 px-4 text-[11px] font-bold text-muted-foreground uppercase">
                        Condiciones
                      </TableHead>
                      <TableHead className="py-3 px-4 text-[11px] font-bold text-muted-foreground uppercase">
                        Vigencia
                      </TableHead>
                      <TableHead className="py-3 px-4 text-[11px] font-bold text-muted-foreground uppercase">
                        Estatus
                      </TableHead>
                      <TableHead className="py-3 px-4 text-[11px] font-bold text-muted-foreground uppercase text-right">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/30">
                    {filteredInvitations.map((inv) => {
                      const isExpired =
                        inv.status === "expired" ||
                        (new Date(inv.expires_at) < new Date() &&
                          inv.status !== "accepted" &&
                          inv.status !== "cancelled");

                      return (
                        <TableRow
                          key={inv.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <TableCell className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {inv.full_name ? inv.full_name.charAt(0).toUpperCase() : "?"}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs sm:text-sm text-foreground truncate">
                                  {inv.full_name}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono truncate">
                                  {inv.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5 px-4">
                            <div className="font-semibold text-xs text-foreground">
                              {inv.position}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {inv.hire_date ? `Ingreso: ${inv.hire_date}` : "Fecha pendiente"}
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5 px-4">
                            <div className="text-xs font-medium text-foreground">
                              {inv.contract_type?.replace(/_/g, " ") || "Tiempo indeterminado"}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {inv.salary
                                ? `$${inv.salary.toLocaleString("es-MX")} MXN`
                                : "Salario no fijado"}
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5 px-4">
                            <div className="text-xs text-muted-foreground font-mono">
                              Expira: {new Date(inv.expires_at).toLocaleDateString("es-MX")}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Enviada: {new Date(inv.created_at).toLocaleDateString("es-MX")}
                            </div>
                          </TableCell>

                          <TableCell className="py-3.5 px-4">
                            {inv.status === "accepted" ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold">
                                Aceptada
                              </Badge>
                            ) : inv.status === "cancelled" ? (
                              <Badge
                                variant="outline"
                                className="text-rose-500 border-rose-500/30 bg-rose-500/10 text-[10px] font-bold"
                              >
                                Cancelada
                              </Badge>
                            ) : isExpired ? (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground border-border text-[10px] font-bold"
                              >
                                Expirada
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-bold flex items-center gap-1 w-fit">
                                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>{inv.status === "sent" ? "Enviada" : "Pendiente"}</span>
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {inv.status !== "accepted" && inv.status !== "cancelled" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoadingId === inv.id}
                                    onClick={() => handleResendInvitation(inv)}
                                    className="h-8 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer border-border/50 hover:bg-primary/10 hover:text-primary"
                                    title="Renovar y obtener nuevo enlace de invitación"
                                  >
                                    {actionLoadingId === inv.id ? (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                      <Send className="size-3.5 text-primary" />
                                    )}
                                    <span className="hidden sm:inline">Reenviar</span>
                                  </Button>

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={actionLoadingId === inv.id}
                                    onClick={() => handleCancelInvitation(inv)}
                                    className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                                    title="Cancelar invitación"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="p-3.5 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Mostrando <strong>{filteredInvitations.length}</strong> de{" "}
                    <strong>{invitations.length}</strong> invitaciones
                  </span>
                  <span className="text-[11px] text-muted-foreground/80">
                    Sincronizado con Supabase
                  </span>
                </div>
              </div>
            )
          ) : tableRows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
                  <Users className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {isFiltered
                    ? "No se encontraron empleados"
                    : "Plantilla de empleados vacía"}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? "No hay empleados que coincidan con la búsqueda o los filtros aplicados. Intenta ajustar tu consulta."
                    : "Aún no tienes empleados registrados en tu plantilla. Puedes contratar candidatos desde tus postulaciones."}
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
            <>
              {/* Mobile Thumb-Friendly Cards View (< md) */}
              <div className="md:hidden divide-y divide-border/30">
                {tableRows.map((row) => {
                  const emp = row.original;
                  const isTerminated = emp.status === "Baja";

                  return (
                    <div
                      key={emp.id}
                      className={cn(
                        "p-4 flex flex-col gap-3 transition-colors",
                        isTerminated ? "bg-muted/10 opacity-75" : "hover:bg-muted/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => handleOpenDossier(emp)}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <Avatar className="size-11 rounded-xl border border-border/40 shrink-0">
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
                            <h4 className="text-sm font-bold text-foreground truncate hover:text-primary transition-colors">
                              {emp.full_name}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate font-medium">
                              {emp.vacancy_title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground border border-border/40 truncate max-w-[130px]">
                                {emp.vacancy_category || "General"}
                              </span>
                              {emp.location && (
                                <span className="text-[10px] text-muted-foreground/70 truncate">
                                  • {emp.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status badge & dropdown trigger */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isTerminated ? (
                            <Badge
                              variant="destructive"
                              className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md select-none"
                            >
                              Baja
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md select-none"
                            >
                              Activo
                            </Badge>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <button
                                  className="size-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors flex items-center justify-center active:scale-90"
                                  aria-label="Opciones del empleado"
                                />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="rounded-2xl border border-border/50 bg-popover min-w-[200px] shadow-xl p-1.5"
                            >
                              <DropdownMenuItem
                                onSelect={() => handleOpenDossier(emp)}
                                className="cursor-pointer text-xs font-semibold py-2.5 px-3 gap-2.5 text-foreground hover:bg-muted rounded-xl"
                              >
                                <Eye className="size-4 text-muted-foreground" />
                                <span>Ver Expediente 360</span>
                              </DropdownMenuItem>

                              {emp.phone && (
                                <DropdownMenuItem
                                  render={
                                    <a
                                      href={getWhatsAppLink(emp)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="cursor-pointer text-xs font-semibold py-2.5 px-3 gap-2.5 text-emerald-600 dark:text-emerald-400 rounded-xl"
                                    />
                                  }
                                >
                                  <MessageSquare className="size-4" />
                                  <span>Mensaje WhatsApp</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onSelect={() => handleOpenDateDialog(emp)}
                                className="cursor-pointer text-xs font-semibold rounded-xl hover:bg-muted py-2.5 px-3 gap-2.5"
                              >
                                <Calendar className="size-4 text-muted-foreground" />
                                <span>Cambiar fecha inicio</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() => handleOpenNotesDialog(emp)}
                                className="cursor-pointer text-xs font-semibold rounded-xl hover:bg-muted py-2.5 px-3 gap-2.5"
                              >
                                <FileText className="size-4 text-muted-foreground" />
                                <span>Notas del empleado</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1 border-border/40" />

                              {isTerminated ? (
                                <DropdownMenuItem
                                  onSelect={() => handleReactivate(emp)}
                                  className="cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/10 focus:bg-emerald-500/10 py-2.5 px-3 gap-2.5"
                                >
                                  <RotateCcw className="size-4" />
                                  <span>Reactivar Empleado</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() => handleOpenTerminateDialog(emp)}
                                  className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-500/10 focus:bg-rose-500/10 py-2.5 px-3 gap-2.5"
                                >
                                  <UserX className="size-4" />
                                  <span>Registrar Baja</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Quick action footer for the mobile card */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-border/20 text-xs">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          {emp.phone ? (
                            <a
                              href={`tel:${emp.phone}`}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground active:scale-95"
                            >
                              <Phone className="size-3 text-primary" />
                              <span className="font-mono">{emp.phone}</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/60 italic">
                              Sin teléfono
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {emp.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              render={
                                <a
                                  href={getWhatsAppLink(emp)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              }
                              className="h-8 px-3 rounded-lg text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="size-3.5" />
                              <span>WhatsApp</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDossier(emp)}
                            className="h-8 px-3 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 gap-1.5 cursor-pointer"
                          >
                            <Eye className="size-3.5" />
                            <span>Expediente</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Full TanStack Table View (>= md) */}
              <div className="hidden md:block overflow-x-auto">
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
              </div>

              {/* Table Footer Summary */}
              <div className="p-3.5 px-4 sm:px-6 border-t border-border/30 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>
                  Mostrando <strong>{tableRows.length}</strong> de{" "}
                  <strong>{employees.length}</strong> empleados
                </span>
                <span className="text-[11px] text-muted-foreground/80">
                  Actualizado en tiempo real
                </span>
              </div>
            </>
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
              <span>Registrar Baja de Empleado</span>
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
              <span>Notas de Empleado</span>
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

      {/* Dialog: Reenviar Invitación */}
      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent className="rounded-2xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1">
              <MailCheck className="size-5" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Invitación Renovada
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Se ha generado un nuevo enlace con vigencia de 7 días para{" "}
              <strong>{resendResult?.name}</strong>. Comparte este enlace con tu empleado para que complete su registro.
            </DialogDescription>
          </DialogHeader>

          {resendResult && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Enlace de Registro Seguro
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={
                      typeof window !== "undefined"
                        ? `${window.location.origin}/invite/${resendResult.rawToken}`
                        : `/invite/${resendResult.rawToken}`
                    }
                    className="font-mono text-xs h-9 bg-muted/40 selection:bg-primary/20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyResendLink}
                    className="h-9 px-3 gap-1.5 shrink-0 font-semibold text-xs cursor-pointer"
                  >
                    {isCopiedResend ? (
                      <>
                        <Check className="size-3.5 text-emerald-500" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "";
                    const inviteUrl = `${origin}/invite/${resendResult.rawToken}`;
                    const whatsappMsg = encodeURIComponent(
                      `¡Hola ${resendResult.name}! Te invitamos a completar tu registro en el equipo en K'anPro ingresando a este enlace: ${inviteUrl}`
                    );
                    window.open(`https://wa.me/?text=${whatsappMsg}`, "_blank");
                  }}
                >
                  <Share2 className="size-3.5 text-emerald-600" />
                  Compartir por WhatsApp
                </Button>

                <Button
                  type="button"
                  variant="default"
                  className="h-9 px-4 text-xs font-semibold cursor-pointer"
                  onClick={() => setIsResendDialogOpen(false)}
                >
                  Listo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Registro Directo de Empleado */}
      <RegisterEmployeeModal
        isOpen={isNewEmployeeModalOpen}
        onOpenChange={setIsNewEmployeeModalOpen}
        onEmployeeCreated={handleEmployeeCreated}
      />
    </div>
  );
}
