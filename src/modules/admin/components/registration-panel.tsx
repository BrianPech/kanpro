"use client"

import * as React from "react"
import { UserPlus, Building2, Briefcase, User, Search, MapPin } from "lucide-react"

interface Registration {
  id: string
  name: string
  email: string
  role: "company" | "candidate"
  category?: string
  companyName?: string
  industry?: string
  location: string
  registeredAt: string
}

const roleConfig = {
  company: {
    label: "Empresa",
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-[#007bc2]/10 text-[#007bc2]",
  },
  candidate: {
    label: "Candidato",
    icon: <User className="h-4 w-4" />,
    color: "bg-[#00a87e]/10 text-[#00a87e]",
  },
}

const countryLabels: Record<string, string> = {
  MX: "México",
  CO: "Colombia",
  AR: "Argentina",
  ES: "España",
  US: "Estados Unidos",
}

export function RegistrationPanel() {
  const [registrations, setRegistrations] = React.useState<Registration[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    import("../data/mock").then((mod) => setRegistrations(mod.recentRegistrations as Registration[]))
  }, [])

  const filtered = registrations.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return "Hace unos minutos"
    if (hours < 24) return `Hace ${hours} horas`
    if (days === 1) return "Ayer"
    if (days < 7) return `Hace ${days} días`
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
  }

  return (
    <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#428619]/10 text-[#428619] flex items-center justify-center">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-[20px] font-semibold text-foreground tracking-tight">Registros Recientes</h3>
            <p className="text-[12px] text-muted-foreground">{registrations.length} nuevos usuarios</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-full h-9 px-4 max-w-[200px] w-full border border-border/50">
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <input
            placeholder="Filtrar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground w-full h-full focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-col">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserPlus className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-[16px] text-muted-foreground">Sin registros recientes</p>
          </div>
        ) : (
          filtered.map((reg, index) => {
            const config = roleConfig[reg.role]
            return (
              <div
                key={reg.id}
                className={`flex items-center gap-4 px-8 py-5 ${
                  index < filtered.length - 1 ? "border-b border-border/30" : ""
                } hover:bg-muted/20 transition-colors`}
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-[15px] font-bold flex-shrink-0">
                  {reg.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[15px] font-semibold text-foreground">{reg.name}</span>
                    <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </span>
                  </div>
                  <p className="text-[13px] text-muted-foreground">{reg.email}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted-foreground/70">
                    {reg.role === "company" && (
                      <>
                        <span className="font-medium text-foreground/60">{reg.companyName}</span>
                        {reg.industry && <span>{reg.industry}</span>}
                      </>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {countryLabels[reg.location] || reg.location}
                    </span>
                    <span>·</span>
                    <span>{formatDate(reg.registeredAt)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
