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
import {
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  Search,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  ArrowLeft,
  Building2,
  TrendingUp,
  Smartphone,
  QrCode,
  MapPin,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ShieldCheck,
  Eye,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  MoreHorizontal,
  X,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";
import {
  AttendanceRecord,
  AttendanceOverviewStats,
  GeofenceConfig,
  AttendanceStatus,
  EmployeeSelectOption,
} from "../types/attendance";
import {
  createManualAttendanceAction,
  authorizeOvertimeAction,
  reviewAttendanceJustificationAction,
} from "../actions/attendance";
import { MobileCheckInSheet } from "./attendance/mobile-checkin-sheet";
import { BranchQrKioskModal } from "./attendance/branch-qr-kiosk-modal";
import { EmployeeAttendanceDossierModal } from "./attendance/employee-attendance-dossier-modal";
import { JustificationReviewModal } from "./attendance/justification-review-modal";
import { OvertimeApprovalModal } from "./attendance/overtime-approval-modal";

interface AttendanceViewProps {
  initialRecords: AttendanceRecord[];
  initialStats: AttendanceOverviewStats;
  branchConfig: GeofenceConfig;
  companyName: string;
  workDate: string;
  employees?: EmployeeSelectOption[];
}

export function AttendanceView({
  initialRecords,
  initialStats,
  branchConfig,
  companyName,
  workDate,
  employees = [],
}: AttendanceViewProps) {
  const router = useRouter();
  const [records, setRecords] = React.useState<AttendanceRecord[]>(initialRecords);
  const [stats, setStats] = React.useState<AttendanceOverviewStats>(initialStats);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  React.useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  // Filters state (all unified inside the table header)
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [methodFilter, setMethodFilter] = React.useState<string>("all");
  const [deptFilter, setDeptFilter] = React.useState<string>("all");

  // TanStack sorting state
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "checkInTime", desc: false },
  ]);

  // Modals state
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
  const [isQrKioskOpen, setIsQrKioskOpen] = React.useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = React.useState(false);
  const [selectedEmployeeForDossier, setSelectedEmployeeForDossier] =
    React.useState<AttendanceRecord | null>(null);
  const [selectedRecordForJustification, setSelectedRecordForJustification] =
    React.useState<AttendanceRecord | null>(null);
  const [selectedRecordForOvertime, setSelectedRecordForOvertime] =
    React.useState<AttendanceRecord | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Manual Check-in Form
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("");
  const [manualName, setManualName] = React.useState("");
  const [manualTime, setManualTime] = React.useState("08:00");
  const [manualStatus, setManualStatus] =
    React.useState<AttendanceStatus>("presente");
  const [isSubmittingManual, setIsSubmittingManual] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const departmentsList = React.useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    return Array.from(set);
  }, [records]);

  const handleRecordCreated = (newRecord: AttendanceRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
    setStats((prev) => {
      const isPresent = newRecord.status === "presente";
      const isLate = newRecord.status === "retardo";
      return {
        ...prev,
        totalScheduled: prev.totalScheduled + 1,
        presentCount: isPresent ? prev.presentCount + 1 : prev.presentCount,
        lateCount: isLate ? prev.lateCount + 1 : prev.lateCount,
      };
    });
  };

  const handleJustificationDecision = async (
    recordId: string,
    decision: "aprobada" | "rechazada",
    comments?: string
  ) => {
    // Optimistic UI update
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          return {
            ...r,
            status:
              decision === "aprobada"
                ? "falta_justificada"
                : "falta_injustificada",
            justification: r.justification
              ? {
                  ...r.justification,
                  status: decision,
                  reviewedAt: "Hoy",
                  reviewedBy: "RH",
                }
              : undefined,
          };
        }
        return r;
      })
    );

    try {
      const res = await reviewAttendanceJustificationAction({
        recordId,
        decision,
        comments,
      });

      if (res.success) {
        toast.success(
          `Justificante ${decision === "aprobada" ? "aprobado" : "rechazado"} con éxito`,
          {
            description: "El estatus de la falta ha sido actualizado en la base de datos.",
          }
        );
        router.refresh();
      } else {
        toast.error("Error al actualizar justificante", {
          description: res.error || "No se pudo guardar la resolución.",
        });
      }
    } catch (err: any) {
      console.error("Error reviewing justification:", err);
      toast.error("Error de comunicación con el servidor");
    }
  };

  const handleAuthorizeOvertime = async (
    recordId: string,
    hours: number,
    rateType: "doble" | "triple"
  ) => {
    // Optimistic update
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              overtimeHours: hours,
              overtimeStatus: "autorizado",
              overtimeRateType: rateType,
            }
          : r
      )
    );

    try {
      const res = await authorizeOvertimeAction({
        recordId,
        hours,
        rateType,
      });

      if (res.success) {
        toast.success(`Horas extras (${hours}h ${rateType}) autorizadas con éxito`, {
          description: "Se aplicará el multiplicador legal para el cálculo de nómina.",
        });
        router.refresh();
      } else {
        toast.error("Error al autorizar horas extras", {
          description: res.error || "No se pudo guardar la autorización.",
        });
      }
    } catch (err: any) {
      console.error("Error authorizing overtime:", err);
      toast.error("Error de comunicación con el servidor");
    }
  };

  const handleAddManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast.error("Por favor selecciona un colaborador de la plantilla.");
      return;
    }

    const selectedEmp = employees.find((emp) => emp.id === selectedEmployeeId);
    const empName = selectedEmp?.name || manualName || "Colaborador";

    setIsSubmittingManual(true);

    try {
      const res = await createManualAttendanceAction({
        employeeId: selectedEmployeeId,
        workDate,
        checkInTime:
          manualStatus === "falta_injustificada" ||
          manualStatus === "falta_justificada"
            ? null
            : manualTime,
        status: manualStatus,
        delayMinutes: manualStatus === "retardo" ? 20 : 0,
      });

      if (res.success && res.record) {
        const raw = res.record;
        const newRecord: AttendanceRecord = {
          id: raw.id,
          employeeId: raw.employee_id,
          employeeName: empName,
          avatarUrl: selectedEmp?.avatarUrl || null,
          jobTitle: selectedEmp?.jobTitle || "Colaborador",
          department: selectedEmp?.department || "Operaciones",
          workDate,
          scheduledCheckIn: raw.scheduled_check_in,
          scheduledCheckOut: raw.scheduled_check_out,
          checkInTime: raw.check_in_time,
          checkOutTime: raw.check_out_time,
          breakStartTime: raw.break_start_time,
          breakEndTime: raw.break_end_time,
          checkInMethod: "manual",
          delayMinutes: raw.delay_minutes || 0,
          status: raw.status as AttendanceStatus,
          overtimeHours: Number(raw.overtime_hours) || 0,
        };

        handleRecordCreated(newRecord);
        toast.success("Registro de checador manual guardado", {
          description: `Se registró en la base de datos para ${empName}.`,
        });

        setSelectedEmployeeId("");
        setManualName("");
        setIsManualModalOpen(false);
        router.refresh();
      } else {
        toast.error("Error al guardar asistencia manual", {
          description: res.error || "No se pudo guardar el registro.",
        });
      }
    } catch (err: any) {
      console.error("Error saving manual checkin:", err);
      toast.error("Error de comunicación con el servidor");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const headers = [
        "Colaborador",
        "Puesto",
        "Departamento",
        "Fecha",
        "Turno Entrada",
        "Turno Salida",
        "Entrada Real",
        "Salida Real",
        "Método",
        "Distancia GPS (m)",
        "Retardo (min)",
        "Horas Extra",
        "Estatus",
      ];

      const rows = filteredRecords.map((r) => [
        `"${r.employeeName.replace(/"/g, '""')}"`,
        `"${r.jobTitle.replace(/"/g, '""')}"`,
        `"${r.department.replace(/"/g, '""')}"`,
        r.workDate,
        r.scheduledCheckIn,
        r.scheduledCheckOut,
        r.checkInTime || "--:--",
        r.checkOutTime || "--:--",
        r.checkInMethod,
        r.checkInLocation?.distanceToBranchMeters || 0,
        r.delayMinutes || 0,
        r.overtimeHours || 0,
        r.status,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Asistencia_${companyName.toLowerCase().replace(/\s+/g, "_")}_${workDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Reporte General de Asistencia descargado con éxito");
    } catch {
      toast.error("Error al exportar reporte de asistencia");
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus, delayMinutes?: number) => {
    switch (status) {
      case "presente":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5 rounded-lg select-none">
            <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
            Puntual
          </Badge>
        );
      case "retardo":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold px-2.5 py-0.5 rounded-lg select-none">
            <span className="size-1.5 rounded-full bg-amber-500 mr-1.5 inline-block" />
            {`Retardo (+${delayMinutes || 15}m)`}
          </Badge>
        );
      case "falta_justificada":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-xs font-bold px-2.5 py-0.5 rounded-lg select-none">
            <span className="size-1.5 rounded-full bg-blue-500 mr-1.5 inline-block" />
            Falta Justificada
          </Badge>
        );
      case "falta_injustificada":
        return (
          <Badge className="bg-destructive/15 text-destructive border border-destructive/20 text-xs font-bold px-2.5 py-0.5 rounded-lg select-none">
            <span className="size-1.5 rounded-full bg-destructive mr-1.5 inline-block" />
            Falta Injustificada
          </Badge>
        );
      case "vacaciones":
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-bold px-2.5 py-0.5 rounded-lg select-none">
            <span className="size-1.5 rounded-full bg-purple-500 mr-1.5 inline-block" />
            Vacaciones LFT
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-xs font-bold px-2.5 py-0.5 rounded-lg border-border/40 select-none"
          >
            Descanso
          </Badge>
        );
    }
  };

  const getMethodBadge = (method: AttendanceRecord["checkInMethod"]) => {
    switch (method) {
      case "gps":
        return (
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25 px-2 py-0.5 rounded-md"
          >
            <MapPin className="size-3" />
            <span>GPS Geocerca</span>
          </Badge>
        );
      case "qr":
        return (
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/25 px-2 py-0.5 rounded-md"
          >
            <QrCode className="size-3" />
            <span>QR Kiosco</span>
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted/40 border-border/40 px-2 py-0.5 rounded-md"
          >
            <span>Manual RH</span>
          </Badge>
        );
    }
  };

  // Filtered records logic
  const filteredRecords = React.useMemo(() => {
    return records.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = query
        ? item.employeeName.toLowerCase().includes(query) ||
          item.jobTitle.toLowerCase().includes(query) ||
          item.department.toLowerCase().includes(query)
        : true;

      let matchesStatus = true;
      if (statusFilter === "presente") {
        matchesStatus = item.status === "presente";
      } else if (statusFilter === "retardo") {
        matchesStatus = item.status === "retardo";
      } else if (statusFilter === "ausencias") {
        matchesStatus =
          item.status === "falta_injustificada" ||
          item.status === "falta_justificada";
      } else if (statusFilter === "overtime") {
        matchesStatus = item.overtimeHours > 0;
      } else if (statusFilter !== "all") {
        matchesStatus = item.status === statusFilter;
      }

      const matchesMethod =
        methodFilter === "all" ? true : item.checkInMethod === methodFilter;

      const matchesDept =
        deptFilter === "all" ? true : item.department === deptFilter;

      return matchesSearch && matchesStatus && matchesMethod && matchesDept;
    });
  }, [records, searchQuery, statusFilter, methodFilter, deptFilter]);

  const isFiltered =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    methodFilter !== "all" ||
    deptFilter !== "all";

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMethodFilter("all");
    setDeptFilter("all");
    setSorting([{ id: "checkInTime", desc: false }]);
  };

  // TanStack Table Column Definitions
  const columns = React.useMemo<ColumnDef<AttendanceRecord>[]>(
    () => [
      {
        accessorKey: "employeeName",
        id: "employeeName",
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
          const item = row.original;
          return (
            <div className="flex items-center gap-3 py-1 min-w-[210px]">
              <Avatar
                onClick={() => setSelectedEmployeeForDossier(item)}
                className="size-10 rounded-2xl border border-border/40 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all shadow-2xs"
              >
                <AvatarImage src={item.avatarUrl || ""} alt={item.employeeName} />
                <AvatarFallback className="rounded-2xl font-extrabold text-xs bg-primary/10 text-primary">
                  {getInitials(item.employeeName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeForDossier(item)}
                  className="text-xs sm:text-sm font-bold text-foreground hover:text-primary transition-colors truncate block text-left cursor-pointer"
                >
                  {item.employeeName}
                </button>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium truncate">
                  <span className="truncate">{item.jobTitle}</span>
                  <span>•</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold px-1.5 py-0 rounded-md border-border/30 bg-muted/40"
                  >
                    {item.department}
                  </Badge>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "scheduledCheckIn",
        id: "schedule",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Horario Pactado</span>
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
          const item = row.original;
          return (
            <div className="py-1">
              <span className="font-mono text-xs font-bold text-foreground block">
                {item.scheduledCheckIn} - {item.scheduledCheckOut}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Jornada Regular
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "checkInTime",
        id: "checkInTime",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Entrada / Salida Real</span>
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
          const item = row.original;
          return (
            <div className="py-1 space-y-0.5">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-extrabold text-foreground">
                  {item.checkInTime || "--:--"}
                </span>
                <span className="text-muted-foreground font-bold">→</span>
                <span className="font-semibold text-muted-foreground">
                  {item.checkOutTime || "--:--"}
                </span>
              </div>
              {item.checkInLocation && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                  GPS: {item.checkInLocation.distanceToBranchMeters}m de sucursal
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "checkInMethod",
        id: "checkInMethod",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Método</span>
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
          return <div className="py-1">{getMethodBadge(row.original.checkInMethod)}</div>;
        },
      },
      {
        accessorKey: "overtimeHours",
        id: "overtimeHours",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-extrabold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none py-1 group"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Horas Extra</span>
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
          const item = row.original;
          const hasOvertime = item.overtimeHours > 0;

          if (!hasOvertime) {
            return (
              <span className="text-xs font-mono text-muted-foreground/60 py-1 block">
                0.0h
              </span>
            );
          }

          return (
            <div className="py-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedRecordForOvertime(item)}
                className={cn(
                  "h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all",
                  item.overtimeStatus === "autorizado"
                    ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                    : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/30"
                )}
              >
                <Sparkles className="size-3" />
                <span>{`+${item.overtimeHours}h (${item.overtimeStatus === "autorizado" ? "Autorizado" : "Revisar"})`}</span>
              </Button>
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
            <span>Estatus Asistencia</span>
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
          const item = row.original;
          return (
            <div className="py-1">
              {getStatusBadge(item.status, item.delayMinutes)}
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
          const item = row.original;
          const isAbsent =
            item.status === "falta_injustificada" ||
            item.status === "falta_justificada";

          return (
            <div className="flex items-center justify-end gap-1 py-1">
              {/* Justification Quick Action */}
              {isAbsent && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedRecordForJustification(item)}
                  className={cn(
                    "h-8 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer",
                    item.status === "falta_justificada"
                      ? "border-blue-500/30 text-blue-600 bg-blue-500/10 hover:bg-blue-500/20"
                      : "border-destructive/30 text-destructive hover:bg-destructive/10"
                  )}
                  title="Revisar o Registrar Justificación Médica / LFT"
                >
                  <ShieldAlert className="size-3.5" />
                  <span className="hidden xl:inline">
                    {item.status === "falta_justificada"
                      ? "Ver Justificante"
                      : "Justificar"}
                  </span>
                </Button>
              )}

              {/* Dossier Quick Action Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEmployeeForDossier(item)}
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors"
                title="Ver Kardex / Calendario Mensual de Asistencia"
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
                  className="rounded-xl border border-border/50 bg-popover min-w-[210px] shadow-lg p-1.5"
                >
                  <DropdownMenuItem
                    onSelect={() => setSelectedEmployeeForDossier(item)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground hover:bg-muted"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>Ver Expediente Mensual 360</span>
                  </DropdownMenuItem>

                  {isAbsent && (
                    <DropdownMenuItem
                      onSelect={() => setSelectedRecordForJustification(item)}
                      className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    >
                      <ShieldAlert className="size-3.5" />
                      <span>
                        {item.status === "falta_justificada"
                          ? "Consultar Justificante Aprobado"
                          : "Capturar Justificación LFT"}
                      </span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onSelect={() => setSelectedRecordForOvertime(item)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Gestionar Horas Extra</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  <DropdownMenuItem
                    onSelect={() => {
                      setManualName(item.employeeName);
                      setManualTime(item.checkInTime || "08:00");
                      setManualStatus(item.status);
                      setIsManualModalOpen(true);
                    }}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Clock className="size-3.5" />
                    <span>Ajustar Marca Manual</span>
                  </DropdownMenuItem>
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
    data: filteredRecords,
    columns,
    state: {
      sorting,
    },
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

  const tableRows = table.getRowModel().rows;

  return (
    <div className="space-y-6 w-full pb-16 font-sans animate-in fade-in duration-300">
      {/* 1. Header Ejecutivo & Acciones Operativas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-[800] text-foreground tracking-tight flex items-center gap-2.5">
              <span>Control de Asistencia & Checador</span>
              <Badge
                variant="outline"
                className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg border-border/40"
              >
                {records.length} Colaboradores
              </Badge>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            {`Monitoreo de entradas por GPS, QR del establecimiento, retardos automáticos y justificaciones • ${companyName} (${workDate}).`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-muted/40 border border-border/50 rounded-xl px-2.5 h-9">
            <Calendar className="size-3.5 text-muted-foreground" />
            <input
              type="date"
              value={workDate}
              onChange={(e) => {
                if (e.target.value) {
                  router.push(`/dashboard/company/attendance?date=${e.target.value}`);
                }
              }}
              className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQrKioskOpen(true)}
            className="h-9 font-semibold text-xs rounded-xl px-3.5 flex items-center gap-2 border-border/50 hover:bg-muted/40 cursor-pointer"
          >
            <QrCode className="size-4 text-indigo-600 dark:text-indigo-400" />
            <span>Kiosco QR</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManualModalOpen(true)}
            className="h-9 font-semibold text-xs rounded-xl px-3.5 flex items-center gap-1.5 border-border/50 hover:bg-muted/40 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Entrada Manual</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="h-9 font-semibold text-xs rounded-xl px-3.5 flex items-center gap-2 border-border/50 hover:bg-muted/40 cursor-pointer"
          >
            <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isExporting ? "Generando..." : "Exportar CSV"}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsMobileSheetOpen(true)}
            className="h-9 font-bold text-xs rounded-xl px-4 flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
          >
            <Smartphone className="size-4" />
            <span>Checador Móvil</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Puntualidad del Turno
            </span>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-extrabold px-2 py-0.2 rounded-md">
              Tolerancia 15m
            </Badge>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {stats.punctualityRate}%
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Índice de puntualidad global
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Presentes Hoy
            </span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.presentCount}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Entradas registradas puntualmente
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Llegadas Tarde
            </span>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">
              {stats.lateCount}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Fuera de tolerancia LFT
            </p>
          </div>
        </Card>

        <Card className="bg-card border border-border/40 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-destructive uppercase tracking-wider">
              Ausencias
            </span>
            <div className="size-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <UserX className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-destructive font-mono">
              {stats.unjustifiedAbsences + stats.justifiedAbsences}
            </h3>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
              {`${stats.justifiedAbsences} justificadas • ${stats.unjustifiedAbsences} injustificadas`}
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Master TanStack DataTable Card */}
      <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-xs">
        
        {/* Unified Toolbar & Filters inside Card Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 space-y-3.5 bg-muted/10">
          
          {/* Top Row: Search & Info */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por colaborador, puesto, departamento o método..."
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

            {/* Quick Sort Helper */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <ArrowUpDown className="size-3.5 text-primary" />
              <span>Haz clic en los encabezados para ordenar</span>
            </div>
          </div>

          {/* Filter Row: Status Segmented Tabs + Dept Select + Method Select + Clear */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-border/30">
            
            {/* Status Segmented Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-muted/60 border border-border/40 shrink-0 flex-wrap gap-1">
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
                Todos ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("presente")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "presente"
                    ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Puntuales ({stats.presentCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("retardo")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "retardo"
                    ? "bg-background text-amber-600 dark:text-amber-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-amber-500 inline-block" />
                <span>Retardos ({stats.lateCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("ausencias")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "ausencias"
                    ? "bg-background text-destructive shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="size-1.5 rounded-full bg-destructive inline-block" />
                <span>Ausencias ({stats.unjustifiedAbsences + stats.justifiedAbsences})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("overtime")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                  statusFilter === "overtime"
                    ? "bg-background text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="size-3 text-indigo-500" />
                <span>Horas Extra</span>
              </button>
            </div>

            {/* Selectors Group */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Department Select */}
              <div className="w-full sm:w-[200px]">
                <Select
                  value={deptFilter}
                  onValueChange={(val) => setDeptFilter(val || "all")}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl border-border/50 bg-background text-xs font-semibold">
                    <SelectValue placeholder="Todos los departamentos">
                      {deptFilter === "all"
                        ? `Departamentos (${departmentsList.length})`
                        : deptFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                    <SelectItem
                      value="all"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Todos los departamentos ({departmentsList.length})
                    </SelectItem>
                    {departmentsList.map((d) => (
                      <SelectItem
                        key={d}
                        value={d}
                        className="text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Method Select */}
              <div className="w-full sm:w-[170px]">
                <Select
                  value={methodFilter}
                  onValueChange={(val) => setMethodFilter(val || "all")}
                >
                  <SelectTrigger className="h-9 w-full rounded-xl border-border/50 bg-background text-xs font-semibold">
                    <SelectValue placeholder="Método">
                      {methodFilter === "all"
                        ? "Todos los métodos"
                        : methodFilter === "gps"
                        ? "GPS Geocerca"
                        : methodFilter === "qr"
                        ? "QR Kiosco"
                        : "Manual RH"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-popover shadow-lg">
                    <SelectItem
                      value="all"
                      className="text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Todos los métodos
                    </SelectItem>
                    <SelectItem
                      value="gps"
                      className="text-xs font-semibold rounded-lg cursor-pointer text-emerald-600"
                    >
                      GPS Geocerca
                    </SelectItem>
                    <SelectItem
                      value="qr"
                      className="text-xs font-semibold rounded-lg cursor-pointer text-indigo-600"
                    >
                      QR Kiosco
                    </SelectItem>
                    <SelectItem
                      value="manual"
                      className="text-xs font-semibold rounded-lg cursor-pointer text-muted-foreground"
                    >
                      Manual RH
                    </SelectItem>
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

        {/* 4. Table Body & Empty State */}
        <div className="relative min-h-[300px]">
          {tableRows.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyMedia
                  variant="icon"
                  className="bg-primary/10 text-primary"
                >
                  <Clock className="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {isFiltered
                    ? "No se encontraron registros"
                    : "No hay checadas registradas"}
                </EmptyTitle>
                <EmptyDescription>
                  {isFiltered
                    ? "No hay marcas de checador que coincidan con la búsqueda o filtros aplicados. Intenta restablecer los filtros."
                    : "Los colaboradores comenzarán a registrar sus entradas por GPS o QR durante el turno activo."}
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
                    onClick={() => setIsManualModalOpen(true)}
                    className="rounded-xl font-bold text-xs h-9 px-4 cursor-pointer gap-1.5 bg-primary text-primary-foreground"
                  >
                    <Plus className="size-3.5" />
                    <span>Registrar Entrada Manual</span>
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
                      className="hover:bg-muted/25 transition-colors group"
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
                  <strong>{filteredRecords.length}</strong> colaboradores
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

      {/* Modal 1: Mobile Check-in Sheet */}
      <MobileCheckInSheet
        isOpen={isMobileSheetOpen}
        onOpenChange={setIsMobileSheetOpen}
        branchConfig={branchConfig}
        onRecordCreated={handleRecordCreated}
        employees={employees}
      />

      {/* Modal 2: QR Kiosk Poster */}
      <BranchQrKioskModal
        isOpen={isQrKioskOpen}
        onOpenChange={setIsQrKioskOpen}
        branchConfig={branchConfig}
        companyName={companyName}
      />

      {/* Modal 3: Employee Attendance Dossier (Monthly Calendar) */}
      <EmployeeAttendanceDossierModal
        isOpen={!!selectedEmployeeForDossier}
        onOpenChange={(open) => !open && setSelectedEmployeeForDossier(null)}
        employee={selectedEmployeeForDossier}
      />

      {/* Modal 4: Justification Review */}
      <JustificationReviewModal
        isOpen={!!selectedRecordForJustification}
        onOpenChange={(open) => !open && setSelectedRecordForJustification(null)}
        record={selectedRecordForJustification}
        onDecision={handleJustificationDecision}
      />

      {/* Modal 5: Overtime Approval */}
      <OvertimeApprovalModal
        isOpen={!!selectedRecordForOvertime}
        onOpenChange={(open) => !open && setSelectedRecordForOvertime(null)}
        record={selectedRecordForOvertime}
        onAuthorize={handleAuthorizeOvertime}
      />

      {/* Modal: Entrada Manual RH */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
          <form onSubmit={handleAddManualCheckIn} className="space-y-4">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                <span>Registrar Entrada Manual RH</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Añade o ajusta la marca de checador para un colaborador del turno.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">
                  Colaborador de la Plantilla *
                </Label>
                {employees.length > 0 ? (
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={(val) => {
                      if (val) {
                        setSelectedEmployeeId(val);
                        const emp = employees.find((e) => e.id === val);
                        if (emp) setManualName(emp.name);
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                      <SelectValue placeholder="Selecciona un colaborador..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-56">
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id} className="text-xs font-medium">
                          {emp.name} — {emp.jobTitle} ({emp.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="att-manual-name"
                    placeholder="Nombre del colaborador"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="att-manual-time"
                    className="text-xs font-bold text-foreground"
                  >
                    Hora de Entrada
                  </Label>
                  <Input
                    id="att-manual-time"
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    disabled={
                      manualStatus === "falta_injustificada" ||
                      manualStatus === "falta_justificada"
                    }
                    className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">
                    Estatus
                  </Label>
                  <Select
                    value={manualStatus}
                    onValueChange={(val) =>
                      val && setManualStatus(val as AttendanceStatus)
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-background border-border/80 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="presente" className="text-xs font-semibold text-emerald-600">
                        Puntual
                      </SelectItem>
                      <SelectItem value="retardo" className="text-xs font-semibold text-amber-600">
                        Retardo
                      </SelectItem>
                      <SelectItem
                        value="falta_injustificada"
                        className="text-xs font-semibold text-rose-600"
                      >
                        Falta Injustificada
                      </SelectItem>
                      <SelectItem
                        value="falta_justificada"
                        className="text-xs font-semibold text-blue-600"
                      >
                        Falta Justificada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualModalOpen(false)}
                className="rounded-xl text-xs font-bold h-10 px-4 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingManual || (!selectedEmployeeId && !manualName.trim())}
                className="rounded-xl text-xs font-bold h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
              >
                {isSubmittingManual ? "Guardando..." : "Guardar Registro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
