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
            className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-fiord-600 dark:text-fiord-300 hover:text-fiord-900 dark:hover:text-fiord-100 transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Puesto / Categoría</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div className="flex flex-col gap-0.5 py-1">
              <span className="font-bold text-[14px] sm:text-[15px] text-fiord-900 dark:text-fiord-50">
                {vacancy.title}
              </span>
              <span className="text-[11px] text-[#5c7c9b] dark:text-fiord-400 font-bold uppercase tracking-wider">
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
            className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-fiord-600 dark:text-fiord-300 hover:text-fiord-900 dark:hover:text-fiord-100 transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Ubicación / Zona</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-fiord-700 dark:text-fiord-300 py-1">
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
            className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-fiord-600 dark:text-fiord-300 hover:text-fiord-900 dark:hover:text-fiord-100 transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Sueldo Ofrecido</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <span className="font-extrabold text-xs sm:text-sm text-fiord-900 dark:text-fiord-100 py-1 block">
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
            className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-fiord-600 dark:text-fiord-300 hover:text-fiord-900 dark:hover:text-fiord-100 transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estado</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
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
                "text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase px-3 py-1 flex items-center w-fit border cursor-pointer hover:opacity-85 select-none rounded-full transition-all",
                vacancy.is_active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-fiord-50 text-fiord-500 border-fiord-100 dark:bg-fiord-900/40 dark:text-fiord-400 dark:border-fiord-800"
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
            className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-fiord-600 dark:text-fiord-300 hover:text-fiord-900 dark:hover:text-fiord-100 transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5 text-fiord-900 dark:text-fiord-100" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const vacancy = row.original;
          return (
            <span className="text-xs sm:text-sm text-[#5c7c9b] dark:text-fiord-400 font-semibold py-1 block">
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
                    className="h-10 w-10 p-0 rounded-xl border border-fiord-100/80 dark:border-fiord-800/80 hover:bg-fiord-50 dark:hover:bg-fiord-900/60 cursor-pointer"
                  >
                    <MoreHorizontal className="h-5 w-5 text-fiord-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border border-fiord-100/80 dark:border-fiord-800 bg-popover min-w-[160px] shadow-md p-1.5">
                  <DropdownMenuItem asChild className="cursor-pointer text-xs sm:text-sm font-bold text-fiord-700 dark:text-fiord-300 rounded-lg hover:bg-muted py-2.5 gap-2.5">
                    <Link href={`/dashboard/company/vacancies/${vacancy.id}`}>
                      <Eye className="size-4 text-[#5c7c9b]" />
                      <span>Ver detalles</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer text-xs sm:text-sm font-bold text-fiord-700 dark:text-fiord-300 rounded-lg hover:bg-muted py-2.5 gap-2.5">
                    <Link href={`/dashboard/company/vacancies/${vacancy.id}/edit`}>
                      <Edit2 className="size-4 text-[#5c7c9b]" />
                      <span>Editar</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => onDeleteVacancy(vacancy.id)}
                    className="cursor-pointer text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 focus:bg-rose-500/10 py-2.5 gap-2.5"
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
    <div className="border border-fiord-100 dark:border-fiord-800/80 rounded-[28px] bg-white dark:bg-[#202023] overflow-hidden shadow-xs space-y-0">
      
      {/* Table Container */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-fiord-50/40 dark:bg-[#202023]/60 border-b border-fiord-100 dark:border-fiord-800/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-4.5 px-6">
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
                    "border-b border-fiord-100/50 dark:border-fiord-800/30 transition-colors hover:bg-fiord-50/20 dark:hover:bg-fiord-900/10 border-none",
                    !row.original.is_active && "opacity-75"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-xs font-semibold text-fiord-400">
                  No hay datos disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* TanStack Table Senior-Friendly Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-fiord-100/60 dark:border-fiord-800/40 bg-fiord-50/30 dark:bg-fiord-900/10">
        
        {/* Total info & Rows per page selector */}
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-semibold text-fiord-600 dark:text-fiord-400">
            Mostrando <span className="font-extrabold text-fiord-900 dark:text-fiord-100">{table.getRowModel().rows.length}</span> de <span className="font-extrabold text-fiord-900 dark:text-fiord-100">{data.length}</span> vacantes
          </span>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-fiord-400">Por página:</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-9 w-[70px] rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 border-fiord-100 dark:border-fiord-800 cursor-pointer">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-fiord-100 dark:border-fiord-800">
                {[10, 20, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs font-bold cursor-pointer">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pagination Navigation Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-fiord-700 dark:text-fiord-300 mr-2">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-10 w-10 rounded-xl border-fiord-100 dark:border-fiord-800 bg-white dark:bg-zinc-900 hover:bg-fiord-50 dark:hover:bg-fiord-800 text-fiord-700 dark:text-fiord-200 cursor-pointer disabled:opacity-40"
          >
            <ChevronsLeft className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-10 w-10 rounded-xl border-fiord-100 dark:border-fiord-800 bg-white dark:bg-zinc-900 hover:bg-fiord-50 dark:hover:bg-fiord-800 text-fiord-700 dark:text-fiord-200 cursor-pointer disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-10 w-10 rounded-xl border-fiord-100 dark:border-fiord-800 bg-white dark:bg-zinc-900 hover:bg-fiord-50 dark:hover:bg-fiord-800 text-fiord-700 dark:text-fiord-200 cursor-pointer disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-10 w-10 rounded-xl border-fiord-100 dark:border-fiord-800 bg-white dark:bg-zinc-900 hover:bg-fiord-50 dark:hover:bg-fiord-800 text-fiord-700 dark:text-fiord-200 cursor-pointer disabled:opacity-40"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>

      </div>

    </div>
  );
}
