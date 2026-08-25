"use client";

import * as React from "react";
import {
  Users,
  Search,
  MapPin,
  Briefcase,
  Calendar,
  MessageSquare,
  UserCheck,
  Building2,
  CheckCircle2,
  MoreHorizontal,
  Mail,
  Filter,
  UserX,
  FileText,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Clock,
  Download,
  List,
  LayoutGrid,
  Phone,
  Edit2,
  X,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  updateEmployeeStartDate,
  terminateEmployee,
  reactivateEmployee,
} from "@/modules/company/actions/employees";

interface Employee {
  id: string;
  candidate_id: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  location: string;
  vacancy_title: string;
  vacancy_category: string;
  hired_date: string;
  notes?: string;
  status: "Contratado" | "Baja";
}

interface CompanyEmployeesViewProps {
  userId: string;
  initialEmployees: Employee[];
}

export function CompanyEmployeesView({ userId, initialEmployees }: CompanyEmployeesViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Contratado" | "Baja">("all");
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);

  // Dialog States
  const [selectedEmp, setSelectedEmp] = React.useState<Employee | null>(null);

  // Date dialog
  const [isDateDialogOpen, setIsDateDialogOpen] = React.useState(false);
  const [startDateValue, setStartDateValue] = React.useState("");
  const [isSavingDate, setIsSavingDate] = React.useState(false);

  // Termination dialog
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = React.useState(false);
  const [terminationReason, setTerminationReason] = React.useState("Renuncia voluntaria");
  const [terminationNotes, setTerminationNotes] = React.useState("");
  const [isTerminating, setIsTerminating] = React.useState(false);

  // Notes dialog
  const [isNotesDialogOpen, setIsNotesDialogOpen] = React.useState(false);
  const [employeeNotes, setEmployeeNotes] = React.useState("");
  const [isSavingNotes, setIsSavingNotes] = React.useState(false);

  // Metrics
  const metrics = React.useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "Contratado").length;
    const terminated = employees.filter((e) => e.status === "Baja").length;
    const categoriesSet = new Set(employees.map((e) => e.vacancy_category || "General"));
    return {
      total,
      active,
      terminated,
      categoriesCount: categoriesSet.size,
    };
  }, [employees]);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.vacancy_category) set.add(e.vacancy_category);
    });
    return Array.from(set);
  }, [employees]);

  const filteredEmployees = React.useMemo(() => {
    return employees.filter((emp) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        emp.full_name.toLowerCase().includes(query) ||
        emp.vacancy_title.toLowerCase().includes(query) ||
        emp.location.toLowerCase().includes(query) ||
        emp.phone.includes(query);

      const matchesCategory =
        categoryFilter === "all" || emp.vacancy_category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" || emp.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [employees, searchQuery, categoryFilter, statusFilter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Reciente";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getWhatsAppLink = (emp: Employee) => {
    if (!emp.phone) return "";
    const cleanPhone = emp.phone.replace(/\D/g, "");
    const msg = `¡Hola ${emp.full_name}! Te contacto de Recursos Humanos respecto a tus actividades laborales en el puesto de ${emp.vacancy_title}.`;
    return `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      toast.error("No hay empleados para exportar");
      return;
    }

    const headers = ["Nombre", "Puesto", "Area", "Telefono", "Ubicacion", "Fecha de Ingreso", "Estatus", "Notas"];
    const rows = filteredEmployees.map((e) => [
      `"${e.full_name.replace(/"/g, '""')}"`,
      `"${e.vacancy_title.replace(/"/g, '""')}"`,
      `"${e.vacancy_category.replace(/"/g, '""')}"`,
      `"${e.phone || ""}"`,
      `"${e.location.replace(/"/g, '""')}"`,
      `"${formatDate(e.hired_date)}"`,
      `"${e.status}"`,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `empleados_kanpro_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Listado de empleados exportado exitosamente");
  };

  // Handlers
  const handleOpenDateDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setStartDateValue(emp.hired_date ? new Date(emp.hired_date).toISOString().slice(0, 10) : "");
    setIsDateDialogOpen(true);
  };

  const handleSaveStartDate = async () => {
    if (!selectedEmp) return;
    setIsSavingDate(true);
    try {
      await updateEmployeeStartDate(selectedEmp.id, startDateValue);
      setEmployees((prev) =>
        prev.map((e) => (e.id === selectedEmp.id ? { ...e, hired_date: startDateValue } : e))
      );
      toast.success("Fecha de inicio actualizada con éxito");
      setIsDateDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar fecha");
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleOpenTerminateDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setTerminationReason("Renuncia voluntaria");
    setTerminationNotes("");
    setIsTerminateDialogOpen(true);
  };

  const handleConfirmTermination = async () => {
    if (!selectedEmp) return;
    setIsTerminating(true);
    try {
      await terminateEmployee(selectedEmp.id, terminationReason, terminationNotes);
      setEmployees((prev) =>
        prev.map((e) => (e.id === selectedEmp.id ? { ...e, status: "Baja" } : e))
      );
      toast.warning("Colaborador dado de baja", {
        description: `Se ha registrado la baja de ${selectedEmp.full_name}.`,
      });
      setIsTerminateDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al registrar baja");
    } finally {
      setIsTerminating(false);
    }
  };

  const handleReactivate = async (emp: Employee) => {
    try {
      toast.loading("Reactivando colaborador...", { id: "reactivate-emp" });
      await reactivateEmployee(emp.id);
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, status: "Contratado" } : e))
      );
      toast.success("¡Colaborador reactivado!", {
        id: "reactivate-emp",
        description: `${emp.full_name} vuelve a estar en estatus de empleado activo.`,
      });
    } catch (err: any) {
      toast.error(err.message || "Error al reactivar colaborador", { id: "reactivate-emp" });
    }
  };

  const handleOpenNotesDialog = (emp: Employee) => {
    setSelectedEmp(emp);
    setEmployeeNotes(emp.notes || "");
    setIsNotesDialogOpen(true);
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      
      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Plantilla
            </span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">{metrics.total}</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">Histórico contratados</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Activos
            </span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">{metrics.active}</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">Colaboradores laborando</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Bajas
            </span>
            <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <UserX className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">{metrics.terminated}</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">Bajas registradas</p>
          </div>
        </Card>

        <Card className="bg-card border border-border/60 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Áreas Cubiertas
            </span>
            <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-extrabold text-foreground font-mono">{metrics.categoriesCount}</h3>
            <p className="text-[11px] font-semibold text-muted-foreground">Departamentos laborales</p>
          </div>
        </Card>
      </div>

      {/* 2. Unified Master Card (Filters Toolbar + Table / Grid Data) */}
      <Card className="bg-card border border-border/60 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Toolbar Header */}
        <div className="p-4 sm:p-5 space-y-4 border-b border-border/60">
          
          {/* Top Row: Search & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground size-4 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por colaborador, puesto, zona o teléfono..."
                className="h-10 pl-10 pr-9 bg-muted/40 border-border/60 rounded-xl text-xs sm:text-sm font-medium"
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

            {/* Right Action Group */}
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              {/* View Switcher: List / Grid */}
              <div className="inline-flex p-1 rounded-xl bg-muted border border-border/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="size-3.5" />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="size-3.5" />
                  <span className="hidden sm:inline">Fichas</span>
                </button>
              </div>

              {/* Export CSV */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-9 font-semibold text-xs rounded-xl px-3 flex items-center gap-1.5 border-border/60 cursor-pointer"
              >
                <Download className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>

              {/* Link to Applications */}
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/company/applications" />}
                className="h-9 font-semibold text-xs rounded-xl px-3 flex items-center gap-1.5 border-border/60 cursor-pointer"
              >
                <Users className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Ver Postulantes</span>
              </Button>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            
            {/* Status Filter Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-muted border border-border/50 shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  statusFilter === "all"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Todos ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Contratado")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  statusFilter === "Contratado"
                    ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Activos ({metrics.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Baja")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  statusFilter === "Baja"
                    ? "bg-card text-rose-600 dark:text-rose-400 shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Bajas ({metrics.terminated})
              </button>
            </div>

            {/* Category Select Filter */}
            <div className="min-w-[200px]">
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 bg-muted/40 text-xs font-semibold">
                  <SelectValue placeholder="Todas las áreas" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 bg-popover shadow-lg">
                  <SelectItem value="all" className="text-xs font-semibold rounded-lg cursor-pointer">
                    Todas las áreas ({employees.length})
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs font-semibold rounded-lg cursor-pointer">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Data Area: Table or Grid View */}
        <div>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Users className="size-10 stroke-[1.4] mx-auto mb-3 text-muted-foreground/60" />
              <p className="text-base font-bold text-foreground">No se encontraron colaboradores</p>
              <p className="text-xs font-medium mt-1 max-w-sm mx-auto leading-relaxed text-muted-foreground">
                No hay empleados contratados que coincidan con la búsqueda o el filtro de estatus seleccionado.
              </p>
              {(searchQuery || categoryFilter !== "all" || statusFilter !== "all") && (
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}
                  size="sm"
                  className="mt-4 font-bold text-xs px-5 h-9 rounded-xl cursor-pointer shadow-xs"
                >
                  Limpiar Filtros
                </Button>
              )}
            </div>
          ) : viewMode === "list" ? (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-muted/30 border-b border-border/60">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground py-3.5 px-4 sm:px-6">
                      Colaborador
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground py-3.5 px-4">
                      Puesto / Área
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground py-3.5 px-4">
                      Ubicación
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground py-3.5 px-4">
                      Fecha de Ingreso
                    </TableHead>
                    <TableHead className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground py-3.5 px-4">
                      Estatus
                    </TableHead>
                    <TableHead className="text-right font-extrabold text-xs uppercase tracking-wider text-muted-foreground py-3.5 px-4 sm:px-6">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {filteredEmployees.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors group",
                        emp.status === "Baja" && "opacity-70 bg-muted/10"
                      )}
                    >
                      {/* Name & Avatar */}
                      <TableCell className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 rounded-xl border border-border/60 shrink-0">
                            <AvatarImage src={emp.avatar_url || undefined} alt={emp.full_name} className="object-cover" />
                            <AvatarFallback className="rounded-xl font-extrabold text-xs bg-primary/10 text-primary">
                              {getInitials(emp.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                              {emp.full_name}
                            </h4>
                            {emp.phone && (
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                {emp.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Vacancy & Category */}
                      <TableCell className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground line-clamp-1">
                            {emp.vacancy_title}
                          </p>
                          <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold rounded-md">
                            {emp.vacancy_category || "General"}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Location */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <MapPin className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{emp.location}</span>
                        </div>
                      </TableCell>

                      {/* Hired Date */}
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                          <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                          <span>{formatDate(emp.hired_date)}</span>
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="py-3.5 px-4">
                        <Badge
                          className={cn(
                            "font-bold text-[10px] px-2.5 py-0.5 rounded-full border-none select-none",
                            emp.status === "Contratado"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {emp.status === "Contratado" ? "Activo" : "Baja"}
                        </Badge>
                      </TableCell>

                      {/* Actions Menu */}
                      <TableCell className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {emp.phone && emp.status === "Contratado" && (
                            <a
                              href={getWhatsAppLink(emp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="size-8 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 flex items-center justify-center transition-colors cursor-pointer"
                              title="Enviar WhatsApp"
                            >
                              <MessageSquare className="size-3.5 stroke-[2.5]" />
                            </a>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <button className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors flex items-center justify-center" />
                              }
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border border-border/60 bg-popover min-w-[190px] shadow-lg p-1.5">
                              <DropdownMenuItem
                                render={<Link href={`/dashboard/company/employees/${emp.id}`} className="cursor-pointer text-xs font-extrabold py-2 px-2.5 gap-2 text-primary" />}
                              >
                                <Sparkles className="size-3.5 text-primary" />
                                <span>Ver Expediente 360</span>
                              </DropdownMenuItem>

                              {emp.phone && (
                                <DropdownMenuItem
                                  render={
                                    <a
                                      href={getWhatsAppLink(emp)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="cursor-pointer text-xs font-semibold py-2 px-2.5 gap-2 text-emerald-600 dark:text-emerald-400"
                                    />
                                  }
                                >
                                  <MessageSquare className="size-3.5" />
                                  <span>Mensaje WhatsApp</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onSelect={() => handleOpenDateDialog(emp)}
                                className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                              >
                                <Calendar className="size-3.5 text-muted-foreground" />
                                <span>Cambiar fecha inicio</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleOpenNotesDialog(emp)}
                                className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                              >
                                <FileText className="size-3.5 text-muted-foreground" />
                                <span>Notas del empleado</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1 border-border/50" />

                              {emp.status === "Contratado" ? (
                                <DropdownMenuItem
                                  onSelect={() => handleOpenTerminateDialog(emp)}
                                  className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 focus:bg-rose-500/10 py-2 px-2.5 gap-2"
                                >
                                  <UserX className="size-3.5" />
                                  <span>Registrar Baja</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onSelect={() => handleReactivate(emp)}
                                  className="cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/10 focus:bg-emerald-500/10 py-2 px-2.5 gap-2"
                                >
                                  <RotateCcw className="size-3.5" />
                                  <span>Reactivar Colaborador</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* Grid View */
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map((emp) => (
                <Card
                  key={emp.id}
                  className={cn(
                    "bg-card border border-border/60 rounded-2xl p-4 flex flex-col justify-between min-h-[210px] shadow-xs relative hover:border-primary/40 transition-all duration-200",
                    emp.status === "Baja" && "opacity-70 bg-muted/20"
                  )}
                >
                  <div className="space-y-3">
                    {/* Top Row: Avatar + Status + Menu */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-11 rounded-xl border border-border/60 shadow-2xs shrink-0">
                          <AvatarImage src={emp.avatar_url || undefined} alt={emp.full_name} className="object-cover" />
                          <AvatarFallback className="rounded-xl font-extrabold text-xs bg-primary/10 text-primary">
                            {getInitials(emp.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {emp.full_name}
                          </h4>
                          <Badge
                            className={cn(
                              "font-bold text-[9px] px-2 py-0.2 rounded-full border-none select-none mt-0.5",
                              emp.status === "Contratado"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            )}
                          >
                            {emp.status === "Contratado" ? "Activo" : "Baja"}
                          </Badge>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted p-1 cursor-pointer transition-colors" />
                          }
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border border-border/60 bg-popover min-w-[190px] shadow-lg p-1.5">
                          <DropdownMenuItem
                            render={<Link href={`/dashboard/company/employees/${emp.id}`} className="cursor-pointer text-xs font-extrabold py-2 px-2.5 gap-2 text-primary" />}
                          >
                            <Sparkles className="size-3.5 text-primary" />
                            <span>Ver Expediente 360</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleOpenDateDialog(emp)}
                            className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                          >
                            <Calendar className="size-3.5 text-muted-foreground" />
                            <span>Cambiar fecha inicio</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleOpenNotesDialog(emp)}
                            className="cursor-pointer text-xs font-semibold rounded-lg hover:bg-muted py-2 px-2.5 gap-2"
                          >
                            <FileText className="size-3.5 text-muted-foreground" />
                            <span>Notas del empleado</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 border-border/50" />
                          {emp.status === "Contratado" ? (
                            <DropdownMenuItem
                              onSelect={() => handleOpenTerminateDialog(emp)}
                              className="cursor-pointer text-xs font-semibold text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-500/10 focus:bg-rose-500/10 py-2 px-2.5 gap-2"
                            >
                              <UserX className="size-3.5" />
                              <span>Registrar Baja</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={() => handleReactivate(emp)}
                              className="cursor-pointer text-xs font-semibold text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-500/10 focus:bg-emerald-500/10 py-2 px-2.5 gap-2"
                            >
                              <RotateCcw className="size-3.5" />
                              <span>Reactivar Colaborador</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Vacancy Info */}
                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-bold text-foreground line-clamp-1">
                        {emp.vacancy_title}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <MapPin className="size-3 text-primary shrink-0" />
                        <span className="truncate">{emp.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-3 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground font-medium">
                      <Calendar className="size-3" />
                      <span>{formatDate(emp.hired_date)}</span>
                    </div>

                    {emp.phone && emp.status === "Contratado" && (
                      <a
                        href={getWhatsAppLink(emp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366]/10 text-[#062c1e] dark:text-[#25D366] font-bold text-[11px] hover:bg-[#25D366]/20 transition-colors"
                      >
                        <MessageSquare className="size-3 stroke-[2.5]" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Dialog: Change Start Date */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="rounded-2xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span>Fecha de Inicio de Labores</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Actualiza la fecha en que {selectedEmp?.full_name} comenzó o comenzará a trabajar.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <Label htmlFor="start_date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Fecha de Inicio
            </Label>
            <Input
              id="start_date"
              type="date"
              value={startDateValue}
              onChange={(e) => setStartDateValue(e.target.value)}
              className="h-11 rounded-xl bg-muted/40 border-border/60 font-semibold"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDateDialogOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveStartDate}
              disabled={isSavingDate}
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
            >
              {isSavingDate ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              <span>Guardar Fecha</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Terminate Employee (Baja) */}
      <Dialog open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
        <DialogContent className="rounded-2xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              <span>Registrar Baja de Colaborador</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registra el motivo de la baja de <strong>{selectedEmp?.full_name}</strong> en el historial laboral de la empresa.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Motivo de Baja
              </Label>
              <Select value={terminationReason} onValueChange={(val) => setTerminationReason(val || "Renuncia voluntaria")}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/60 text-xs font-semibold">
                  <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/60 bg-popover shadow-lg">
                  <SelectItem value="Renuncia voluntaria" className="text-xs font-semibold rounded-lg">Renuncia voluntaria</SelectItem>
                  <SelectItem value="Fin de contrato / Proyecto" className="text-xs font-semibold rounded-lg">Fin de contrato / Proyecto</SelectItem>
                  <SelectItem value="Despido justificado" className="text-xs font-semibold rounded-lg">Despido justificado</SelectItem>
                  <SelectItem value="Abandono de empleo" className="text-xs font-semibold rounded-lg">Abandono de empleo</SelectItem>
                  <SelectItem value="Mutuo acuerdo" className="text-xs font-semibold rounded-lg">Mutuo acuerdo</SelectItem>
                  <SelectItem value="Otro" className="text-xs font-semibold rounded-lg">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="term_notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Detalles Adicionales (Opcional)
              </Label>
              <Textarea
                id="term_notes"
                value={terminationNotes}
                onChange={(e) => setTerminationNotes(e.target.value)}
                placeholder="Observaciones de entrega de equipo, finiquito o motivos..."
                className="min-h-[90px] rounded-xl bg-muted/40 border-border/60 text-xs font-medium"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsTerminateDialogOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmTermination}
              disabled={isTerminating}
              className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isTerminating ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              <span>Confirmar Baja</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Employee Notes */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="rounded-2xl border-border/60 bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span>Notas de Colaborador</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Historial y notas internas para <strong>{selectedEmp?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <Textarea
              value={employeeNotes}
              onChange={(e) => setEmployeeNotes(e.target.value)}
              placeholder="Desempeño, capacitaciones completadas, entrega de uniformes..."
              className="min-h-[120px] rounded-xl bg-muted/40 border-border/60 text-xs font-medium"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsNotesDialogOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!selectedEmp) return;
                setIsSavingNotes(true);
                try {
                  await updateEmployeeStartDate(selectedEmp.id, selectedEmp.hired_date);
                  setEmployees((prev) =>
                    prev.map((e) => (e.id === selectedEmp.id ? { ...e, notes: employeeNotes } : e))
                  );
                  toast.success("Notas guardadas correctamente");
                  setIsNotesDialogOpen(false);
                } catch {
                  toast.error("Error al guardar notas");
                } finally {
                  setIsSavingNotes(false);
                }
              }}
              disabled={isSavingNotes}
              className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
            >
              {isSavingNotes ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              <span>Guardar Notas</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
