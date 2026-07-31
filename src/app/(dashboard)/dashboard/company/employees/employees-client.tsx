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
  ArrowUpDown
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
  status: string
}

interface CompanyEmployeesViewProps {
  userId: string
  initialEmployees: Employee[]
}

const CATEGORY_COLORS: Record<string, string> = {
  "Hostelería y Restaurantes": "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  "Ventas y Comercio": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "Atención al Cliente": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  "Operaciones y Logística": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  "Administración": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "General": "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
}

export function CompanyEmployeesView({ userId, initialEmployees }: CompanyEmployeesViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [employees] = React.useState<Employee[]>(initialEmployees)

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

      return matchesSearch && matchesCategory
    })
  }, [employees, searchQuery, categoryFilter])

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

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      
      {/* Top Filter & Control Shell */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#18181b] p-4 sm:p-5 rounded-[24px] border border-[#ebeef3] dark:border-zinc-800 shadow-xs">
        
        {/* Search & Category Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#5c7c9b]" />
            <Input
              placeholder="Buscar por empleado, puesto o zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 rounded-[16px] bg-[#f5f7fa]/80 dark:bg-zinc-900 border-[#ebeef3] dark:border-zinc-800 pl-11 pr-4 text-xs sm:text-sm font-semibold text-[#1f2732] dark:text-zinc-100 placeholder-[#94a3b8]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none",
                categoryFilter === "all"
                  ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                  : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100"
              )}
            >
              Todos ({employees.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer select-none",
                  categoryFilter === cat
                    ? "bg-[#1f2732] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                    : "bg-[#f5f7fa] dark:bg-zinc-900 text-[#5c7c9b] hover:text-[#1f2732] dark:hover:text-zinc-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Button */}
        <Button asChild className="h-11 rounded-[16px] bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#253240] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs sm:text-sm px-5 shrink-0 shadow-xs cursor-pointer">
          <Link href="/dashboard/company/applications">
            <Users className="size-4 mr-2" />
            <span>Postulantes Pendientes</span>
          </Link>
        </Button>
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
                    Contacto
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

                  return (
                    <TableRow
                      key={emp.id}
                      className="border-b border-[#ebeef3]/60 dark:border-zinc-800/50 transition-colors hover:bg-[#f5f7fa]/60 dark:hover:bg-zinc-900/40"
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
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Contratado</span>
                        </Badge>
                      </TableCell>

                      {/* 5. Hired Date */}
                      <TableCell className="px-3 sm:px-4 py-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-[#5c7c9b] dark:text-zinc-400">
                        {formatDate(emp.hired_date)}
                      </TableCell>

                      {/* 6. Contact Actions */}
                      <TableCell className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        {whatsappUrl ? (
                          <Button
                            asChild
                            size="sm"
                            className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="size-4" />
                              <span>WhatsApp</span>
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-[#94a3b8]">Sin teléfono</span>
                        )}
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
                Sin empleados registrados en la lista
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#5c7c9b] dark:text-zinc-400">
                Cuando aceptes candidatos en la Bandeja de Postulantes, aparecerán organizados en este módulo de empleados activos.
              </p>
            </div>
            <Button asChild className="h-10 rounded-xl bg-[#1f2732] dark:bg-zinc-100 hover:bg-[#253240] dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs px-5">
              <Link href="/dashboard/company/applications">
                Ir a Bandeja de Postulantes
              </Link>
            </Button>
          </div>
        )}
      </div>

    </div>
  )
}
