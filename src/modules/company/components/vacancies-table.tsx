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
  User,
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
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { VacancyRow } from "@/hooks/use-vacancy-manager";

export interface VacancyTableItem extends VacancyRow {
  applicants_count?: number;
  expires_at?: string | null;
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
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const columns = React.useMemo<ColumnDef<VacancyTableItem>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="px-1 flex items-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
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
            className="flex items-center gap-2 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Puesto / Categoría</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-4 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div className="flex flex-col gap-1 py-1">
              <span className="font-[800] text-[15px] sm:text-[16px] text-[#1f2732] dark:text-zinc-100 leading-snug">
                {vacancy.title}
              </span>
              <span className="text-[11px] sm:text-[12px] text-[#5c7c9b] dark:text-zinc-400 font-extrabold uppercase tracking-wider">
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
            className="flex items-center gap-2 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Ubicación / Zona</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-4 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const zoneText = vacancy.zone || vacancy.location || "No especificada";
          return (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-200 py-1 max-w-[240px] lg:max-w-[320px]" title={zoneText}>
              <MapPin className="size-3.5 sm:size-4 text-[#5c7c9b] shrink-0" />
              <span className="truncate">{zoneText}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "applicants_count",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Candidatos</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-3.5 sm:size-4 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const count = row.original.applicants_count ?? 0;
          return (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1f2732] dark:text-zinc-100 py-1">
              <User className="size-3.5 text-[#5c7c9b]" />
              <span>{count}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "expires_at",
        accessorFn: (row) => row.expires_at || row.featured_until || row.created_at,
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Vencimiento</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-3.5 sm:size-4 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const expDate = row.original.expires_at || row.original.featured_until;
          const displayDate = expDate ? formatDate(expDate) : "30 días";
          return (
            <span className="text-xs sm:text-sm text-[#5c7c9b] dark:text-zinc-400 font-semibold py-1 block whitespace-nowrap">
              {displayDate}
            </span>
          );
        },
      },
      {
        accessorKey: "salary_min",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Sueldo</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-3.5 sm:size-4 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <span className="font-[800] text-xs sm:text-sm text-[#1f2732] dark:text-zinc-100 py-1 block whitespace-nowrap">
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
            className="flex items-center gap-1.5 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estado</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-3.5 sm:size-4 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          const statusText = vacancy.status || (vacancy.is_active ? "Activa" : "Pausada");
          const isAct = vacancy.is_active && statusText !== "Cerrada";
          return (
            <Badge
              variant="secondary"
              onClick={() => onToggleActive(vacancy.id, vacancy.is_active)}
              className={cn(
                "text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase px-3 py-1 flex items-center w-fit border cursor-pointer hover:opacity-85 select-none rounded-full transition-all whitespace-nowrap",
                statusText === "Cerrada"
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                  : isAct
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
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
            className="flex items-center gap-1.5 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none whitespace-nowrap"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 sm:size-4 text-[#1f2732] dark:text-zinc-100" />
            ) : (
              <ArrowUpDown className="size-3.5 sm:size-4 text-[#5c7c9b]/60" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <span className="text-xs sm:text-sm text-[#5c7c9b] dark:text-zinc-400 font-semibold py-1 block whitespace-nowrap">
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
            <div className="text-right py-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 p-0 rounded-[12px] border border-[#d2dbe5] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
                  >
                    <MoreHorizontal className="h-4 w-4 text-[#5c7c9b]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[18px] border border-[#ebeef3] dark:border-zinc-800 bg-popover min-w-[170px] shadow-lg p-2">
                  <DropdownMenuItem asChild className="cursor-pointer text-xs sm:text-sm font-bold text-[#1f2732] dark:text-zinc-200 rounded-[12px] hover:bg-muted py-3 px-3 gap-3">
                    <Link href={`/dashboard/company/vacancies/${vacancy.id}`}>
                      <Eye className="size-4 text-[#5c7c9b]" />
                      <span>Ver detalles</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer text-xs sm:text-sm font-bold text-[#1f2732] dark:text-zinc-200 rounded-[12px] hover:bg-muted py-3 px-3 gap-3">
                    <Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`}>
                      <Edit2 className="size-4 text-[#5c7c9b]" />
                      <span>Editar</span>
                    </Link>
                  </DropdownMenuItem>
                  {onCloneVacancy && (
                    <DropdownMenuItem
                      onSelect={() => onCloneVacancy(vacancy.id)}
                      className="cursor-pointer text-xs sm:text-sm font-bold text-[#1f2732] dark:text-zinc-200 rounded-[12px] hover:bg-muted py-3 px-3 gap-3"
                    >
                      <Copy className="size-4 text-[#5c7c9b]" />
                      <span>Duplicar / Clonar</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onSelect={() => onDeleteVacancy(vacancy.id)}
                    className="cursor-pointer text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 rounded-[12px] hover:bg-rose-500/10 focus:bg-rose-500/10 py-3 px-3 gap-3"
                  >
                    <Trash2 className="size-4 text-rose-500" />
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
    <div className="space-y-4">
      {/* Batch Actions Toolbar */}
      {selectedCount > 0 && (
        <div className="bg-[#1f2732] dark:bg-zinc-800 text-white p-3.5 sm:px-6 rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckSquare className="size-4.5 text-emerald-400" />
            <span className="text-xs sm:text-sm font-extrabold">
              {selectedCount} {selectedCount === 1 ? "vacante seleccionada" : "vacantes seleccionadas"}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBatchAction("Activa")}
              className="h-9 px-3.5 rounded-[12px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold gap-1.5 cursor-pointer"
            >
              <PlayCircle className="size-3.5" />
              <span>Activar</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBatchAction("Pausada")}
              className="h-9 px-3.5 rounded-[12px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold gap-1.5 cursor-pointer"
            >
              <PauseCircle className="size-3.5" />
              <span>Pausar lote</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleBatchAction("Cerrada")}
              className="h-9 px-3.5 rounded-[12px] bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold gap-1.5 cursor-pointer"
            >
              <XCircle className="size-3.5" />
              <span>Cerrar lote</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRowSelection({})}
              className="h-9 px-3 rounded-[12px] text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              Deseleccionar
            </Button>
          </div>
        </div>
      )}

      <div className="border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] bg-white dark:bg-[#18181b] overflow-hidden shadow-xs">
        
        {/* Table Container */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-[#f5f7fa]/80 dark:bg-zinc-900/60 border-b border-[#ebeef3] dark:border-zinc-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="py-4 px-3 sm:px-4">
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
                    className={cn(
                      "border-b border-[#ebeef3]/60 dark:border-zinc-800/50 transition-colors hover:bg-[#f5f7fa]/60 dark:hover:bg-zinc-900/40",
                      !row.original.is_active && "opacity-75"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 sm:px-4 py-3.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-sm font-semibold text-[#5c7c9b]">
                    No hay vacantes disponibles en esta lista.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 border-t border-[#ebeef3] dark:border-zinc-800 bg-[#f5f7fa]/60 dark:bg-zinc-900/30">
          
          {/* Total info & Rows per page selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-200">
              Mostrando <span className="font-[800] text-[#1f2732] dark:text-zinc-100">{table.getRowModel().rows.length}</span> de <span className="font-[800] text-[#1f2732] dark:text-zinc-100">{data.length}</span> vacantes
            </span>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5c7c9b]">Por página:</span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-11 w-[80px] rounded-[14px] text-xs sm:text-sm font-bold bg-white dark:bg-zinc-900 border border-[#d2dbe5] dark:border-zinc-800 text-[#1f2732] dark:text-zinc-100 cursor-pointer">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent className="rounded-[16px] border border-[#ebeef3] dark:border-zinc-800">
                  {[10, 20, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs sm:text-sm font-bold cursor-pointer">
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pagination Navigation Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold text-[#1f2732] dark:text-zinc-200 mr-2">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="h-11 w-11 rounded-[14px] border border-[#d2dbe5] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 text-[#1f2732] dark:text-zinc-100 cursor-pointer disabled:opacity-40"
            >
              <ChevronsLeft className="size-4.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-11 w-11 rounded-[14px] border border-[#d2dbe5] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 text-[#1f2732] dark:text-zinc-100 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="size-4.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-11 w-11 rounded-[14px] border border-[#d2dbe5] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 text-[#1f2732] dark:text-zinc-100 cursor-pointer disabled:opacity-40"
            >
              <ChevronRight className="size-4.5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="h-11 w-11 rounded-[14px] border border-[#d2dbe5] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 text-[#1f2732] dark:text-zinc-100 cursor-pointer disabled:opacity-40"
            >
              <ChevronsRight className="size-4.5" />
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
}
