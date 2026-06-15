import * as React from "react"
import { Users, Building2, Briefcase, Eye, DollarSign, UserPlus, TrendingUp, Activity } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  accent: string
}

function StatCard({ title, value, icon, trend, trendUp, accent }: StatCardProps) {
  return (
    <div className="bg-card text-card-foreground border border-border/50 rounded-[24px] p-[28px] flex flex-col gap-6 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out"
          style={{ backgroundColor: `${accent}15`, color: accent }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={`text-[13px] font-medium px-3 py-1 rounded-full flex items-center gap-1 ${
              trendUp
                ? "text-[#428619] bg-[#428619]/10"
                : "text-[#e23b4a] bg-[#e23b4a]/10"
            }`}
          >
            <TrendingUp className={`w-3 h-3 ${!trendUp ? "rotate-180" : ""}`} />
            {trend}
          </span>
        )}
      </div>
      <div className="mt-auto">
        <p className="text-[14px] text-muted-foreground font-medium mb-1.5">{title}</p>
        <h3 className="text-[36px] font-medium tracking-tighter leading-[1.0]">{value}</h3>
      </div>
    </div>
  )
}

export function PlatformStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <StatCard
        title="Usuarios Totales"
        value="2,847"
        icon={<Users className="h-6 w-6" />}
        trend="+12.5%"
        trendUp={true}
        accent="#494fdf"
      />
      <StatCard
        title="Empresas"
        value="156"
        icon={<Building2 className="h-6 w-6" />}
        trend="+5.1%"
        trendUp={true}
        accent="#007bc2"
      />
      <StatCard
        title="Candidatos"
        value="1,268"
        icon={<UserPlus className="h-6 w-6" />}
        trend="+15.2%"
        trendUp={true}
        accent="#e61e49"
      />
      <StatCard
        title="Vistas Totales"
        value="48.2K"
        icon={<Eye className="h-6 w-6" />}
        trend="+22.4%"
        trendUp={true}
        accent="#428619"
      />
      <StatCard
        title="Ingresos"
        value="$45.2K"
        icon={<DollarSign className="h-6 w-6" />}
        trend="+18.6%"
        trendUp={true}
        accent="#ec7e00"
      />
      <StatCard
        title="Usuarios Hoy"
        value="12"
        icon={<TrendingUp className="h-6 w-6" />}
        accent="#494fdf"
      />
    </div>
  )
}
