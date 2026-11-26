"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Briefcase01Icon,
  Building03Icon,
  CustomerService01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PlatformOperationItem } from "../services/admin-analytics";

interface DataTableProps {
  data?: PlatformOperationItem[];
  defaultPageSize?: number;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;
const ROW_HEIGHT_PX = 52;
const HEADER_HEIGHT_PX = 36;

function getCategoryIcon(category: PlatformOperationItem["category"]) {
  switch (category) {
    case "verification":
      return Building03Icon;
    case "vacancy":
      return Briefcase01Icon;
    case "report":
      return Alert02Icon;
    case "support":
      return CustomerService01Icon;
    case "user":
    default:
      return UserGroupIcon;
  }
}

function getStatusClass(status: PlatformOperationItem["status"]): string {
  switch (status) {
    case "pending":
    case "urgent":
      return "text-warning-foreground";
    case "active":
      return "text-success-foreground";
    case "resolved":
    default:
      return "text-muted-foreground";
  }
}

export function DataTable({
  data = [],
  defaultPageSize = 5,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [pageSize, setPageSize] = React.useState<number>(defaultPageSize);
  const [page, setPage] = React.useState<number>(1);

  const filteredData = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.details && item.details.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [data, searchQuery, categoryFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const categoryCounts = React.useMemo(
    () => ({
      all: data.length,
      verification: data.filter((d) => d.category === "verification").length,
      vacancy: data.filter((d) => d.category === "vacancy").length,
      user: data.filter((d) => d.category === "user").length,
    }),
    [data]
  );

  const tabs = [
    { id: "all", label: "Todas", count: categoryCounts.all },
    {
      id: "verification",
      label: "Verificaciones",
      count: categoryCounts.verification,
    },
    { id: "vacancy", label: "Vacantes", count: categoryCounts.vacancy },
    { id: "user", label: "Registros", count: categoryCounts.user },
  ];

  // Reserves exact height for pageSize rows so switching pages or filters never shifts the page layout
  const tableMinHeight = HEADER_HEIGHT_PX + pageSize * ROW_HEIGHT_PX;

  return (
    <section className="bg-card border border-border rounded-[14px] overflow-hidden">
      {/* Toolbar compacta */}
      <div className="px-4 py-3 border-b border-border flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[15px] font-semibold leading-[20px] text-foreground">
              Actividad reciente
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Verificaciones de empresas, vacantes publicadas y nuevos registros
            </p>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar entidad o evento..."
              className="h-8 pl-8 pr-7 rounded-[8px] bg-background border-control-border text-[12.5px]"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filtros por categoría */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const isSelected = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCategoryFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "h-7 px-2.5 rounded-[8px] text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer select-none",
                  isSelected
                    ? "bg-sidebar-accent text-link"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <span>{tab.label}</span>
                <span className="text-[11px] tabular-nums opacity-75">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabla compacta con columnas y altura estables */}
      <div
        className="overflow-x-auto"
        style={{ minHeight: `${tableMinHeight}px` }}
      >
        <Table className="w-full table-fixed min-w-[640px]">
          <TableHeader className="bg-muted/30 border-b border-border">
            <TableRow className="hover:bg-transparent h-9">
              <TableHead className="h-9 px-4 w-[34%] text-[11.5px] font-semibold text-muted-foreground">
                Entidad
              </TableHead>
              <TableHead className="h-9 px-3 w-[28%] text-[11.5px] font-semibold text-muted-foreground hidden md:table-cell">
                Detalle
              </TableHead>
              <TableHead className="h-9 px-3 w-[120px] text-[11.5px] font-semibold text-muted-foreground">
                Fecha
              </TableHead>
              <TableHead className="h-9 px-3 w-[112px] text-[11.5px] font-semibold text-muted-foreground">
                Estatus
              </TableHead>
              <TableHead className="h-9 px-4 w-[136px] text-right text-[11.5px] font-semibold text-muted-foreground">
                Acción
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {paginatedData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  style={{ height: `${pageSize * ROW_HEIGHT_PX}px` }}
                  className="text-center text-muted-foreground align-middle"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Filter className="size-4 text-muted-foreground/50" />
                    <p className="text-[13px] font-medium text-foreground">
                      Sin actividad reciente
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      No hay registros para los filtros seleccionados.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => {
                const Icon = getCategoryIcon(item.category);
                return (
                  <TableRow
                    key={item.id}
                    className="h-[52px] hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-2 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="size-[30px] rounded-[8px] bg-sidebar-accent text-link flex items-center justify-center shrink-0">
                          <HugeiconsIcon
                            icon={Icon}
                            size={15}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-foreground truncate">
                            {item.title}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground truncate">
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2 px-3 hidden md:table-cell">
                      <span className="text-[12px] text-muted-foreground block truncate">
                        {item.details || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      <span className="text-[12px] text-muted-foreground tabular-nums block truncate">
                        {item.timestamp}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "text-[12px] font-semibold block truncate",
                          getStatusClass(item.status)
                        )}
                      >
                        {item.statusLabel}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-4 text-right whitespace-nowrap">
                      <Link
                        href={item.actionUrl}
                        className="text-[12.5px] font-medium text-link hover:underline"
                      >
                        {item.actionLabel} →
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pie de paginación siempre visible para evitar saltos */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12px] text-muted-foreground tabular-nums">
          {totalItems === 0
            ? "0 resultados"
            : `Mostrando ${startItem}–${endItem} de ${totalItems}`}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground hidden sm:inline">
              Filas:
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                const next = Number(val);
                if (next > 0) {
                  setPageSize(next);
                  setPage(1);
                }
              }}
            >
              <SelectTrigger
                aria-label="Filas por página"
                className="h-7 w-[64px] rounded-[8px] border-control-border bg-background text-[12px] tabular-nums"
              >
                <SelectValue>{pageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-[10px] border-border bg-popover">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem
                    key={size}
                    value={String(size)}
                    className="text-[12px] tabular-nums"
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground tabular-nums min-w-[72px] text-center">
              Pág. {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Página anterior"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="size-7 rounded-[8px] border-control-border cursor-pointer"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Página siguiente"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="size-7 rounded-[8px] border-control-border cursor-pointer"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
