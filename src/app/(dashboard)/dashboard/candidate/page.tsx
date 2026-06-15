import * as React from "react";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Building2, 
  ChevronRight,
  TrendingUp,
  Compass,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";

const mockApplications = [
  {
    id: "app-1",
    company: "Stark Industries",
    companyInitials: "SI",
    position: "Senior Fullstack Engineer",
    location: "Remote",
    status: "Reviewing",
    statusLabel: "En Revisión",
    statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    progress: 66,
    appliedDate: "Hace 5 días"
  },
  {
    id: "app-2",
    company: "Wayne Corp",
    companyInitials: "WC",
    position: "Security Architect",
    location: "Gotham City / Hybrid",
    status: "Pending",
    statusLabel: "Pendiente",
    statusColor: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    progress: 30,
    appliedDate: "Hace 1 semana"
  },
  {
    id: "app-3",
    company: "Globex",
    companyInitials: "GX",
    position: "Lead React Dev (Q1 2026)",
    location: "Remote",
    status: "Hired",
    statusLabel: "Contratado",
    statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    progress: 100,
    appliedDate: "Hace 2 semanas"
  }
];

export default async function CandidateDashboard() {
  const { userName } = await getDashboardSession();

  return (
    <div className="flex flex-col gap-12 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Banner */}
      <section className="bg-primary text-primary-foreground rounded-[24px] md:rounded-[32px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-[800px]">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-12 h-[1px] bg-primary-foreground/30"></span>
            <span className="text-[13px] uppercase tracking-widest font-medium text-primary-foreground/80">Panel de Candidato</span>
          </div>
          <h1 className="text-[48px] md:text-[64px] font-medium tracking-tighter leading-[1.0] mb-6">
            Bienvenido de nuevo,<br />{userName}.
          </h1>
          <p className="text-[18px] text-primary-foreground/90 tracking-[-0.09px] leading-[1.56] mb-10 max-w-[500px]">
            Tu perfil está siendo considerado por empresas de alto nivel. Revisa tus postulaciones activas o explora nuevas oportunidades.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/discovery">
              <Button className="h-[48px] rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-[16px] font-semibold tracking-[0.24px] px-[28px] shadow-none">
                Explorar Empleos
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-[10%] -top-[20%] w-[60%] h-[150%] pointer-events-none opacity-[0.05] rotate-12 mix-blend-overlay">
          <div className="w-full h-full bg-primary-foreground rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="flex flex-col gap-8">
        <h2 className="text-[32px] md:text-[40px] font-medium text-foreground tracking-[-0.4px] leading-[1.2]">
          Resumen de Actividad
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Postulaciones Totales */}
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-muted-foreground">Postulaciones</p>
              <h3 className="text-[36px] font-bold text-foreground tracking-tight mt-1">3</h3>
            </div>
          </Card>

          {/* En revisión */}
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-muted-foreground">En Revisión</p>
              <h3 className="text-[36px] font-bold text-foreground tracking-tight mt-1">1</h3>
            </div>
          </Card>

          {/* Contratado */}
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-muted-foreground">Contratado</p>
              <h3 className="text-[36px] font-bold text-foreground tracking-tight mt-1">1</h3>
            </div>
          </Card>

          {/* Match Score */}
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 p-8 rounded-[24px] flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="h-12 w-12 rounded-full bg-[#007bc2]/10 text-[#007bc2] flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-muted-foreground">Match IA Promedio</p>
              <h3 className="text-[36px] font-bold text-foreground tracking-tight mt-1">82%</h3>
            </div>
          </Card>
        </div>
      </section>

      {/* Applications List */}
      <section className="flex flex-col gap-8 mb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-[32px] md:text-[40px] font-medium text-foreground tracking-[-0.4px] leading-[1.2]">
            Mis Postulaciones
          </h2>
          <Link href="/dashboard/discovery">
            <Button variant="ghost" className="h-[36px] rounded-full px-4 text-[14px] font-semibold text-foreground hover:bg-muted">
              Buscar más empleos
            </Button>
          </Link>
        </div>

        <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] overflow-hidden shadow-xs">
          <div className="divide-y divide-border/30">
            {mockApplications.map((app) => (
              <div 
                key={app.id} 
                className="p-8 hover:bg-muted/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-extrabold text-[12px] text-primary shadow-xs border border-border/40 shrink-0">
                    {app.companyInitials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[18px] font-bold text-foreground truncate">{app.position}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[13px] text-muted-foreground font-semibold flex-wrap">
                      <span className="flex items-center gap-1 font-bold text-foreground/75">
                        <Building2 className="h-3.5 w-3.5" />
                        {app.company}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {app.location}
                      </span>
                      <span>·</span>
                      <span>Postulado {app.appliedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Progress & Status */}
                <div className="flex items-center gap-6 self-start md:self-auto w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                  <div className="flex flex-col gap-1.5 w-full sm:w-40">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground">
                      <span>Progreso</span>
                      <span>{app.progress}%</span>
                    </div>
                    <div className="w-full bg-muted/60 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${app.progress}%` }}></div>
                    </div>
                  </div>

                  <span className={`text-[12px] font-bold px-3 py-1.5 rounded-full border tracking-wide uppercase shrink-0 ${app.statusColor}`}>
                    {app.statusLabel}
                  </span>

                  <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

    </div>
  );
}
