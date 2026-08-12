"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  REASON_CONFIG,
  REPORT_STATUS_CONFIG,
  type VacancyReportItem,
} from "@/modules/admin/types/moderation";
import {
  quickDeactivateVacancy,
  banUserAccount,
  toggleCompanyVerification,
  resolveReport,
} from "@/app/(dashboard)/dashboard/admin/reports/actions";
import {
  ShieldAlertIcon,
  BanIcon,
  EyeIcon,
  MoreHorizontalIcon,
  SearchIcon,
  XCircleIcon,
  Building2Icon,
  ShieldCheckIcon,
  AlertTriangleIcon,
} from "lucide-react";

interface ReportsDataTableProps {
  data: VacancyReportItem[];
  onRefresh?: () => void;
}

export function ReportsDataTable({ data, onRefresh }: ReportsDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusTab, setStatusTab] = React.useState<string>("all");

  // Selected item for Inspection Modal
  const [inspectReport, setInspectReport] = React.useState<VacancyReportItem | null>(null);

  // Selected item for Ban Confirmation Dialog
  const [banTarget, setBanTarget] = React.useState<{ userId: string; name: string } | null>(null);
  const [banning, setBanning] = React.useState(false);

  // Quick Action States
  const [deactivatingId, setDeactivatingId] = React.useState<string | null>(null);
  const [togglingVerifyId, setTogglingVerifyId] = React.useState<string | null>(null);

  const filteredData = React.useMemo(() => {
    if (statusTab === "all") return data;
    return data.filter((item) => item.status === statusTab);
  }, [data, statusTab]);

  const handleDeactivateVacancy = async (vacancyId: string, vacancyTitle: string) => {
    setDeactivatingId(vacancyId);
    try {
      await quickDeactivateVacancy(vacancyId);
      toast.success(`La vacante "${vacancyTitle}" ha sido desactivada e hidrata de K’anPro.`);
      onRefresh?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al desactivar vacante");
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleToggleVerification = async (companyId: string, companyName: string, currentStatus: boolean) => {
    setTogglingVerifyId(companyId);
    try {
      await toggleCompanyVerification(companyId, !currentStatus);
      toast.success(
        !currentStatus
          ? `Insignia de "Empresa Verificada" otorgada a ${companyName}`
          : `Insignia de verificación revocada a ${companyName}`
      );
      onRefresh?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al cambiar estado de verificación");
    } finally {
      setTogglingVerifyId(null);
    }
  };

  const handleConfirmBan = async () => {
    if (!banTarget) return;
    setBanning(true);
    try {
      await banUserAccount(banTarget.userId, "Reportes de vacantes fraudulentas o cobro indebido");
      toast.success(`La cuenta de ${banTarget.name} ha sido suspendida/baneada permanentemente.`);
      setBanTarget(null);
      onRefresh?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al banear usuario.");
    } finally {
      setBanning(false);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await resolveReport(reportId, "dismissed", "dismissed");
      toast.info("El reporte ha sido desestimado.");
      onRefresh?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Error al desestimar reporte.");
    }
  };

  const columns = React.useMemo<ColumnDef<VacancyReportItem>[]>(
    () => [
      {
        accessorKey: "reason",
        header: "Motivo de Denuncia",
        cell: ({ row }) => {
          const reasonConfig = REASON_CONFIG[row.original.reason] || REASON_CONFIG.cobro_dinero;
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className={`w-fit text-xs px-2.5 py-0.5 ${reasonConfig.badgeClass}`}>
                <span className="mr-1.5">{reasonConfig.icon}</span>
                {reasonConfig.label}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">ID: {row.original.id}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "vacancyTitle",
        header: "Vacante Denunciada",
        cell: ({ row }) => (
          <div className="flex flex-col max-w-xs">
            <span className="font-bold text-xs text-foreground line-clamp-1">
              {row.original.vacancyTitle}
            </span>
            <span className="text-[11px] text-muted-foreground">{row.original.vacancyCategory}</span>
          </div>
        ),
      },
      {
        accessorKey: "companyName",
        header: "Empresa Responsable",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <Building2Icon className="size-3.5 text-muted-foreground shrink-0" />
                <span className="font-semibold text-xs text-foreground truncate max-w-[160px]">
                  {item.companyName}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                {item.companyRfc && (
                  <span className="text-[10px] font-mono text-muted-foreground">RFC: {item.companyRfc}</span>
                )}
                {item.companyIsVerified ? (
                  <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-600 text-[10px] px-1.5 py-0 font-semibold gap-0.5">
                    <ShieldCheckIcon className="size-2.5" />
                    Verificada
                  </Badge>
                ) : (
                  <span className="text-[10px] text-amber-600 font-medium">No verificada</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "companyIsVerified",
        header: "Badge Verificada",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={item.companyIsVerified}
                disabled={togglingVerifyId === item.companyId}
                onCheckedChange={() => handleToggleVerification(item.companyId, item.companyName, item.companyIsVerified)}
              />
              <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
                {item.companyIsVerified ? "Sí" : "No"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const statusConfig = REPORT_STATUS_CONFIG[row.original.status] || REPORT_STATUS_CONFIG.pending;
          return (
            <Badge variant="outline" className={`text-[11px] px-2 py-0.5 ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Fecha Reporte",
        cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.createdAt}</span>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acciones de Seguridad</div>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Instant Deactivate Button */}
              <Button
                variant="outline"
                size="sm"
                disabled={deactivatingId === item.vacancyId}
                onClick={() => handleDeactivateVacancy(item.vacancyId, item.vacancyTitle)}
                className="h-8 text-xs px-2.5 font-semibold border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1"
                title="Desactivar u ocultar vacante inmediatamente"
              >
                <AlertTriangleIcon className="size-3.5 text-amber-500" />
                <span className="hidden xl:inline">Ocultar Vacante</span>
              </Button>

              {/* Instant Ban Account Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBanTarget({ userId: item.companyId, name: item.companyName })}
                className="h-8 text-xs px-2.5 font-semibold border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 gap-1"
                title="Bloquear/Banear cuenta permanentemente"
              >
                <BanIcon className="size-3.5 text-red-500" />
                <span className="hidden xl:inline">Banear</span>
              </Button>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                  <DropdownMenuLabel className="text-xs">Acciones de Moderación</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs font-medium cursor-pointer gap-2"
                    onClick={() => setInspectReport(item)}
                  >
                    <EyeIcon className="size-3.5 text-purple-500" />
                    Inspeccionar Reporte
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs font-medium cursor-pointer gap-2 text-green-600"
                    onClick={() => handleToggleVerification(item.companyId, item.companyName, item.companyIsVerified)}
                  >
                    <ShieldCheckIcon className="size-3.5 text-green-500" />
                    {item.companyIsVerified ? "Revocar Verificación" : "Otorgar Badge Verificado"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-xs font-medium cursor-pointer gap-2 text-muted-foreground"
                    onClick={() => handleDismissReport(item.id)}
                  >
                    <XCircleIcon className="size-3.5" />
                    Desestimar Reporte
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [deactivatingId, togglingVerifyId]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border/40">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Todos" },
            { id: "pending", label: "Pendientes" },
            { id: "action_taken", label: "Sancionados" },
            { id: "dismissed", label: "Desestimados" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={statusTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusTab(tab.id)}
              className={`h-8 text-xs font-semibold rounded-lg px-3 ${
                statusTab === tab.id ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por vacante, motivo o empresa..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-border/40"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-border/40 overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-bold text-foreground py-3">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-xs">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-xs text-muted-foreground">
                  No se encontraron reportes de seguridad en esta categoría.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Report Inspection Modal */}
      {inspectReport && (
        <Dialog open={!!inspectReport} onOpenChange={() => setInspectReport(null)}>
          <DialogContent className="max-w-lg rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <ShieldAlertIcon className="size-5 text-red-500" />
                <span>Detalle de Denuncia de Seguridad</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Reporte registrado por candidato o empresa referente a vacante o conducta sospechosa.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2 text-xs">
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/20 border border-border/30">
                <span className="font-semibold text-muted-foreground text-[11px]">Vacante Reportada:</span>
                <span className="font-bold text-foreground text-sm">{inspectReport.vacancyTitle}</span>
                <span className="text-muted-foreground">Categoría: {inspectReport.vacancyCategory}</span>
              </div>

              <div className="flex flex-col gap-1 p-3 rounded-xl bg-muted/20 border border-border/30">
                <span className="font-semibold text-muted-foreground text-[11px]">Empresa Denunciada:</span>
                <span className="font-bold text-foreground">{inspectReport.companyName}</span>
                {inspectReport.companyRfc && <span>RFC: {inspectReport.companyRfc}</span>}
              </div>

              <div className="flex flex-col gap-1 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-950 dark:text-red-200">
                <span className="font-bold text-red-800 dark:text-red-300 text-[11px]">Detalles del Testimonio:</span>
                <p className="whitespace-pre-wrap leading-relaxed text-xs pt-1">
                  {inspectReport.details || "El usuario no agregó descripción adicional."}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleVerification(inspectReport.companyId, inspectReport.companyName, inspectReport.companyIsVerified)}
                  className="text-xs font-semibold gap-1.5"
                >
                  <ShieldCheckIcon className="size-4 text-green-500" />
                  {inspectReport.companyIsVerified ? "Revocar Badge Verificado" : "Otorgar Badge Verificado"}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    handleDeactivateVacancy(inspectReport.vacancyId, inspectReport.vacancyTitle);
                    setInspectReport(null);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
                >
                  <AlertTriangleIcon className="size-4" />
                  Ocultar Vacante
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Ban User Confirmation Dialog */}
      {banTarget && (
        <AlertDialog open={!!banTarget} onOpenChange={() => setBanTarget(null)}>
          <AlertDialogContent className="rounded-2xl max-w-md p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive font-bold text-base">
                <BanIcon className="size-5" />
                <span>Confirmar Bloqueo y Baneo de Cuenta</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground pt-2">
                ¿Está seguro de banear permanentemente la cuenta de <strong className="text-foreground">{banTarget.name}</strong>?
                <br /><br />
                Esta acción ocultará automáticamente todas sus vacantes publicadas y bloqueará su acceso a la plataforma K’anPro.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 pt-2">
              <AlertDialogCancel disabled={banning} className="text-xs font-semibold">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={banning}
                onClick={handleConfirmBan}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1.5"
              >
                {banning ? "Baneando..." : "Sí, Banear Cuenta"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
