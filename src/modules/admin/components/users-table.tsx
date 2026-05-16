"use client"

import * as React from "react"
import { Search, MoreHorizontal, Shield, Ban, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { recentUsers } from "../data/mock"

type User = (typeof import("../data/mock").recentUsers)[number]

const roleLabels: Record<string, string> = {
  pro: "Profesional",
  company: "Empresa",
  candidate: "Candidato",
}

const statusStyles: Record<string, string> = {
  active: "bg-[#428619]/10 text-[#428619] border-[#428619]/20",
  inactive: "bg-muted text-muted-foreground border-border",
  suspended: "bg-[#e23b4a]/10 text-[#e23b4a] border-[#e23b4a]/20",
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    pro: "bg-[#494fdf]/10 text-[#494fdf] border-[#494fdf]/20",
    company: "bg-[#007bc2]/10 text-[#007bc2] border-[#007bc2]/20",
    candidate: "bg-[#00a87e]/10 text-[#00a87e] border-[#00a87e]/20",
  }

  return (
    <span className={`text-[12px] font-medium px-3 py-1 rounded-full border ${colors[role] || colors.pro}`}>
      {roleLabels[role] || role}
    </span>
  )
}

export function UsersTable() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [users, setUsers] = React.useState<User[]>([])

  React.useEffect(() => {
    import("../data/mock").then((mod) => setUsers(mod.recentUsers as User[]))
  }, [])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-full h-11 px-5 max-w-[320px] w-full border border-border/50">
          <Search className="w-4 h-4 flex-shrink-0" />
          <input
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground w-full h-full focus:outline-none"
          />
        </div>
        <span className="text-[13px] text-muted-foreground">
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 px-6 py-5">
                  Usuario
                </th>
                <th className="text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 px-6 py-5">
                  Rol
                </th>
                <th className="text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 px-6 py-5">
                  Estado
                </th>
                <th className="text-left text-[12px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 px-6 py-5">
                  Registro
                </th>
                <th className="w-[60px] px-6 py-5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-[13px] font-bold flex-shrink-0">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">{user.name}</p>
                        <p className="text-[13px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[12px] font-medium px-3 py-1 rounded-full border ${
                        statusStyles[user.status]
                      }`}
                    >
                      {user.status === "active"
                        ? "Activo"
                        : user.status === "inactive"
                          ? "Inactivo"
                          : "Suspendido"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[14px] text-muted-foreground">{user.joinedAt}</span>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[200px] rounded-[16px] p-2">
                        <DropdownMenuItem className="rounded-[10px] h-[38px] text-[14px] cursor-pointer">
                          <Shield className="h-4 w-4 mr-3" />
                          Verificar cuenta
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-[10px] h-[38px] text-[14px] cursor-pointer">
                          <AlertTriangle className="h-4 w-4 mr-3" />
                          Enviar advertencia
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem className="rounded-[10px] h-[38px] text-[14px] text-destructive cursor-pointer">
                          <Ban className="h-4 w-4 mr-3" />
                          Suspender cuenta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-[16px] text-muted-foreground">No se encontraron usuarios</p>
            <p className="text-[14px] text-muted-foreground/60 mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
}
