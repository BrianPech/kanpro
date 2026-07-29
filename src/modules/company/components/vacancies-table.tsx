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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface VacanciesTableProps {
  data: VacancyRow[];
  onToggleActive: (id: string, currentActive: boolean) => void;
  onDeleteVacancy: (id: string) => void;
  formatSalary: (min: number | null, max: number | null) => string;
  formatDate: (dateStr: string) => string;
}

export function VacanciesTable({
  data,
  onToggleActive,
  onDeleteVacancy,
  formatSalary,
  formatDate,
}: VacanciesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const columns = React.useMemo<ColumnDef<VacancyRow>[]>(
    () => [
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
          return (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-200 py-1">
              <MapPin className="size-4 text-[#5c7c9b] shrink-0" />
              <span>{vacancy.zone || vacancy.location || "No especificada"}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "salary_min",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-2 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Sueldo Ofrecido</span>
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
            <span className="font-[800] text-xs sm:text-sm text-[#1f2732] dark:text-zinc-100 py-1 block">
              {formatSalary(vacancy.salary_min, vacancy.salary_max)}
            </span>
          );
        },
      },
      {
        accessorKey: "is_active",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-2 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estado</span>
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
            <Badge
              variant="secondary"
              onClick={() => onToggleActive(vacancy.id, vacancy.is_active)}
              className={cn(
                "text-[11px] sm:text-[12px] font-extrabold tracking-wider uppercase px-3.5 py-1.5 flex items-center w-fit border cursor-pointer hover:opacity-85 select-none rounded-full transition-all",
                vacancy.is_active
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
              )}
            >
              {vacancy.is_active ? "Activa" : "Pausada"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-2 font-[800] text-xs sm:text-[13px] uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha</span>
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
            <span className="text-xs sm:text-sm text-[#5c7c9b] dark:text-zinc-400 font-semibold py-1 block">
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
                    className="h-11 w-11 p-0 rounded-[14px] border border-[#d2dbe5] dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-[#f5f7fa] dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
                  >
                    <MoreHorizontal className="h-5 w-5 text-[#5c7c9b]" />
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
    [onToggleActive, onDeleteVacancy, formatSalary, formatDate]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
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

  return (
    <div className="border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] bg-white dark:bg-[#18181b] overflow-hidden shadow-xs">
      
      {/* Table Container */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#f5f7fa]/80 dark:bg-zinc-900/60 border-b border-[#ebeef3] dark:border-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-5 px-6">
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
                    <TableCell key={cell.id} className="px-6 py-4.5">
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

      {/* Senior-Friendly Pagination Footer */}
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
  );
}
