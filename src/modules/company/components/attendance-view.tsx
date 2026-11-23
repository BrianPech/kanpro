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
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Plus,
  Sparkles,
  Eye,
  ShieldAlert,
  ArrowUpDown,
  RotateCcw,
  MoreHorizontal,
  X,
} from "@/components/ui/icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  CancelCircleIcon,
  Clock01Icon,
  Download01Icon,
  QrCodeIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";
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
  authorizeOvertimeAction,
  reviewAttendanceJustificationAction,
} from "../actions/attendance";
import { MobileCheckInSheet } from "./attendance/mobile-checkin-sheet";
import { BranchQrKioskModal } from "./attendance/branch-qr-kiosk-modal";
import { EmployeeAttendanceDossierModal } from "./attendance/employee-attendance-dossier-modal";
import { JustificationReviewModal } from "./attendance/justification-review-modal";
import { OvertimeApprovalModal } from "./attendance/overtime-approval-modal";
import {
  ManualAttendanceModal,
  type ManualAttendanceInitialSelection,
} from "./attendance/manual-attendance-modal";

interface AttendanceViewProps {
  companyId?: string;
  initialRecords: AttendanceRecord[];
  initialStats: AttendanceOverviewStats;
  branchConfig: GeofenceConfig;
  toleranceMinutes?: number;
  companyName: string;
  workDate: string;
  employees?: EmployeeSelectOption[];
}

export function AttendanceView({
  companyId,
  initialRecords,
  initialStats,
  branchConfig,
  toleranceMinutes = 15,
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
  const [manualInitialSelection, setManualInitialSelection] =
    React.useState<ManualAttendanceInitialSelection | null>(null);
  const [selectedEmployeeForDossier, setSelectedEmployeeForDossier] =
    React.useState<AttendanceRecord | null>(null);
  const [selectedRecordForJustification, setSelectedRecordForJustification] =
    React.useState<AttendanceRecord | null>(null);
  const [selectedRecordForOvertime, setSelectedRecordForOvertime] =
    React.useState<AttendanceRecord | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      console.error("Error authorizing overtime:", err);
      toast.error("Error de comunicación con el servidor");
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const headers = [
        "Empleado",
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

  const getStatusPill = (status: AttendanceStatus) => {
    switch (status) {
      case "presente":
        return (
          <span className="inline-flex items-center justify-center rounded-[8px] px-[12px] py-[6px] min-w-[104px] text-[12px] font-medium leading-[17px] bg-success text-success-foreground">
            Presente
          </span>
        );
      case "retardo":
        return (
          <span className="inline-flex items-center justify-center rounded-[8px] px-[12px] py-[6px] min-w-[104px] text-[12px] font-medium leading-[17px] bg-warning text-warning-foreground">
            Retardo
          </span>
        );
      case "falta_justificada":
        return (
          <span className="inline-flex items-center justify-center rounded-[8px] px-[12px] py-[6px] min-w-[104px] text-[12px] font-medium leading-[17px] bg-[#e6f1fb] text-[#255276] dark:bg-[#213748] dark:text-[#abd6f5]">
            Justificada
          </span>
        );
      case "vacaciones":
        return (
          <span className="inline-flex items-center justify-center rounded-[8px] px-[12px] py-[6px] min-w-[104px] text-[12px] font-medium leading-[17px] bg-[#e6f1fb] text-[#255276] dark:bg-[#213748] dark:text-[#abd6f5]">
            Vacaciones
          </span>
        );
      case "falta_injustificada":
        return (
          <span className="inline-flex items-center justify-center rounded-[8px] px-[12px] py-[6px] min-w-[104px] text-[12px] font-medium leading-[17px] bg-[#fcebe9] text-[#a6302a] dark:bg-[#3e2220] dark:text-[#f29b94]">
            Ausencia
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center rounded-[8px] px-[12px] py-[6px] min-w-[104px] text-[12px] font-medium leading-[17px] bg-muted text-muted-foreground">
            Descanso
          </span>
        );
    }
  };

  const getMethodLabel = (method: AttendanceRecord["checkInMethod"], hasCheckIn: boolean) => {
    if (!hasCheckIn) return "—";
    switch (method) {
      case "qr":
        return "QR";
      case "gps":
        return "GPS";
      case "manual":
        return "Manual";
      default:
        return "—";
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
            className="flex items-center gap-[6px] text-[13px] font-semibold leading-[18px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
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
          const item = row.original;
          return (
            <div className="flex items-center gap-[10px] py-1 min-w-[200px]">
              <Avatar
                onClick={() => setSelectedEmployeeForDossier(item)}
                className="size-[36px] rounded-[12px] bg-sidebar-accent shrink-0 cursor-pointer after:hidden"
              >
                <AvatarImage
                  src={item.avatarUrl || ""}
                  alt={item.employeeName}
                  className="rounded-[12px] object-cover"
                />
                <AvatarFallback className="rounded-[12px] font-semibold text-[12px] leading-[16px] bg-sidebar-accent text-link">
                  {getInitials(item.employeeName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex flex-col gap-px">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeForDossier(item)}
                  className="text-[14px] font-semibold leading-[20px] text-foreground hover:text-link transition-colors truncate block text-left cursor-pointer"
                >
                  {item.employeeName}
                </button>
                <p className="text-[12px] font-normal leading-[16px] text-muted-foreground truncate">
                  {item.department || item.jobTitle}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "scheduledCheckIn",
        id: "schedule",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground">
            Horario pactado
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <span className="text-[13px] font-normal leading-[18px] text-foreground tabular-nums whitespace-nowrap">
              {item.scheduledCheckIn}–{item.scheduledCheckOut}
            </span>
          );
        },
      },
      {
        accessorKey: "checkInTime",
        id: "checkInTime",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground">
            Entrada / salida real
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (!item.checkInTime && !item.checkOutTime) {
            return (
              <span className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                —
              </span>
            );
          }
          return (
            <span className="text-[13px] font-medium leading-[18px] text-foreground tabular-nums whitespace-nowrap">
              {item.checkInTime || "--:--"}–{item.checkOutTime || "--:--"}
            </span>
          );
        },
      },
      {
        accessorKey: "checkInMethod",
        id: "checkInMethod",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground">
            Método
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const label = getMethodLabel(item.checkInMethod, Boolean(item.checkInTime));
          return (
            <span
              className={cn(
                "text-[13px] font-normal leading-[18px]",
                label === "—" ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {label}
            </span>
          );
        },
      },
      {
        accessorKey: "overtimeHours",
        id: "overtimeHours",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground">
            Horas extra
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (!item.overtimeHours || item.overtimeHours <= 0) {
            return (
              <span className="text-[13px] font-normal leading-[18px] text-muted-foreground">
                —
              </span>
            );
          }

          const isApproved = item.overtimeStatus === "autorizado";
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRecordForOvertime(item);
              }}
              className={cn(
                "text-[13px] leading-[18px] cursor-pointer hover:underline whitespace-nowrap",
                isApproved ? "text-foreground font-normal" : "text-link font-medium"
              )}
            >
              {item.overtimeHours} h · {isApproved ? "Aprobada" : "Revisar"}
            </button>
          );
        },
      },
      {
        accessorKey: "status",
        id: "status",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground">
            Estatus
          </span>
        ),
        cell: ({ row }) => getStatusPill(row.original.status),
      },
      {
        id: "actions",
        header: () => (
          <span className="text-[13px] font-semibold leading-[18px] text-muted-foreground block text-center">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          const isAbsent =
            item.status === "falta_injustificada" ||
            item.status === "falta_justificada";

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
                      aria-label={`Más acciones de ${item.employeeName}`}
                      className="size-[40px] rounded-[8px] bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors flex items-center justify-center"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="rounded-xl border border-border/50 bg-popover min-w-[210px] shadow-lg p-1.5"
                >
                  <DropdownMenuItem
                    onClick={() => setSelectedEmployeeForDossier(item)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-foreground hover:bg-muted"
                  >
                    <Eye className="size-3.5 text-muted-foreground" />
                    <span>Ver Expediente Mensual 360</span>
                  </DropdownMenuItem>

                  {isAbsent && (
                    <DropdownMenuItem
                      onClick={() => setSelectedRecordForJustification(item)}
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
                    onClick={() => setSelectedRecordForOvertime(item)}
                    className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Gestionar Horas Extra</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-border/40" />

                  <DropdownMenuItem
                    onClick={() => {
                      setManualInitialSelection({
                        employeeId: item.employeeId,
                        name: item.employeeName,
                        checkInTime: item.checkInTime || "08:00",
                        status: item.status,
                      });
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
        pageSize: 10,
      },
    },
  });

  const tableRows = table.getRowModel().rows;
  const totalFilteredRows = filteredRecords.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(1, table.getPageCount());
  const rangeStart = totalFilteredRows === 0 ? 0 : pageIndex * 10 + 1;
  const rangeEnd = Math.min((pageIndex + 1) * 10, totalFilteredRows);

  return (
    <div className="flex flex-col gap-[24px] w-full pb-12 font-sans animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex flex-col gap-[8px]">
          <h1 className="text-[32px] font-semibold leading-[40px] tracking-[-0.02em] text-foreground">
            Asistencia
          </h1>
          <p className="text-[14px] font-normal leading-[20px] text-muted-foreground">
            Consulta entradas, salidas e incidencias por fecha.
          </p>
        </div>

        <div className="flex items-center gap-[8px] flex-wrap shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsQrKioskOpen(true)}
            className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 gap-[8px] cursor-pointer"
          >
            <HugeiconsIcon icon={QrCodeIcon} size={16} strokeWidth={1.8} />
            <span>QR de sucursal</span>
          </Button>

          <Button
            onClick={() => setIsManualModalOpen(true)}
            className="h-[44px] px-[16px] rounded-[8px] bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 gap-[8px] cursor-pointer"
          >
            <Plus className="size-[16px]" />
            <span>Registrar entrada manual</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">
              Puntualidad
            </span>
            <div className="size-[32px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Clock01Icon} size={18} strokeWidth={1.8} />
            </div>
          </div>
          <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
            {stats.punctualityRate} %
          </span>
          <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Tolerancia de {toleranceMinutes} {toleranceMinutes === 1 ? "minuto" : "minutos"}
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">
              Presentes
            </span>
            <div className="size-[32px] rounded-[8px] bg-success text-success-foreground flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserCheck01Icon} size={18} strokeWidth={1.8} />
            </div>
          </div>
          <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
            {stats.presentCount}
          </span>
          <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Entradas puntuales
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">
              Retardos
            </span>
            <div className="size-[32px] rounded-[8px] bg-warning text-warning-foreground flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={1.8} />
            </div>
          </div>
          <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
            {stats.lateCount}
          </span>
          <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            Fuera de tolerancia
          </span>
        </div>

        <div className="bg-card border border-border rounded-[16px] p-[16px] flex flex-col gap-[8px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium leading-[20px] text-muted-foreground">
              Ausencias
            </span>
            <div className="size-[32px] rounded-[8px] bg-[#fcebe9] text-[#a6302a] dark:bg-[#3e2220] dark:text-[#f29b94] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={CancelCircleIcon} size={18} strokeWidth={1.8} />
            </div>
          </div>
          <span className="text-[24px] font-semibold leading-[32px] text-foreground tabular-nums">
            {stats.unjustifiedAbsences + stats.justifiedAbsences}
          </span>
          <span className="text-[12px] font-normal leading-[16px] text-muted-foreground">
            {stats.justifiedAbsences} justificadas · {stats.unjustifiedAbsences} sin justificar
          </span>
        </div>
      </div>

      {/* 3. Registros de asistencia Card */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden flex flex-col">
        {/* Card Header & Filters */}
        <div className="p-[20px] flex flex-col gap-[20px] border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[20px] font-semibold leading-[28px] tracking-[-0.015em] text-foreground">
              Registros de asistencia
            </h2>

            <div className="flex items-center gap-[8px]">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="h-[44px] px-[16px] rounded-[8px] border-control-border bg-card text-foreground text-[14px] font-medium hover:bg-muted/60 gap-[8px] cursor-pointer"
              >
                <HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={1.8} />
                <span>{isExporting ? "Exportando..." : "Exportar CSV"}</span>
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap lg:items-end gap-[12px]">
            {/* Fecha */}
            <div className="flex flex-col gap-[6px] w-full sm:w-[190px] shrink-0">
              <label
                htmlFor="attendance-work-date"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Fecha
              </label>
              <div className="relative h-[44px] rounded-[8px] border border-input bg-card px-[12px] flex items-center gap-[8px]">
                <Calendar className="size-[16px] text-muted-foreground shrink-0 pointer-events-none" />
                <input
                  id="attendance-work-date"
                  type="date"
                  value={workDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      router.push(`/dashboard/company/attendance?date=${e.target.value}`);
                    }
                  }}
                  className="w-full bg-transparent text-[14px] font-normal text-foreground outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Buscar registros */}
            <div className="flex flex-col gap-[6px] flex-1 min-w-[200px]">
              <label
                htmlFor="attendance-search-input"
                className="text-[14px] font-medium leading-[20px] text-foreground"
              >
                Buscar registros
              </label>
              <div className="relative">
                <Search className="absolute left-[12px] top-1/2 -translate-y-1/2 text-muted-foreground size-[16px] pointer-events-none" />
                <Input
                  id="attendance-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Empleado, puesto o turno"
                  className="h-[44px] pl-[36px] pr-[36px] rounded-[8px] border-input bg-card text-[14px] font-normal placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-[16px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Área */}
            <div className="flex flex-col gap-[6px] w-full sm:w-[210px] shrink-0">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Área
              </span>
              <Select
                value={deptFilter}
                onValueChange={(val) => setDeptFilter(val || "all")}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Todas las áreas">
                    {deptFilter === "all" ? "Todas las áreas" : deptFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  <SelectItem
                    value="all"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Todas las áreas
                  </SelectItem>
                  {departmentsList.map((d) => (
                    <SelectItem
                      key={d}
                      value={d}
                      className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                    >
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Método */}
            <div className="flex flex-col gap-[6px] w-full sm:w-[210px] shrink-0">
              <span className="text-[14px] font-medium leading-[20px] text-foreground">
                Método
              </span>
              <Select
                value={methodFilter}
                onValueChange={(val) => setMethodFilter(val || "all")}
              >
                <SelectTrigger className="h-[44px] w-full rounded-[8px] border-input bg-card px-[12px] text-[14px] font-normal">
                  <SelectValue placeholder="Todos los métodos">
                    {methodFilter === "all"
                      ? "Todos los métodos"
                      : methodFilter === "gps"
                      ? "GPS Geocerca"
                      : methodFilter === "qr"
                      ? "QR Sucursal"
                      : "Manual RH"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border-border bg-popover shadow-lg">
                  <SelectItem
                    value="all"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Todos los métodos
                  </SelectItem>
                  <SelectItem
                    value="qr"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    QR Sucursal
                  </SelectItem>
                  <SelectItem
                    value="gps"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    GPS Geocerca
                  </SelectItem>
                  <SelectItem
                    value="manual"
                    className="text-[14px] font-normal rounded-[8px] cursor-pointer"
                  >
                    Manual RH
                  </SelectItem>
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
          <div className="flex items-center gap-[4px] flex-wrap">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "h-[36px] px-[12px] rounded-[8px] text-[14px] font-medium leading-[20px] transition-colors cursor-pointer",
                statusFilter === "all"
                  ? "bg-sidebar-accent text-link"
                  : "text-foreground hover:bg-muted"
              )}
            >
              Todos · {records.length}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("presente")}
              className={cn(
                "h-[36px] px-[12px] rounded-[8px] text-[14px] font-medium leading-[20px] transition-colors cursor-pointer",
                statusFilter === "presente"
                  ? "bg-sidebar-accent text-link"
                  : "text-foreground hover:bg-muted"
              )}
            >
              Presentes · {stats.presentCount}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("retardo")}
              className={cn(
                "h-[36px] px-[12px] rounded-[8px] text-[14px] font-medium leading-[20px] transition-colors cursor-pointer",
                statusFilter === "retardo"
                  ? "bg-sidebar-accent text-link"
                  : "text-foreground hover:bg-muted"
              )}
            >
              Retardos · {stats.lateCount}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ausencias")}
              className={cn(
                "h-[36px] px-[12px] rounded-[8px] text-[14px] font-medium leading-[20px] transition-colors cursor-pointer",
                statusFilter === "ausencias"
                  ? "bg-sidebar-accent text-link"
                  : "text-foreground hover:bg-muted"
              )}
            >
              Ausencias · {stats.unjustifiedAbsences + stats.justifiedAbsences}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("overtime")}
              className={cn(
                "h-[36px] px-[12px] rounded-[8px] text-[14px] font-medium leading-[20px] transition-colors cursor-pointer",
                statusFilter === "overtime"
                  ? "bg-sidebar-accent text-link"
                  : "text-foreground hover:bg-muted"
              )}
            >
              Horas extra
            </button>
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
                    : "Los empleados comenzarán a registrar sus entradas por GPS o QR durante el turno activo."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {isFiltered ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="font-bold text-xs cursor-pointer gap-1.5"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Restablecer Filtros</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsManualModalOpen(true)}
                    className="font-bold text-xs cursor-pointer gap-1.5"
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
                      className="border-b border-border hover:bg-muted/40 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="min-h-[60px] py-[8px] px-[16px]"
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
              <div className="px-[16px] py-[16px] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[14px] font-normal leading-[20px] text-muted-foreground">
                  {rangeStart}–{rangeEnd} de {totalFilteredRows} registros
                </span>

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
                  <span className="text-[14px] font-normal leading-[20px] text-foreground px-[4px]">
                    Página {pageIndex + 1} de {pageCount}
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
              </div>
            </div>
          )}
        </div>
      </div>

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
        companyId={companyId}
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
      <ManualAttendanceModal
        isOpen={isManualModalOpen}
        onOpenChange={(open) => {
          setIsManualModalOpen(open);
          if (!open) setManualInitialSelection(null);
        }}
        employees={employees}
        existingRecords={records}
        workDate={workDate}
        initialSelection={manualInitialSelection}
        onRecordCreated={handleRecordCreated}
      />
    </div>
  );
}
