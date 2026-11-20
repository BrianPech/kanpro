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
} from "@tanstack/react-table";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HelpCircleIcon,
  Mail01Icon,
  UserCheck01Icon,
  UserGroupIcon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Users,
  Search,
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
  Eye,
  Phone,
  Clock,
  Send,
  Copy,
  Check,
  Share2,
  Trash2,
  MailCheck,
  Layers,
  ArrowLeft,
  Calendar,
  Briefcase,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  formatMexicoDateShort,
  getMexicoDateISO,
  parseMexicoCalendarDate,
  calculateDailySalary,
  formatPaymentFrequencyLabel,
} from "@/lib/formatters";
import { buildWhatsAppUrl } from "@/hooks/use-connection";
import Link from "next/link";
import { toast } from "sonner";
import {
  terminateEmployee,
  reactivateEmployee,
  updateEmployeeStartDate,
  updateCompanyEmployeeAction,
  getCompanyInvitationsAction,
  resendEmployeeInvitationAction,
  cancelEmployeeInvitationAction,
  assignEmployeeDepartmentAction,
} from "@/modules/company/actions/employees";
import { getCompanyDepartmentsAction } from "@/modules/company/actions/areas";
import { EmployeeDossierModal } from "@/modules/company/components/dossier/employee-dossier-modal";
import { RegisterEmployeeModal } from "@/modules/company/components/employees/register-employee-modal";
import { EmployeeModuleTour } from "@/modules/company/components/employees/employee-module-tour";

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

export interface CompanyDepartmentItem {
  id: string;
  name: string;
  color?: string | null;
}

interface CompanyEmployeesViewProps {
  userId: string;
  initialEmployees: Employee[];
  initialInvitations?: EmployeeInvitationItem[];
  companyDepartments?: CompanyDepartmentItem[];
}

export function CompanyEmployeesView({
  initialEmployees,
  initialInvitations = [],
  companyDepartments = [],
}: CompanyEmployeesViewProps) {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);
  const [invitations, setInvitations] = React.useState<EmployeeInvitationItem[]>(initialInvitations);
  const [departmentsList, setDepartmentsList] =
    React.useState<CompanyDepartmentItem[]>(companyDepartments);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [cameFromAreas, setCameFromAreas] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<"Contratado" | "Baja" | "invitaciones">("Contratado");
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

  React.useEffect(() => {
    setDepartmentsList(companyDepartments);
  }, [companyDepartments]);

  React.useEffect(() => {
    if (departmentsList.length === 0) {
      getCompanyDepartmentsAction().then((res) => {
        if (res.success && res.data) {
          setDepartmentsList(res.data);
        }
      });
    }
  }, [departmentsList.length]);

  // Dossier Sheet state
  const [dossierEmployee, setDossierEmployee] = React.useState<Employee | null>(null);
  const [isDossierOpen, setIsDossierOpen] = React.useState(false);

  // New direct employee modal state
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = React.useState(false);

  // Onboarding Intro Disclosure Tour state
  const [isTourOpen, setIsTourOpen] = React.useState(true);
  const [isTourManual, setIsTourManual] = React.useState(false);

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
      const catParam = params.get("category") || params.get("area");
      if (catParam) {
        setCategoryFilter(catParam);
      }
      if (params.get("from") === "areas") {
        setCameFromAreas(true);
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
    base_salary_monthly?: number | null;
    payment_frequency?: string | null;
    hire_date?: string | null;
    notes?: string | null;
  }) => {
    if (newEmp && newEmp.id) {
      const cleanTitle = newEmp.job_title?.trim() || "";
      const cleanDept = newEmp.department?.trim() || "";
      const formatted: Employee = {
        id: newEmp.id,
        candidate_id: newEmp.employee_id || newEmp.id,
        full_name: newEmp.full_name,
        phone: newEmp.phone || "",
        avatar_url: newEmp.avatar_url || null,
        location: cleanDept || "Mérida, Yucatán",
        vacancy_title: cleanTitle || "Sin puesto asignado",
        vacancy_category: cleanDept || "Sin área",
        job_title: cleanTitle || null,
        department: cleanDept || null,
        base_salary_monthly: newEmp.base_salary_monthly ?? null,
        payment_frequency: newEmp.payment_frequency || "quincenal",
        hired_date: newEmp.hire_date || getMexicoDateISO(),
        notes: newEmp.notes || "",
        status: "Contratado",
      };
      setEmployees((prev) => [formatted, ...prev.filter((e) => e.id !== newEmp.id)]);
    }
    const deptsRes = await getCompanyDepartmentsAction();
    if (deptsRes.success && deptsRes.data) {
      setDepartmentsList(deptsRes.data);
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

  // Termination dialog
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = React.useState(false);
  const [terminationReason, setTerminationReason] = React.useState("Renuncia voluntaria");
  const [terminationNotes, setTerminationNotes] = React.useState("");
  const [isTerminating, setIsTerminating] = React.useState(false);

  // Notes dialog
  const [isNotesDialogOpen, setIsNotesDialogOpen] = React.useState(false);
  const [employeeNotes, setEmployeeNotes] = React.useState("");
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);

  // Area dialog
  const [isAreaDialogOpen, setIsAreaDialogOpen] = React.useState(false);
  const [areaDialogEmployee, setAreaDialogEmployee] = React.useState<Employee | null>(null);
  const [selectedArea, setSelectedArea] = React.useState<string>("none");
  const [isSavingArea, setIsSavingArea] = React.useState(false);

  // Start date dialog
  const [isStartDateDialogOpen, setIsStartDateDialogOpen] = React.useState(false);
  const [startDateEmployee, setStartDateEmployee] = React.useState<Employee | null>(null);
  const [startDateInput, setStartDateInput] = React.useState("");
  const [isSavingStartDate, setIsSavingStartDate] = React.useState(false);

  // Edit labor conditions dialog (puesto, sueldo, periodicidad, área)
  const [isEditLaborDialogOpen, setIsEditLaborDialogOpen] = React.useState(false);
  const [editLaborEmployee, setEditLaborEmployee] = React.useState<Employee | null>(null);
  const [editJobTitle, setEditJobTitle] = React.useState("");
  const [editSalary, setEditSalary] = React.useState("");
  const [editFrequency, setEditFrequency] = React.useState<"quincenal" | "semanal" | "mensual">("quincenal");
  const [editDepartment, setEditDepartment] = React.useState<string>("none");
  const [isSavingLabor, setIsSavingLabor] = React.useState(false);

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
    departmentsList.forEach((d) => {
      if (d.name) set.add(d.name);
    });
    employees.forEach((e) => {
      if (e.vacancy_category && e.vacancy_category !== "Sin área") {
        set.add(e.vacancy_category);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [departmentsList, employees]);

  const filteredData = React.useMemo(() => {
    return employees.filter((emp) => {
      const matchesCategory =
        categoryFilter === "all" || emp.vacancy_category === categoryFilter;
      const matchesStatus = emp.status === statusFilter;
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
    categoryFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStatusFilter("Contratado");
    setSorting([{ id: "hired_date", desc: true }]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Reciente";
    return formatMexicoDateShort(dateStr) || "Reciente";
  };

  const getTenure = (dateStr: string) => {
    if (!dateStr) return "";
    const start = parseMexicoCalendarDate(dateStr);
    const today = parseMexicoCalendarDate(getMexicoDateISO());
    if (!start || !today) return "";

    let diffMonths =
      (today.getUTCFullYear() - start.getUTCFullYear()) * 12 +
      (today.getUTCMonth() - start.getUTCMonth());
    if (today.getUTCDate() < start.getUTCDate()) {
      diffMonths -= 1;
    }
    if (diffMonths < 1) return "Reciente";
    if (diffMonths === 1) return "1 mes";
    if (diffMonths < 12) return `${diffMonths} meses`;
    const years = Math.floor(diffMonths / 12);
    const remMonths = diffMonths % 12;
    const yearLabel = `${years} ${years === 1 ? "año" : "años"}`;
    if (remMonths === 0) return yearLabel;
    const monthLabel = `${remMonths} ${remMonths === 1 ? "mes" : "meses"}`;
    return `${yearLabel}, ${monthLabel}`;
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
    const msg = `¡Hola ${emp.full_name}! Te contacto de Recursos Humanos respecto a tus actividades laborales en el puesto de ${emp.vacancy_title}.`;
    return buildWhatsAppUrl(emp.phone, msg);
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

  const handleOpenAreaDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setAreaDialogEmployee(emp);
    const curr = emp.department?.trim() || emp.vacancy_category?.trim();
    setSelectedArea(curr && curr !== "Sin área" ? curr : "none");
    setIsAreaDialogOpen(true);
  };

  const handleOpenStartDateDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setStartDateEmployee(emp);
    const isoMatch = emp.hired_date?.match(/^(\d{4}-\d{2}-\d{2})/);
    setStartDateInput(isoMatch ? isoMatch[1] : getMexicoDateISO());
    setIsStartDateDialogOpen(true);
  };

  const handleOpenEditLaborDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setEditLaborEmployee(emp);
    const currentJob =
      emp.job_title?.trim() ||
      (emp.vacancy_title && emp.vacancy_title !== "Sin puesto asignado" ? emp.vacancy_title : "");
    setEditJobTitle(currentJob);
    setEditSalary(
      emp.base_salary_monthly && Number(emp.base_salary_monthly) > 0
        ? String(emp.base_salary_monthly)
        : ""
    );
    const freq = emp.payment_frequency;
    setEditFrequency(
      freq === "semanal" || freq === "mensual" ? freq : "quincenal"
    );
    const currArea = emp.department?.trim() || emp.vacancy_category?.trim();
    setEditDepartment(currArea && currArea !== "Sin área" ? currArea : "none");
    setIsEditLaborDialogOpen(true);
  };

  const handleSaveEditLabor = async () => {
    if (!editLaborEmployee) return;
    const cleanJob = editJobTitle.trim();
    const numericSalary = Number(editSalary);

    if (cleanJob.length < 2) {
      toast.error("Puesto inválido", {
        description: "El puesto de trabajo debe tener al menos 2 caracteres.",
      });
      return;
    }

    if (!Number.isFinite(numericSalary) || numericSalary <= 0) {
      toast.error("Sueldo inválido", {
        description: "Ingresa un sueldo bruto mayor a $0 MXN.",
      });
      return;
    }

    const targetDept = editDepartment === "none" ? undefined : editDepartment.trim();
    setIsSavingLabor(true);
    try {
      const res = await updateCompanyEmployeeAction(editLaborEmployee.id, {
        job_title: cleanJob,
        base_salary_monthly: numericSalary,
        payment_frequency: editFrequency,
        department: targetDept,
      });

      if (!res.success) {
        toast.error("Error al actualizar colaborador", { description: res.error });
        return;
      }

      const applyUpdates = (item: Employee): Employee => ({
        ...item,
        job_title: cleanJob,
        vacancy_title: cleanJob,
        base_salary_monthly: numericSalary,
        payment_frequency: editFrequency,
        department: targetDept || null,
        vacancy_category: targetDept || "Sin área",
      });

      setEmployees((prev) =>
        prev.map((e) => (e.id === editLaborEmployee.id ? applyUpdates(e) : e))
      );

      if (dossierEmployee && dossierEmployee.id === editLaborEmployee.id) {
        setDossierEmployee((prev) => (prev ? applyUpdates(prev) : null));
      }

      toast.success("Condiciones laborales actualizadas", {
        description: `${editLaborEmployee.full_name} ahora figura como ${cleanJob} con $${numericSalary.toLocaleString("es-MX")} MXN (${formatPaymentFrequencyLabel(editFrequency)}).`,
      });
      setIsEditLaborDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Intenta nuevamente.";
      toast.error("Error al guardar cambios", { description: msg });
    } finally {
      setIsSavingLabor(false);
    }
  };

  const handleSaveStartDate = async () => {
    if (!startDateEmployee || !/^\d{4}-\d{2}-\d{2}$/.test(startDateInput)) {
      toast.error("Selecciona una fecha válida.");
      return;
    }
    setIsSavingStartDate(true);
    try {
      const res = await updateEmployeeStartDate(startDateEmployee.id, startDateInput);
      if (!res.success) {
        toast.error("Error al actualizar fecha de ingreso", { description: res.error });
        return;
      }

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === startDateEmployee.id ? { ...e, hired_date: startDateInput } : e
        )
      );

      if (dossierEmployee && dossierEmployee.id === startDateEmployee.id) {
        setDossierEmployee((prev) =>
          prev ? { ...prev, hired_date: startDateInput } : null
        );
      }

      toast.success("Fecha de ingreso actualizada", {
        description: `${startDateEmployee.full_name} ahora tiene fecha de ingreso ${formatMexicoDateShort(startDateInput)}.`,
      });
      setIsStartDateDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Intenta nuevamente.";
      toast.error("Error al guardar fecha de ingreso", { description: msg });
    } finally {
      setIsSavingStartDate(false);
    }
  };

  const handleSaveArea = async () => {
    if (!areaDialogEmployee) return;
    setIsSavingArea(true);
    const targetDept = selectedArea === "none" ? null : selectedArea.trim();
    try {
      const res = await assignEmployeeDepartmentAction({
        employeeId: areaDialogEmployee.id,
        department: targetDept,
      });

      if (!res.success) {
        toast.error("Error al asignar área", { description: res.error });
        return;
      }

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === areaDialogEmployee.id
            ? {
                ...e,
                department: targetDept,
                vacancy_category: targetDept || "Sin área",
              }
            : e
        )
      );

      if (dossierEmployee && dossierEmployee.id === areaDialogEmployee.id) {
        setDossierEmployee((prev) =>
          prev
            ? {
                ...prev,
                department: targetDept,
                vacancy_category: targetDept || "Sin área",
              }
            : null
        );
      }

      toast.success("Área actualizada", {
        description: targetDept
          ? `${areaDialogEmployee.full_name} fue asignado al área "${targetDept}".`
          : `Se removió el área asignada a ${areaDialogEmployee.full_name}.`,
      });
      setIsAreaDialogOpen(false);
    } catch {
      toast.error("Error inesperado al asignar área.");
    } finally {
      setIsSavingArea(false);
    }
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
            className="flex items-center gap-[8px] text-[14px] font-semibold leading-[19px] text-foreground hover:opacity-80 transition-opacity cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Empleado</span>
            {column.getIsSorted() === "asc" ? (
              <span className="text-link">↑</span>
            ) : column.getIsSorted() === "desc" ? (
              <span className="text-link">↓</span>
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div className="flex items-center gap-[10px] py-1 min-w-0">
              <Avatar
                onClick={() => handleOpenDossier(emp)}
                className="size-[36px] rounded-[12px] bg-sidebar-accent shrink-0 cursor-pointer after:hidden"
              >
                <AvatarImage
                  src={emp.avatar_url || undefined}
                  alt={emp.full_name}
                  className="rounded-[12px] object-cover"
                />
                <AvatarFallback className="rounded-[12px] font-semibold text-[12px] leading-[16px] bg-sidebar-accent text-link">
                  {getInitials(emp.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex flex-col gap-px">
                <button
                  type="button"
                  onClick={() => handleOpenDossier(emp)}
                  className="text-[14px] font-semibold leading-[20px] text-foreground hover:text-link transition-colors truncate block text-left cursor-pointer"
                >
                  {emp.full_name}
                </button>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground truncate">
                  {emp.email || emp.phone || "Sin contacto"}
                </p>
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
            className="flex items-center gap-1.5 text-[13px] font-semibold leading-[18px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Puesto y área</span>
            {column.getIsSorted() === "asc" ? (
              <span className="text-link">↑</span>
            ) : column.getIsSorted() === "desc" ? (
              <span className="text-link">↓</span>
            ) : null}
          </button>
        ),
        cell: ({ row }) => {
          const emp = row.original;
          const currentArea = emp.department?.trim() || emp.vacancy_category?.trim();
          const hasArea = Boolean(currentArea && currentArea !== "Sin área");

          return (
            <div className="flex flex-col gap-px py-1 min-w-0">
              <p className="text-[14px] font-medium leading-[20px] text-foreground truncate">
                {emp.vacancy_title?.trim() ? emp.vacancy_title : "Sin puesto asignado"}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAreaDialog(emp);
                }}
                className="text-[12px] font-normal leading-[16px] text-muted-foreground hover:text-link transition-colors truncate text-left cursor-pointer"
                title="Haga clic para cambiar o asignar área"
              >
                {hasArea ? currentArea : "Asignar área +"}
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        id: "location",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground">
            Ubicación
          </span>
        ),
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <span className="text-[13px] font-normal leading-[18px] text-foreground truncate block">
              {emp.location || "Sin ubicación"}
            </span>
          );
        },
      },
      {
        accessorKey: "hired_date",
        id: "hired_date",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground">
            Ingreso y antigüedad
          </span>
        ),
        cell: ({ row }) => {
          const emp = row.original;
          const tenure = getTenure(emp.hired_date);
          return (
            <div className="flex flex-col gap-px py-1">
              <span className="text-[13px] font-medium leading-[18px] text-foreground">
                {formatDate(emp.hired_date)}
              </span>
              {tenure && (
                <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  {tenure}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "base_salary_monthly",
        id: "base_salary_monthly",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 text-[13px] font-semibold leading-[18px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Sueldo</span>
            {column.getIsSorted() === "asc" ? (
              <span className="text-link">↑</span>
            ) : column.getIsSorted() === "desc" ? (
              <span className="text-link">↓</span>
            ) : null}
          </button>
        ),
        cell: ({ row }) => {
          const emp = row.original;
          const salary = Number(emp.base_salary_monthly);
          const hasSalary = Number.isFinite(salary) && salary > 0;
          return (
            <div className="flex flex-col gap-px py-1">
              <span className="text-[13px] font-semibold leading-[18px] text-foreground tabular-nums">
                {hasSalary ? `$${salary.toLocaleString("es-MX")} MXN` : "Sin sueldo"}
              </span>
              {hasSalary && (
                <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
                  {formatPaymentFrequencyLabel(emp.payment_frequency)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground block text-center">
            Estado
          </span>
        ),
        cell: ({ row }) => {
          const emp = row.original;
          const isActive = emp.status === "Contratado";
          return (
            <div className="flex justify-center py-1">
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-[8px] px-[12px] py-[6px] text-[12px] font-medium leading-[17px] min-w-[72px]",
                  isActive
                    ? "bg-success text-success-foreground"
                    : "bg-destructive/15 text-destructive"
                )}
              >
                {isActive ? "Activo" : "Baja"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground block text-center">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const emp = row.original;
          return (
            <div
              className="flex items-center justify-center py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label={`Más acciones de ${emp.full_name}`}
                      className="size-[40px] rounded-[8px] bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors flex items-center justify-center"
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
                    onClick={() => handleOpenDossier(emp)}
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
                          className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground"
                        />
                      }
                    >
                      <MessageSquare className="size-3.5 text-muted-foreground" />
                      <span>Mensaje WhatsApp</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => handleOpenEditLaborDialog(emp)}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    <Briefcase className="size-3.5 text-muted-foreground" />
                    <span>Editar puesto y sueldo</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleOpenAreaDialog(emp)}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    <Layers className="size-3.5 text-muted-foreground" />
                    <span>Asignar / Cambiar Área</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleOpenStartDateDialog(emp)}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span>Editar fecha de ingreso</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleOpenNotesDialog(emp)}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span>Notas del empleado</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  {emp.status === "Contratado" ? (
                    <DropdownMenuItem
                      onClick={() => handleOpenTerminateDialog(emp)}
                      className="cursor-pointer text-xs font-semibold text-destructive rounded-lg hover:bg-destructive/10 focus:bg-destructive/10 py-2 px-2.5 gap-2"
                    >
                      <UserX className="size-3.5" />
                      <span>Registrar Baja</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleReactivate(emp)}
                      className="cursor-pointer text-xs font-semibold text-primary rounded-lg hover:bg-primary/10 focus:bg-primary/10 py-2 px-2.5 gap-2"
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchQuery,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
  const totalFilteredRows = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const rangeStart = totalFilteredRows === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min(totalFilteredRows, (pageIndex + 1) * pageSize);

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {cameFromAreas && (
        <Link
          href="/dashboard/company/areas"
          className="inline-flex items-center gap-[6px] text-[14px] font-medium leading-[20px] text-link hover:underline w-fit"
        >
          <ArrowLeft className="size-[16px]" />
          <span>Volver a Áreas</span>
        </Link>
      )}

      {/* 1. Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-tight text-foreground">
            Plantilla de empleados
          </h1>
          <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
            Consulta colaboradores, su estatus laboral y sus expedientes.
          </p>
        </div>

        <div className="flex items-center gap-[8px] flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsTourManual(true);
              setIsTourOpen(true);
            }}
            className="h-[44px] px-[14px] rounded-[8px] bg-card border border-control-border text-[14px] font-semibold leading-[20px] text-foreground inline-flex items-center justify-center gap-[8px] hover:bg-accent transition-colors cursor-pointer"
            title="Ver guía interactiva del módulo"
          >
            <HugeiconsIcon icon={HelpCircleIcon} size={16} strokeWidth={1.8} />
            <span>Guía del módulo</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-[44px] px-[14px] rounded-[8px] bg-card border border-control-border text-[14px] font-semibold leading-[20px] text-foreground inline-flex items-center justify-center gap-[8px] hover:bg-accent transition-colors cursor-pointer"
          >
            <Download className="size-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewEmployeeModalOpen(true)}
            className="h-[44px] px-[14px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-semibold leading-[20px] inline-flex items-center justify-center gap-[8px] hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Registrar empleado</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-[8px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[14px] font-medium leading-[19px] text-muted-foreground">
              Colaboradores
            </span>
            <span className="size-[34px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={1.8} />
            </span>
          </div>
          <span className="text-[28px] font-bold leading-[39px] text-foreground tabular-nums">
            {metrics.total}
          </span>
          <span className="text-[12px] font-medium leading-[17px] text-muted-foreground">
            {metrics.categoriesCount}{" "}
            {metrics.categoriesCount === 1 ? "área activa" : "áreas activas"}
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-[8px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[14px] font-medium leading-[19px] text-muted-foreground">
              Activos
            </span>
            <span className="size-[34px] rounded-[8px] bg-success text-success-foreground flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserCheck01Icon} size={18} strokeWidth={1.8} />
            </span>
          </div>
          <span className="text-[28px] font-bold leading-[39px] text-foreground tabular-nums">
            {metrics.active}
          </span>
          <span className="text-[12px] font-medium leading-[17px] text-muted-foreground">
            En plantilla laboral
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-[8px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[14px] font-medium leading-[19px] text-muted-foreground">
              Invitaciones
            </span>
            <span className="size-[34px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Mail01Icon} size={18} strokeWidth={1.8} />
            </span>
          </div>
          <span className="text-[28px] font-bold leading-[39px] text-foreground tabular-nums">
            {metrics.pendingInvitations}
          </span>
          <span className="text-[12px] font-medium leading-[17px] text-muted-foreground">
            Pendientes de completar
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-4 flex flex-col gap-[8px]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[14px] font-medium leading-[19px] text-muted-foreground">
              Bajas
            </span>
            <span className="size-[34px] rounded-[8px] bg-muted text-muted-foreground flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserRemove01Icon} size={18} strokeWidth={1.8} />
            </span>
          </div>
          <span className="text-[28px] font-bold leading-[39px] text-foreground tabular-nums">
            {metrics.terminated}
          </span>
          <span className="text-[12px] font-medium leading-[17px] text-muted-foreground">
            Historial de bajas
          </span>
        </div>
      </div>

      {/* 3. Directorio Card */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        {/* Controls */}
        <div className="p-4 flex flex-col gap-[12px]">
          <h2 className="text-[20px] font-semibold leading-[28px] text-foreground">
            Directorio
          </h2>

          {/* Tabs */}
          <div className="flex items-center gap-[8px] flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter("Contratado")}
              className={cn(
                "px-[14px] py-[8px] rounded-[8px] text-[14px] font-semibold leading-[20px] transition-colors cursor-pointer",
                statusFilter === "Contratado"
                  ? "bg-sidebar-accent text-link"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              Activos · {metrics.active}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("invitaciones")}
              className={cn(
                "px-[14px] py-[8px] rounded-[8px] text-[14px] font-semibold leading-[20px] transition-colors cursor-pointer",
                statusFilter === "invitaciones"
                  ? "bg-sidebar-accent text-link"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              Invitaciones · {metrics.pendingInvitations}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Baja")}
              className={cn(
                "px-[14px] py-[8px] rounded-[8px] text-[14px] font-semibold leading-[20px] transition-colors cursor-pointer",
                statusFilter === "Baja"
                  ? "bg-sidebar-accent text-link"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              Bajas · {metrics.terminated}
            </button>
          </div>

          {/* Search & Area Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-[12px]">
            <div className="flex flex-col gap-[4px] flex-1 max-w-[504px]">
              <label
                htmlFor="employees-search"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Buscar empleados
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
                <input
                  id="employees-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nombre, puesto, ubicación o teléfono"
                  className="h-[44px] w-full rounded-[8px] border border-input bg-card pl-[36px] pr-[34px] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            </div>

            <div className="flex flex-col gap-[4px] w-full sm:w-[234px]">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Área
              </span>
              <Select
                value={categoryFilter}
                onValueChange={(val) => setCategoryFilter(val || "all")}
              >
                <SelectTrigger className="w-full h-[44px] rounded-[8px] border border-input bg-card px-3 text-[14px] font-normal text-foreground">
                  <SelectValue placeholder="Todas las áreas">
                    {categoryFilter === "all" ? "Todas las áreas" : categoryFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="text-[13px] font-medium cursor-pointer"
                  >
                    Todas las áreas ({employees.length})
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-[13px] font-medium cursor-pointer"
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
                className="h-[44px] px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer shrink-0"
              >
                <RotateCcw className="size-3.5" />
                <span>Limpiar</span>
              </Button>
            )}
          </div>
        </div>

        {/* 3. DataTable Body & Empty State */}
        <div className="relative min-h-[300px]">
          {statusFilter === "invitaciones" ? (
            filteredInvitations.length === 0 ? (
              <Empty className="py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-primary/10 text-primary">
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
                              <Badge
                                variant="outline"
                                className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold"
                              >
                                Aceptada
                              </Badge>
                            ) : inv.status === "cancelled" ? (
                              <Badge
                                variant="outline"
                                className="text-destructive border-destructive/30 bg-destructive/10 text-[10px] font-bold"
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
                              <Badge
                                variant="outline"
                                className="bg-muted text-foreground border-border text-[10px] font-bold flex items-center gap-1 w-fit"
                              >
                                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
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
                                    className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
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
                    nativeButton={false}
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAreaDialog(emp);
                                }}
                                className="cursor-pointer group/mobile-area"
                                title="Cambiar o asignar área"
                              >
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40 truncate max-w-[130px] group-hover/mobile-area:border-primary/60 group-hover/mobile-area:text-foreground inline-flex items-center gap-1 transition-colors">
                                  <Layers className="size-2.5 text-primary" />
                                  <span>{emp.vacancy_category || "Sin área"}</span>
                                </span>
                              </button>
                              {emp.location && (
                                <span className="text-[10px] text-muted-foreground/70 truncate">
                                  • {emp.location}
                                </span>
                              )}
                              {Number(emp.base_salary_monthly) > 0 && (
                                <span className="text-[10px] font-semibold text-foreground/90 tabular-nums truncate">
                                  • ${Number(emp.base_salary_monthly).toLocaleString("es-MX")} MXN ({formatPaymentFrequencyLabel(emp.payment_frequency)})
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
                              className="text-[10px] font-bold px-2 py-0.5 select-none"
                            >
                              Baja
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5 select-none"
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
                                onClick={() => handleOpenDossier(emp)}
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
                                      className="cursor-pointer text-xs font-semibold py-2.5 px-3 gap-2.5 text-foreground rounded-xl"
                                    />
                                  }
                                >
                                  <MessageSquare className="size-4 text-muted-foreground" />
                                  <span>Mensaje WhatsApp</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                onClick={() => handleOpenEditLaborDialog(emp)}
                                className="cursor-pointer text-xs font-semibold rounded-xl hover:bg-muted py-2.5 px-3 gap-2.5"
                              >
                                <Briefcase className="size-4 text-muted-foreground" />
                                <span>Editar puesto y sueldo</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenAreaDialog(emp)}
                                className="cursor-pointer text-xs font-semibold rounded-xl hover:bg-muted py-2.5 px-3 gap-2.5"
                              >
                                <Layers className="size-4 text-muted-foreground" />
                                <span>Asignar / Cambiar Área</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenStartDateDialog(emp)}
                                className="cursor-pointer text-xs font-semibold rounded-xl hover:bg-muted py-2.5 px-3 gap-2.5"
                              >
                                <Calendar className="size-4 text-muted-foreground" />
                                <span>Editar fecha de ingreso</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenNotesDialog(emp)}
                                className="cursor-pointer text-xs font-semibold rounded-xl hover:bg-muted py-2.5 px-3 gap-2.5"
                              >
                                <FileText className="size-4 text-muted-foreground" />
                                <span>Notas del empleado</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1 border-border/40" />

                              {isTerminated ? (
                                <DropdownMenuItem
                                  onClick={() => handleReactivate(emp)}
                                  className="cursor-pointer text-xs font-semibold text-primary rounded-xl hover:bg-primary/10 focus:bg-primary/10 py-2.5 px-3 gap-2.5"
                                >
                                  <RotateCcw className="size-4" />
                                  <span>Reactivar Empleado</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleOpenTerminateDialog(emp)}
                                  className="cursor-pointer text-xs font-semibold text-destructive rounded-xl hover:bg-destructive/10 focus:bg-destructive/10 py-2.5 px-3 gap-2.5"
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
                              nativeButton={false}
                              render={
                                <a
                                  href={getWhatsAppLink(emp)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              }
                              className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="size-3.5 text-primary" />
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
                  <TableHeader className="bg-muted border-b border-border">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="py-3 px-4 h-auto"
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
                  <TableBody className="divide-y divide-border">
                    {tableRows.map((row) => (
                      <TableRow
                        key={row.id}
                        onClick={() => handleOpenDossier(row.original)}
                        className={cn(
                          "hover:bg-muted/40 transition-colors cursor-pointer min-h-[60px] border-border",
                          row.original.status === "Baja" && "opacity-75"
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-[9px] px-4">
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

              {/* Pagination Footer */}
              <div className="p-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                  {rangeStart}–{rangeEnd} de {totalFilteredRows}{" "}
                  {statusFilter === "Contratado" ? "empleados activos" : "bajas"}
                </span>

                <div className="flex items-center gap-[8px]">
                  <button
                    type="button"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    aria-label="Página anterior"
                    className="size-[36px] rounded-[8px] bg-muted text-foreground inline-flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-[13px] font-medium leading-[18px] text-foreground px-1">
                    Página {pageIndex + 1} de {Math.max(1, pageCount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    aria-label="Página siguiente"
                    className="size-[36px] rounded-[8px] bg-muted text-foreground inline-flex items-center justify-center hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Detalles del Empleado (Expediente Digital 360) */}
      <EmployeeDossierModal
        employee={dossierEmployee}
        open={isDossierOpen}
        onOpenChange={setIsDossierOpen}
        onOpenTerminateDialog={handleOpenTerminateDialog}
        onReactivate={handleReactivate}
        onOpenAreaDialog={handleOpenAreaDialog}
        onOpenEditLaborDialog={handleOpenEditLaborDialog}
      />

      {/* Dialog: Editar Puesto, Sueldo y Área */}
      <Dialog open={isEditLaborDialogOpen} onOpenChange={setIsEditLaborDialogOpen}>
        <DialogContent className="rounded-4xl border-border/60 bg-card max-w-md p-6">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Briefcase className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Editar Puesto y Sueldo
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Actualiza las condiciones laborales de{" "}
                  <strong>{editLaborEmployee?.full_name}</strong>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="edit_job_title" className="text-xs font-bold text-foreground">
                Puesto de trabajo *
              </Label>
              <Input
                id="edit_job_title"
                value={editJobTitle}
                onChange={(e) => setEditJobTitle(e.target.value)}
                placeholder="Ej. Mesero, Recepcionista, Auxiliar..."
                disabled={isSavingLabor}
                className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit_salary" className="text-xs font-bold text-foreground">
                  Sueldo ({formatPaymentFrequencyLabel(editFrequency)}) *
                </Label>
                <Input
                  id="edit_salary"
                  type="number"
                  min="1"
                  step="0.01"
                  value={editSalary}
                  onChange={(e) => setEditSalary(e.target.value)}
                  placeholder="10500"
                  disabled={isSavingLabor}
                  className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                />
                {Number(editSalary) > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Diario: ${calculateDailySalary(Number(editSalary), editFrequency).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_freq" className="text-xs font-bold text-foreground">
                  Periodicidad
                </Label>
                <Select
                  value={editFrequency}
                  onValueChange={(val) =>
                    val && setEditFrequency(val as "quincenal" | "semanal" | "mensual")
                  }
                  disabled={isSavingLabor}
                >
                  <SelectTrigger id="edit_freq" className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                    <SelectValue>{formatPaymentFrequencyLabel(editFrequency)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="quincenal">Quincenal</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_dept" className="text-xs font-bold text-foreground">
                Área de trabajo
              </Label>
              <Select
                value={editDepartment}
                onValueChange={(val) => setEditDepartment(val || "none")}
                disabled={isSavingLabor}
              >
                <SelectTrigger id="edit_dept" className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">Sin área asignada</SelectItem>
                  {departmentsList.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingLabor}
              onClick={() => setIsEditLaborDialogOpen(false)}
              className="rounded-4xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSavingLabor || editJobTitle.trim().length < 2 || Number(editSalary) <= 0}
              onClick={handleSaveEditLabor}
              className="rounded-4xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              {isSavingLabor ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Briefcase className="size-3.5 mr-1.5" />
              )}
              <span>Guardar Cambios</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Asignar Área o Departamento */}
      <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
        <DialogContent className="rounded-4xl border-border/60 bg-card max-w-md p-6">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-border/40">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Layers className="size-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Asignar Área o Departamento
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Clasifica al colaborador en la estructura organizacional de tu empresa.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {areaDialogEmployee && (
            <div className="py-2 space-y-4">
              {/* Employee Summary Card */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/40">
                <Avatar className="size-10 rounded-xl border border-border/50 shrink-0">
                  <AvatarImage
                    src={areaDialogEmployee.avatar_url || undefined}
                    alt={areaDialogEmployee.full_name}
                  />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {getInitials(areaDialogEmployee.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {areaDialogEmployee.full_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate font-medium">
                    {areaDialogEmployee.vacancy_title || "Sin puesto asignado"}
                  </p>
                </div>
              </div>

              {/* Area selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="area_select" className="text-xs font-semibold">
                    Área Operativa
                  </Label>
                  <Link
                    href="/dashboard/company/areas"
                    target="_blank"
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    + Gestionar áreas
                  </Link>
                </div>

                <Select
                  value={selectedArea}
                  onValueChange={(val) => setSelectedArea(val || "none")}
                  disabled={isSavingArea}
                >
                  <SelectTrigger
                    id="area_select"
                    className="w-full text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <SelectValue placeholder="Selecciona el área para este empleado..." />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    side="bottom"
                    sideOffset={6}
                    className="w-(--anchor-width) min-w-[320px] sm:min-w-[420px] rounded-2xl p-2 border border-border/70 shadow-2xl bg-popover/98 backdrop-blur-md max-h-72"
                  >
                    <SelectItem
                      value="none"
                      className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-medium cursor-pointer my-0.5 focus:bg-accent transition-colors"
                    >
                      <span className="text-muted-foreground italic">Sin área asignada</span>
                    </SelectItem>
                    {departmentsList.map((dept) => (
                      <SelectItem
                        key={dept.id}
                        value={dept.name}
                        className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer my-0.5 focus:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="size-3 rounded-full shrink-0 shadow-2xs ring-1 ring-border/20"
                            style={{ backgroundColor: dept.color || "var(--primary)" }}
                          />
                          <span className="text-foreground">{dept.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {departmentsList.length === 0 && (
                <div className="p-3 rounded-xl bg-primary/5 border border-dashed border-primary/30 text-xs text-muted-foreground flex items-center justify-between gap-2">
                  <span>Aún no tienes áreas registradas en tu catálogo.</span>
                  <Link
                    href="/dashboard/company/areas"
                    className="text-xs font-bold text-primary hover:underline shrink-0"
                  >
                    Crear áreas
                  </Link>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              disabled={isSavingArea}
              onClick={() => setIsAreaDialogOpen(false)}
              className="rounded-4xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSavingArea}
              onClick={handleSaveArea}
              className="rounded-4xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              {isSavingArea ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Layers className="size-3.5 mr-1.5" />
              )}
              <span>Guardar Área</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Terminate Employee (Baja) */}
      <Dialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
      >
        <DialogContent className="rounded-4xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
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
                <SelectTrigger className="w-full text-xs sm:text-sm font-semibold cursor-pointer">
                  <SelectValue placeholder="Selecciona un motivo">
                    {terminationReason}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  side="bottom"
                  sideOffset={6}
                  className="w-(--anchor-width) min-w-[280px] rounded-2xl border border-border/70 bg-popover/98 backdrop-blur-md shadow-2xl p-2"
                >
                  <SelectItem
                    value="Renuncia voluntaria"
                    className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer my-0.5"
                  >
                    Renuncia voluntaria
                  </SelectItem>
                  <SelectItem
                    value="Fin de contrato / Proyecto"
                    className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer my-0.5"
                  >
                    Fin de contrato / Proyecto
                  </SelectItem>
                  <SelectItem
                    value="Despido justificado"
                    className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer my-0.5"
                  >
                    Despido justificado
                  </SelectItem>
                  <SelectItem
                    value="Abandono de empleo"
                    className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer my-0.5"
                  >
                    Abandono de empleo
                  </SelectItem>
                  <SelectItem
                    value="Mutuo acuerdo"
                    className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer my-0.5"
                  >
                    Mutuo acuerdo
                  </SelectItem>
                  <SelectItem
                    value="Otro"
                    className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer my-0.5"
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
              className="rounded-4xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmTermination}
              disabled={isTerminating}
              className="rounded-4xl text-xs font-bold"
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
        <DialogContent className="rounded-4xl border-border/60 bg-card max-w-md">
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
              className="rounded-4xl text-xs font-semibold"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!selectedEmp) return;
                setIsSavingNotes(true);
                try {
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
              className="rounded-4xl text-xs font-bold bg-primary text-primary-foreground"
            >
              {isSavingNotes ? (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              ) : null}
              <span>Guardar Notas</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Fecha de Ingreso */}
      <Dialog open={isStartDateDialogOpen} onOpenChange={setIsStartDateDialogOpen}>
        <DialogContent className="rounded-4xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span>Editar Fecha de Ingreso</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ajusta la fecha real de ingreso laboral de{" "}
              <strong>{startDateEmployee?.full_name}</strong> para calcular correctamente su antigüedad y vacaciones LFT.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <Label htmlFor="edit_start_date" className="text-xs font-bold text-foreground">
              Fecha de ingreso
            </Label>
            <Input
              id="edit_start_date"
              type="date"
              max={getMexicoDateISO()}
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              disabled={isSavingStartDate}
              className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              disabled={isSavingStartDate}
              onClick={() => setIsStartDateDialogOpen(false)}
              className="rounded-4xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSavingStartDate || !startDateInput}
              onClick={handleSaveStartDate}
              className="rounded-4xl text-xs font-bold bg-primary text-primary-foreground cursor-pointer"
            >
              {isSavingStartDate ? (
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
              ) : (
                <Calendar className="size-3.5 mr-1.5" />
              )}
              <span>Guardar Fecha</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reenviar Invitación */}
      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent className="rounded-4xl border-border/60 bg-card max-w-md">
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
                        <Check className="size-3.5 text-primary" />
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
                  <Share2 className="size-3.5 text-primary" />
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

      {/* Tour Interactivo Onboarding del Módulo de Empleados */}
      <EmployeeModuleTour
        open={isTourOpen}
        setOpen={(open) => {
          setIsTourOpen(open);
          if (!open) setIsTourManual(false);
        }}
        onRegisterClick={() => setIsNewEmployeeModalOpen(true)}
        ignoreDismissal={isTourManual}
      />
    </div>
  );
}
