"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reportedContent } from "../data/mock"

const statusConfig = {
  pending: {
    label: "Pendiente",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "bg-[#ec7e00]/10 text-[#ec7e00] border-[#ec7e00]/20",
  },
  resolved: {
    label: "Resuelto",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    className: "bg-[#428619]/10 text-[#428619] border-[#428619]/20",
  },
  dismissed: {
    label: "Descartado",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "bg-muted text-muted-foreground border-border",
  },
}

export function ReportedContent() {
  return (
    <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <h3 className="text-[20px] font-semibold text-foreground tracking-tight">Contenido Reportado</h3>
        <span className="text-[13px] text-[#ec7e00] font-medium bg-[#ec7e00]/10 px-3 py-1 rounded-full">
          {reportedContent.filter((r) => r.status === "pending").length} pendientes
        </span>
      </div>
      <div className="flex flex-col">
        {reportedContent.map((item, index) => {
          const config = statusConfig[item.status]
          return (
            <div
              key={item.id}
              className={`flex items-start gap-4 px-8 py-5 ${
                index < reportedContent.length - 1 ? "border-b border-border/40" : ""
              } hover:bg-muted/20 transition-colors`}
            >
              <div className="h-9 w-9 rounded-full bg-[#e23b4a]/10 text-[#e23b4a] flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[14px] font-semibold text-foreground">{item.title}</span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
                    Perfil
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Reportado por: {item.reportedBy} · {item.reason}
                </p>
                <p className="text-[12px] text-muted-foreground/60 mt-0.5">{item.date}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-[12px] font-medium px-3 py-1 rounded-full border flex items-center gap-1.5 ${config.className}`}
                >
                  {config.icon}
                  {config.label}
                </span>
                {item.status === "pending" && (
                  <Button className="h-[32px] rounded-full text-[12px] font-medium px-4 bg-primary text-primary-foreground hover:bg-primary/90 shadow-none">
                    Revisar
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
