"use client"

import * as React from "react"
import {
  Users,
  Search,
  MapPin,
  Briefcase,
  Calendar,
  MessageCircle,
  UserCheck,
  Building2,
  CheckCircle2,
  MoreHorizontal,
  Mail,
  ChevronRight,
  Filter,
  ArrowUpDown,
  UserX,
  FileText,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Clock
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"
import {
  updateEmployeeStartDate,
  terminateEmployee,
  reactivateEmployee
} from "@/modules/company/actions/employees"

interface Employee {
  id: string
  candidate_id: string
  full_name: string
  phone: string
  avatar_url: string | null
  location: string
  vacancy_title: string
  vacancy_category: string
  hired_date: string
  notes?: string
  status: "Contratado" | "Baja"
}

interface CompanyEmployeesViewProps {
  userId: string
  initialEmployees: Employee[]
}

const CATEGORY_COLORS: Record<string, string> = {
  "Hostelería y Restaurantes": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Alimentos y Bebidas": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Ventas y Comercio": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "Atención al Cliente": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  "Operaciones y Logística": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  "Administración": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "General": "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
}

export function CompanyEmployeesView({ userId, initialEmployees }: CompanyEmployeesViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "Contratado" | "Baja">("all")
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees)

  // Dialog States
  const [selectedEmp, setSelectedEmp] = React.useState<Employee | null>(null)
  
  // Date modal
  const [isDateDialogOpen, setIsDateDialogOpen] = React.useState(false)
  const [startDateValue, setStartDateValue] = React.useState("")
  const [isSavingDate, setIsSavingDate] = React.useState(false)

  // Termination modal
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = React.useState(false)
  const [terminationReason, setTerminationReason] = React.useState("Renuncia voluntaria")
  const [terminationNotes, setTerminationNotes] = React.useState("")
  const [isTerminating, setIsTerminating] = React.useState(false)

  // Notes modal
  const [isNotesDialogOpen, setIsNotesDialogOpen] = React.useState(false)
  const [employeeNotes, setEmployeeNotes] = React.useState("")
  const [isSavingNotes, setIsSavingNotes] = React.useState(false)

  const categories = React.useMemo(() => {
    const set = new Set<string>()
    employees.forEach(e => {
      if (e.vacancy_category) set.add(e.vacancy_category)
    })
    return Array.from(set)
  }, [employees])

  const filteredEmployees = React.useMemo(() => {
    return employees.filter((emp) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        emp.full_name.toLowerCase().includes(query) ||
        emp.vacancy_title.toLowerCase().includes(query) ||
        emp.location.toLowerCase().includes(query)

      const matchesCategory =
        categoryFilter === "all" || emp.vacancy_category === categoryFilter

      const matchesStatus =
        statusFilter === "all" || emp.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [employees, searchQuery, categoryFilter, statusFilter])

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Reciente"
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Handlers
  const handleOpenDateDialog = (emp: Employee) => {
    setSelectedEmp(emp)
    setStartDateValue(emp.hired_date ? new Date(emp.hired_date).toISOString().slice(0, 10) : "")
    setIsDateDialogOpen(true)
  }

  const handleSaveStartDate = async () => {
    if (!selectedEmp) return
    setIsSavingDate(true)
    try {
      await updateEmployeeStartDate(selectedEmp.id, startDateValue)
      setEmployees(prev => prev.map(e => e.id === selectedEmp.id ? { ...e, hired_date: startDateValue } : e))
      toast.success("Fecha de inicio actualizada con éxito")
      setIsDateDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar fecha")
    } finally {
      setIsSavingDate(false)
    }
  }

  const handleOpenTerminateDialog = (emp: Employee) => {
    setSelectedEmp(emp)
    setTerminationReason("Renuncia voluntaria")
    setTerminationNotes("")
    setIsTerminateDialogOpen(true)
  }

  const handleConfirmTermination = async () => {
    if (!selectedEmp) return
    setIsTerminating(true)
    try {
      await terminateEmployee(selectedEmp.id, terminationReason, terminationNotes)
      setEmployees(prev => prev.map(e => e.id === selectedEmp.id ? { ...e, status: "Baja" } : e))
      toast.warning("Colaborador dado de baja", {
        description: `Se ha registrado la baja de ${selectedEmp.full_name}.`
      })
      setIsTerminateDialogOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Error al registrar baja")
    } finally {
      setIsTerminating(false)
    }
  }

  const handleReactivate = async (emp: Employee) => {
    try {
      toast.loading("Reactivando colaborador...", { id: "reactivate-emp" })
      await reactivateEmployee(emp.id)
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: "Contratado" } : e))
      toast.success("¡Colaborador reactivado!", {
        id: "reactivate-emp",
        description: `${emp.full_name} vuelve a estar en estatus de empleado activo.`
      })
    } catch (err: any) {
      toast.error(err.message || "Error al reactivar colaborador", { id: "reactivate-emp" })
    }
  }

  const handleOpenNotesDialog = (emp: Employee) => {
    setSelectedEmp(emp)
    setEmployeeNotes(emp.notes || "")
    setIsNotesDialogOpen(true)
  }

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      
      {/* Top Filter & Control Shell */}
      <div className="flex flex-col gap-4 bg-white dark:bg-[#18181b] p-4 sm:p-5 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 shadow-xs">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#5c7c9b]" />
            <Input
              placeholder="Buscar por empleado, puesto o zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 rounded-[16px] bg-[#f5f7fa]/80 dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 pl-11 pr-4 text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8]"
            />
          </div>

          {/* Status switcher pills: Activos vs Bajas */}
          <div className="inline-flex p-1 rounded-[16px] bg-[#f5f7fa] dark:bg-zinc-900 border border-[#ebeef3] dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                statusFilter === "all"
                  ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                  : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100"
              )}
            >
              Todos ({employees.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Contratado")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                statusFilter === "Contratado"
                  ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                  : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100"
              )}
            >
              Activos ({employees.filter(e => e.status === "Contratado").length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("Baja")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                statusFilter === "Baja"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-[#5c7c9b] hover:text-rose-600"
              )}
            >
              Bajas ({employees.filter(e => e.status === "Baja").length})
            </button>
          </div>

          {/* Primary Action Button */}
          <Button asChild className="h-11 rounded-[16px] bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#253240] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs sm:text-sm px-5 shrink-0 shadow-xs cursor-pointer">
            <Link href="/dashboard/company/applications">
              <Users className="size-4 mr-2" />
              <span>Bandeja de Postulantes</span>
            </Link>
          </Button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 pt-1 border-t border-[#ebeef3] dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none",
              categoryFilter === "all"
                ? "bg-[#1f2732]/10 dark:bg-zinc-100/10 text-[#1f2732] dark:text-zinc-100 font-extrabold"
                : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100"
            )}
          >
            Todas las áreas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none",
                categoryFilter === cat
                  ? "bg-[#1f2732]/10 dark:bg-zinc-100/10 text-[#1f2732] dark:text-zinc-100 font-extrabold"
                  : "text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Employee Table Shell */}
      <div className="border border-[#ebeef3] dark:border-zinc-800 rounded-[28px] bg-white dark:bg-[#18181b] overflow-hidden shadow-xs">
        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-[#f5f7fa]/80 dark:bg-zinc-900/60 border-b border-[#ebeef3] dark:border-zinc-800">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-4 px-4 sm:px-6 font-[800] text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200">
                    Empleado
                  </TableHead>
                  <TableHead className="py-4 px-3 sm:px-4 font-[800] text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200">
                    Puesto / Departamento
                  </TableHead>
                  <TableHead className="py-4 px-3 sm:px-4 font-[800] text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200">
                    Ubicación / Zona
                  </TableHead>
                  <TableHead className="py-4 px-3 sm:px-4 font-[800] text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 whitespace-nowrap">
                    Estatus
                  </TableHead>
                  <TableHead className="py-4 px-3 sm:px-4 font-[800] text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200 whitespace-nowrap">
                    Fecha de Ingreso
                  </TableHead>
                  <TableHead className="py-4 px-4 sm:px-6 text-right font-[800] text-xs uppercase tracking-wider text-[#1f2732] dark:text-zinc-200">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp) => {
                  const cleanPhone = emp.phone.replace(/\D/g, "")
                  const whatsappUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith("52") ? cleanPhone : `52${cleanPhone}`}`
                    : null

                  const catStyle =
                    CATEGORY_COLORS[emp.vacancy_category] || CATEGORY_COLORS["General"]

                  const isHired = emp.status === "Contratado"

                  return (
                    <TableRow
                      key={emp.id}
                      className={cn(
                        "border-b border-[#ebeef3]/60 dark:border-zinc-800/50 transition-colors hover:bg-[#f5f7fa]/60 dark:hover:bg-zinc-900/40",
                        !isHired && "opacity-70 bg-muted/20"
                      )}
                    >
                      {/* 1. Employee Name & Avatar */}
                      <TableCell className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10 rounded-xl border border-fiord-100 dark:border-fiord-800 shrink-0">
                            {emp.avatar_url && <AvatarImage src={emp.avatar_url} alt={emp.full_name} />}
                            <AvatarFallback className="bg-[#1f2732] text-white font-bold text-xs">
                              {getInitials(emp.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-[800] text-sm text-[#1f2732] dark:text-zinc-100 leading-snug">
                              {emp.full_name}
                            </span>
                            <span className="text-[11px] font-semibold text-[#5c7c9b] dark:text-zinc-400">
                              ID: {emp.candidate_id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Position & Category Badge */}
                      <TableCell className="px-3 sm:px-4 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="font-bold text-xs sm:text-sm text-[#1f2732] dark:text-zinc-200">
                            {emp.vacancy_title}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5", catStyle)}>
                            <span className="size-1.5 rounded-full bg-current" />
                            <span>{emp.vacancy_category || "General"}</span>
                          </Badge>
                        </div>
                      </TableCell>

                      {/* 3. Location */}
                      <TableCell className="px-3 sm:px-4 py-4">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-200 max-w-[220px]" title={emp.location}>
                          <MapPin className="size-3.5 text-[#5c7c9b] shrink-0" />
                          <span className="truncate">{emp.location}</span>
                        </div>
                      </TableCell>

                      {/* 4. Status */}
                      <TableCell className="px-3 sm:px-4 py-4 whitespace-nowrap">
                        {isHired ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Activo</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                            <UserX className="size-3.5 text-rose-600" />
                            <span>Baja</span>
                          </Badge>
                        )}
                      </TableCell>

                      {/* 5. Hired Date */}
                      <TableCell className="px-3 sm:px-4 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-[#5c7c9b] dark:text-zinc-400">
                        {formatDate(emp.hired_date)}
                      </TableCell>

                      {/* 6. Contact & Dropdown Actions */}
                      <TableCell className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {whatsappUrl && (
                            <Button
                              asChild
                              size="sm"
                              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="size-4" />
                                <span>WhatsApp</span>
                              </a>
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 p-0 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-2xl border border-border bg-popover min-w-[190px] p-1.5 shadow-lg">
                              <DropdownMenuItem
                                onClick={() => handleOpenDateDialog(emp)}
                                className="text-xs font-bold py-2.5 px-3 rounded-xl cursor-pointer gap-2.5"
                              >
                                <Calendar className="size-4 text-[#5c7c9b]" />
                                <span>Fecha de Ingreso</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleOpenNotesDialog(emp)}
                                className="text-xs font-bold py-2.5 px-3 rounded-xl cursor-pointer gap-2.5"
                              >
                                <FileText className="size-4 text-[#5c7c9b]" />
                                <span>Notas & Incidencias</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1" />

                              {isHired ? (
                                <DropdownMenuItem
                                  onClick={() => handleOpenTerminateDialog(emp)}
                                  className="text-xs font-bold text-rose-600 dark:text-rose-400 py-2.5 px-3 rounded-xl hover:bg-rose-500/10 focus:bg-rose-500/10 cursor-pointer gap-2.5"
                                >
                                  <UserX className="size-4 text-rose-500" />
                                  <span>Dar de baja / Archivar</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleReactivate(emp)}
                                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 py-2.5 px-3 rounded-xl hover:bg-emerald-500/10 focus:bg-emerald-500/10 cursor-pointer gap-2.5"
                                >
                                  <RotateCcw className="size-4 text-emerald-500" />
                                  <span>Reactivar como Activo</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center space-y-4">
            <div className="size-16 rounded-3xl bg-[#f5f7fa] dark:bg-zinc-900 text-[#5c7c9b] mx-auto flex items-center justify-center">
              <UserCheck className="size-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-[800] text-[#1f2732] dark:text-zinc-100">
                Sin colaboradores en esta vista
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#5c7c9b] dark:text-zinc-400">
                No hay empleados que coincidan con la búsqueda o filtro de estatus seleccionado.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 1. Modal Fecha de Ingreso */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="size-5 text-indigo-600" />
              Fecha de Inicio de Labores
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define o actualiza el día formal de ingreso de {selectedEmp?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold">Fecha de Ingreso / Alta</Label>
            <Input
              type="date"
              value={startDateValue}
              onChange={(e) => setStartDateValue(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsDateDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveStartDate}
              disabled={isSavingDate}
              className="rounded-xl bg-primary text-primary-foreground font-bold"
            >
              {isSavingDate ? <Loader2 className="size-3.5 animate-spin" /> : "Guardar Fecha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Modal Baja de Empleado */}
      <Dialog open={isTerminateDialogOpen} onOpenChange={setIsTerminateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Registrar Baja de Colaborador
            </DialogTitle>
            <DialogDescription className="text-xs">
              Esta acción marcará a {selectedEmp?.full_name} como baja en el historial laboral de la empresa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Motivo de Desvinculación *</Label>
              <Select value={terminationReason} onValueChange={setTerminationReason}>
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Selecciona un motivo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Renuncia voluntaria">Renuncia voluntaria</SelectItem>
                  <SelectItem value="Término de contrato">Término de contrato</SelectItem>
                  <SelectItem value="Fin de temporada turística">Fin de temporada turística</SelectItem>
                  <SelectItem value="Rescisión justificada">Rescisión justificada</SelectItem>
                  <SelectItem value="Mutuo acuerdo">Mutuo acuerdo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Observaciones / Comentarios Adicionales</Label>
              <Textarea
                placeholder="Detalles sobre entrega de uniforme, finiquito o motivo..."
                value={terminationNotes}
                onChange={(e) => setTerminationNotes(e.target.value)}
                className="rounded-xl text-xs min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsTerminateDialogOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmTermination}
              disabled={isTerminating}
              className="rounded-xl font-bold"
            >
              {isTerminating ? <Loader2 className="size-3.5 animate-spin" /> : "Confirmar Baja Laboral"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Modal Notas de Seguimiento */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Notas de Seguimiento & Desempeño
            </DialogTitle>
            <DialogDescription className="text-xs">
              Anotaciones internas del departamento de RRHH para {selectedEmp?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Escribe incidencias, felicitaciones, turnos asignados o notas..."
              value={employeeNotes}
              onChange={(e) => setEmployeeNotes(e.target.value)}
              className="rounded-xl text-xs min-h-[120px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsNotesDialogOpen(false)} className="rounded-xl">
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (selectedEmp) {
                  setEmployees(prev => prev.map(e => e.id === selectedEmp.id ? { ...e, notes: employeeNotes } : e))
                  toast.success("Notas guardadas localmente")
                  setIsNotesDialogOpen(false)
                }
              }}
              className="rounded-xl bg-primary text-primary-foreground font-bold"
            >
              Guardar Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
