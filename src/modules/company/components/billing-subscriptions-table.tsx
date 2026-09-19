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
  Receipt,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
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
import { cn } from "@/lib/utils";

export interface BillingRecord {
  id: string;
  plan_name: string;
  type: "Factura Fiscal" | "Suscripción" | "Consumo de Cupo";
  amount: number;
  currency: string;
  status: "PAGADO" | "ACTIVO" | "PENDIENTE" | string;
  payment_method: string | null;
  created_at: string;
}

interface BillingSubscriptionsTableProps {
  data: BillingRecord[];
}

export function BillingSubscriptionsTable({ data }: BillingSubscriptionsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const formatDate = (dateStr: string) => {
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

  const columns = React.useMemo<ColumnDef<BillingRecord>[]>(
    () => [
      {
        accessorKey: "plan_name",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Concepto / Plan</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {item.type === "Consumo de Cupo" ? (
                  <Sparkles className="size-4" />
                ) : item.type === "Suscripción" ? (
                  <CreditCard className="size-4" />
                ) : (
                  <Receipt className="size-4" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-foreground">
                  {item.plan_name}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {item.type}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Monto</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          if (item.type === "Consumo de Cupo") {
            return (
              <span className="text-xs font-semibold text-muted-foreground">
                Incluido en Plan
              </span>
            );
          }
          return (
            <span className="font-bold text-xs font-mono text-foreground">
              ${item.amount.toLocaleString("es-MX")} {item.currency}
            </span>
          );
        },
      },
      {
        accessorKey: "payment_method",
        header: "Método de Pago",
        cell: ({ row }) => {
          const method = row.original.payment_method || "Tarjeta / SPEI";
          return (
            <span className="text-xs text-muted-foreground font-medium">
              {method}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Estado</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const st = row.original.status.toUpperCase();
          const isSuccess = st === "PAGADO" || st === "ACTIVO" || st === "PAID";
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit border-none",
                isSuccess
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}
            >
              {isSuccess ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <Clock className="size-3" />
              )}
              <span>{st}</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Fecha</span>
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ArrowUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-semibold">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
    ],
    []
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
        pageSize: 5,
      },
    },
  });

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="py-3 px-4 text-xs font-bold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/20">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-xs text-muted-foreground">
                  No hay registros de facturación o suscripción disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mini Pagination Footer */}
      {data.length > 5 && (
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-muted-foreground">
          <span>
            Mostrando {table.getRowModel().rows.length} de {data.length} registros
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-bold text-foreground px-2">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
