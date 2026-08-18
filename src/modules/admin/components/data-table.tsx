"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Briefcase,
  Users,
  Building2,
  Headphones,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
}

export function DataTable({ data = [] }: DataTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.details && item.details.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [data, searchQuery, categoryFilter]);

  const getCategoryIcon = (category: PlatformOperationItem["category"]) => {
    switch (category) {
      case "verification":
        return <Building2 className="size-4 text-purple-600 dark:text-purple-400" />;
      case "vacancy":
        return <Briefcase className="size-4 text-emerald-600 dark:text-emerald-400" />;
      case "report":
        return <ShieldAlert className="size-4 text-rose-600 dark:text-rose-400" />;
      case "support":
        return <Headphones className="size-4 text-amber-600 dark:text-amber-400" />;
      case "user":
      default:
        return <Users className="size-4 text-primary" />;
    }
  };

  const getCategoryBadgeClass = (category: PlatformOperationItem["category"]) => {
    switch (category) {
      case "verification":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20";
      case "vacancy":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      case "report":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
      case "support":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      case "user":
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getStatusBadge = (status: PlatformOperationItem["status"], label: string) => {
    switch (status) {
      case "pending":
      case "urgent":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 font-bold text-[10px]">
            <Clock className="size-3 mr-1" />
            {label}
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-bold text-[10px]">
            <CheckCircle2 className="size-3 mr-1" />
            {label}
          </Badge>
        );
      case "resolved":
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border/60 font-semibold text-[10px]">
            {label}
          </Badge>
        );
    }
  };

  const categoryCounts = React.useMemo(() => {
    return {
      all: data.length,
      verification: data.filter((d) => d.category === "verification").length,
      vacancy: data.filter((d) => d.category === "vacancy").length,
      user: data.filter((d) => d.category === "user").length,
    };
  }, [data]);

  return (
    <Card className="bg-card border border-border/60 rounded-3xl shadow-xs overflow-hidden mx-4 lg:mx-6">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 space-y-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-foreground">
              Bandeja de Operaciones & Actividad Reciente
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Flujo unificado de validaciones de empresas, publicaciones de vacantes e interacciones de usuarios.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar actividad o empresa..."
              className="h-10 pl-10 pr-8 rounded-xl bg-muted/40 border-border/60 text-xs sm:text-sm font-medium"
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
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { id: "all", label: "Todas las Operaciones", count: categoryCounts.all },
            { id: "verification", label: "Verificaciones", count: categoryCounts.verification },
            { id: "vacancy", label: "Vacantes Publicadas", count: categoryCounts.vacancy },
            { id: "user", label: "Registros", count: categoryCounts.user },
          ].map((tab) => {
            const isSelected = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-background text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-muted/30 border-b border-border/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3.5 px-4 sm:px-6 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                Operación / Entidad
              </TableHead>
              <TableHead className="py-3.5 px-4 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                Detalles
              </TableHead>
              <TableHead className="py-3.5 px-4 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                Fecha
              </TableHead>
              <TableHead className="py-3.5 px-4 font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                Estatus
              </TableHead>
              <TableHead className="py-3.5 px-4 sm:px-6 text-right font-extrabold text-xs uppercase tracking-wider text-muted-foreground">
                Acción
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="size-6 text-muted-foreground/40" />
                    <p className="text-sm font-bold text-foreground">No hay operaciones pendientes</p>
                    <p className="text-xs text-muted-foreground">
                      No se encontraron registros con los filtros seleccionados.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  {/* Entity & Icon */}
                  <TableCell className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className={cn("size-9 rounded-xl flex items-center justify-center border shrink-0", getCategoryBadgeClass(item.category))}>
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-muted-foreground truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Details */}
                  <TableCell className="py-3.5 px-4">
                    <p className="text-xs text-muted-foreground font-medium max-w-xs truncate">
                      {item.details || "—"}
                    </p>
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell className="py-3.5 px-4">
                    <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {item.timestamp}
                    </span>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3.5 px-4">
                    {getStatusBadge(item.status, item.statusLabel)}
                  </TableCell>

                  {/* Quick Action Button */}
                  <TableCell className="py-3.5 px-4 sm:px-6 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={item.actionUrl} />}
                      className="h-8 px-3 rounded-xl text-xs font-bold gap-1 border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer shadow-none"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowUpRight className="size-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
