"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  PauseCircle,
  XCircle,
  PlayCircle,
  Users,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { VacancyRow } from "@/modules/company/hooks/use-vacancy-manager";
import { VacancyPreviewDrawer } from "./vacancy-preview-drawer";

export interface VacancyTableItem extends VacancyRow {
  applicants_count?: number;
}

interface VacanciesTableProps {
  data: VacancyTableItem[];
  onToggleActive: (id: string, currentActive: boolean) => void;
  onBatchStatusChange?: (ids: string[], newStatus: "Activa" | "Pausada" | "Cerrada") => void;
  onDeleteVacancy: (id: string) => void;
  onCloneVacancy?: (id: string) => void;
  formatSalary: (min: number | null, max: number | null) => string;
  formatDate: (dateStr: string) => string;
}

export function VacanciesTable({
  data,
  onToggleActive,
  onBatchStatusChange,
  onDeleteVacancy,
  onCloneVacancy,
  formatSalary,
  formatDate,
}: VacanciesTableProps) {
  const [previewVacancy, setPreviewVacancy] = React.useState<VacancyTableItem | null>(null);
  const [deletingVacancyId, setDeletingVacancyId] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const deletingVacancy = React.useMemo(() => {
    return data.find((v) => v.id === deletingVacancyId) || null;
  }, [data, deletingVacancyId]);

  const handleToggleActiveLocal = (id: string, currentActive: boolean) => {
    onToggleActive(id, currentActive);
    setPreviewVacancy((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            is_active: !currentActive,
            status: !currentActive ? "Activa" : "Cerrada",
          }
        : prev
    );
  };

  const columns = React.useMemo<ColumnDef<VacancyTableItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="px-1 flex items-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Puesto / Categoría</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div className="flex flex-col gap-0.5 py-1">
              <button
                type="button"
                onClick={() => setPreviewVacancy(vacancy)}
                className="font-bold text-sm text-foreground hover:text-primary hover:underline line-clamp-1 text-left cursor-pointer"
                title="Ver detalles de la vacante"
              >
                {vacancy.title}
              </button>
              <span className="text-[11px] text-muted-foreground font-semibold">
                {vacancy.category || "General"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "zone",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Ubicación</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const zoneText = vacancy.zone || vacancy.location || "Mérida";
          return (
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground py-1" title={zoneText}>
              <MapPin className="size-3 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[180px]">{zoneText}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "applicants_count",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Candidatos</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const count = row.original.applicants_count ?? 0;
          return (
            <div className="flex items-center gap-1 text-xs font-bold text-foreground py-1">
              <Users className="size-3.5 text-muted-foreground" />
              <span className="font-mono">{count}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "salary_min",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Sueldo</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <span className="font-bold text-xs text-foreground font-mono py-1 block whitespace-nowrap">
              {formatSalary(vacancy.salary_min, vacancy.salary_max)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        accessorFn: (row) => row.status || (row.is_active ? "Activa" : "Pausada"),
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estado</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const statusText = vacancy.status || (vacancy.is_active ? "Activa" : "Pausada");
          const isAct = vacancy.is_active && statusText !== "Cerrada";
          return (
            <Badge
              variant="outline"
              onClick={() => onToggleActive(vacancy.id, vacancy.is_active)}
              className={cn(
                "text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer hover:opacity-85 select-none transition-all whitespace-nowrap border",
                statusText === "Cerrada"
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : isAct
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border/60"
              )}
            >
              {statusText}
            </Badge>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-foreground" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-foreground" />
            ) : (
              <ArrowUpDown className="size-3 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <span className="text-xs text-muted-foreground font-medium py-1 block whitespace-nowrap">
              {formatDate(vacancy.created_at)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div
              className="text-right py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    />
                  }
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border border-border/60 bg-popover min-w-[170px] shadow-lg p-1.5">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewVacancy(vacancy);
                    }}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2.5 text-foreground"
                  >
                    <Eye className="size-3.5 text-primary" />
                    <span>Ver detalles</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => e.stopPropagation()}
                    render={<Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`} />}
                    className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2.5"
                  >
                    <Edit2 className="size-3.5 text-muted-foreground" />
                    <span>Editar</span>
                  </DropdownMenuItem>
                  {onCloneVacancy && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloneVacancy(vacancy.id);
                      }}
                      className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2.5"
                    >
                      <Copy className="size-3.5 text-muted-foreground" />
                      <span>Duplicar</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewVacancy(null);
                      setDeletingVacancyId(vacancy.id);
                    }}
                    className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 focus:bg-rose-500/10 py-2 px-2.5 gap-2.5"
                  >
                    <Trash2 className="size-3.5 text-rose-500" />
                    <span>Eliminar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onToggleActive, onDeleteVacancy, onCloneVacancy, formatSalary, formatDate]
  );

  const table = useReactTable({
    data,
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBatchAction = (newStatus: "Activa" | "Pausada" | "Cerrada") => {
    if (!onBatchStatusChange || selectedCount === 0) return;
    const selectedIds = selectedRows.map((r) => r.original.id);
    onBatchStatusChange(selectedIds, newStatus);
    setRowSelection({});
  };

  return (
    <div className="w-full">
      {/* Batch Actions Toolbar */}
      {selectedCount > 0 && (
        <div className="bg-primary text-primary-foreground p-3 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border/40 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckSquare className="size-4 text-emerald-400" />
            <span className="text-xs font-bold">
              {selectedCount} {selectedCount === 1 ? "vacante seleccionada" : "vacantes seleccionadas"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBatchAction("Activa")}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
            >
              <PlayCircle className="size-3.5 text-emerald-500" />
              <span>Activar</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBatchAction("Pausada")}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
            >
              <PauseCircle className="size-3.5 text-amber-500" />
              <span>Pausar</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBatchAction("Cerrada")}
              className="h-8 px-3 rounded-lg text-xs font-bold gap-1 cursor-pointer"
            >
              <XCircle className="size-3.5 text-rose-500" />
              <span>Cerrar</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRowSelection({})}
              className="h-8 px-2.5 rounded-lg text-xs font-semibold text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 cursor-pointer"
            >
              Deseleccionar
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/40 border-b border-border/60">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="py-3 px-3 sm:px-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
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
                      "border-b border-border/40 transition-colors hover:bg-muted/40 cursor-pointer",
                      !row.original.is_active && "opacity-80"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-3 sm:px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-xs font-medium text-muted-foreground">
                    Sin resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modern Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/60 bg-muted/20 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <span>
              {table.getFilteredRowModel().rows.length} vacantes en total
            </span>
            {selectedCount > 0 && (
              <span className="font-bold text-foreground">
                ({selectedCount} seleccionadas)
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Filas:</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(val) => {
                  table.setPageSize(Number(val));
                }}
              >
                <SelectTrigger className="h-7 w-16 rounded-md border border-border/60 bg-card text-xs font-medium cursor-pointer">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/60 bg-popover shadow-md">
                  {[5, 10, 20, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={String(pageSize)} className="text-xs cursor-pointer">
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Page Text */}
            <span className="text-muted-foreground font-medium">
              Página <strong className="text-foreground">{table.getState().pagination.pageIndex + 1}</strong> de{" "}
              <strong className="text-foreground">{table.getPageCount() || 1}</strong>
            </span>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-md border border-border/60 cursor-pointer"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-md border border-border/60 cursor-pointer"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-md border border-border/60 cursor-pointer"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-md border border-border/60 cursor-pointer"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Alert Dialog for Confirming Deletion */}
        <AlertDialog
          open={deletingVacancyId !== null}
          onOpenChange={(open) => !open && setDeletingVacancyId(null)}
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
                onClick={() => setDeletingVacancyId(null)}
                className="rounded-xl font-semibold text-xs h-10 px-4 cursor-pointer"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingVacancyId) {
                    onDeleteVacancy(deletingVacancyId);
                    setDeletingVacancyId(null);
                  }
                }}
                className="rounded-xl font-bold text-xs h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white border-none cursor-pointer gap-2"
              >
                <Trash2 className="size-3.5" />
                <span>Eliminar Definitivamente</span>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Vacancy Preview Drawer */}
        <VacancyPreviewDrawer
          vacancy={previewVacancy}
          open={!!previewVacancy && deletingVacancyId === null}
          onOpenChange={(open) => !open && setPreviewVacancy(null)}
          onToggleActive={handleToggleActiveLocal}
          formatSalary={formatSalary}
          formatDate={formatDate}
        />
      </div>
  );
}
