import * as React from "react"
import { Clock, UserPlus, Briefcase, CheckCircle, Building2, DollarSign, Ban } from "lucide-react"
import { recentActivity } from "../data/mock"

const actionIcons: Record<string, React.ReactNode> = {
  "Nuevo registro": <UserPlus className="h-4 w-4" />,
  "Servicio creado": <Briefcase className="h-4 w-4" />,
  "Reporte resuelto": <CheckCircle className="h-4 w-4" />,
  "Nueva empresa": <Building2 className="h-4 w-4" />,
  "Pago procesado": <DollarSign className="h-4 w-4" />,
  "Usuario suspendido": <Ban className="h-4 w-4" />,
}

export function RecentActivity() {
  return (
    <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm">
      <div className="px-8 pt-8 pb-4">
        <h3 className="text-[20px] font-semibold text-foreground tracking-tight">Actividad Reciente</h3>
      </div>
      <div className="flex flex-col">
        {recentActivity.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-start gap-4 px-8 py-5 ${
              index < recentActivity.length - 1 ? "border-b border-border/40" : ""
            } hover:bg-muted/20 transition-colors`}
          >
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              {actionIcons[item.action] || <Clock className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-semibold text-foreground">{item.action}</span>
                <span className="text-[13px] text-muted-foreground">·</span>
                <span className="text-[13px] text-muted-foreground">{item.user}</span>
              </div>
              <p className="text-[14px] text-muted-foreground mt-0.5">{item.detail}</p>
            </div>
            <span className="text-[12px] text-muted-foreground/70 flex-shrink-0 whitespace-nowrap">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
