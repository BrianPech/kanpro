import * as React from "react"
import { ArrowRight, Eye, Send, DollarSign, PlusCircle, CheckCircle2, ChevronRight, Activity, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getProDashboardData } from "@/modules/pro/services/pro-dashboard"

export default async function ProfessionalDashboard() {
  const { profileName, services } = await getProDashboardData()


  return (
    <div className="flex flex-col gap-16 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. BIENVENIDA (Hero / Card) - Themed Canvas */}
      <section className="bg-primary text-primary-foreground rounded-[24px] md:rounded-[32px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-[800px]">
          <div className="flex items-center gap-3 mb-8">
            <span className="w-12 h-[1px] bg-primary-foreground/30"></span>
            <span className="text-[13px] uppercase tracking-widest font-medium text-primary-foreground/80">Panel de Control</span>
          </div>
          <h1 className="text-[56px] md:text-[80px] font-medium tracking-tighter leading-[1.0] mb-6">
            Bienvenido,<br />{profileName}.
          </h1>
          <p className="text-[18px] text-primary-foreground/90 tracking-[-0.09px] leading-[1.56] mb-10 max-w-[500px]">
            Tu ecosistema profesional está operando. Expande tu alcance completando tu portafolio o creando nuevos servicios.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/pro/profile">
              <Button className="h-[48px] rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-[16px] font-semibold tracking-[0.24px] px-[28px] shadow-none">
                Completar Perfil
              </Button>
            </Link>
            <Link href="/dashboard/pro/services">
              <Button variant="outline" className="h-[48px] rounded-full bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground text-[16px] font-semibold px-[28px]">
                Gestionar Servicios
              </Button>
            </Link>
          </div>
        </div>
        {/* Subtle geometric overlay to break the flat color without feeling cheap */}
        <div className="absolute -right-[10%] -top-[20%] w-[60%] h-[150%] pointer-events-none opacity-[0.05] rotate-12 mix-blend-overlay">
          <div className="w-full h-full bg-primary-foreground rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* 2. MÉTRICAS RÁPIDAS (Bento Grid) */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[32px] md:text-[40px] font-medium text-foreground tracking-[-0.4px] leading-[1.2]">
            Resumen
          </h2>
          <Button variant="ghost" className="h-[36px] rounded-full px-4 text-[14px] font-semibold hover:bg-muted group">
            Periodo: Últimos 30 días
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Vistas Card - Teal Accent */}
          <div className="bg-card text-card-foreground border border-border/50 rounded-[24px] p-[32px] flex flex-col gap-8 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div className="h-14 w-14 rounded-full bg-[#00a87e]/10 text-[#00a87e] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
                <Eye className="h-7 w-7" />
              </div>
              <span className="text-[13px] text-[#428619] font-medium bg-[#428619]/10 px-3 py-1 rounded-full flex items-center gap-1">
                <Activity className="w-3 h-3" /> +0%
              </span>
            </div>
            <div className="mt-auto pt-4">
              <p className="text-[16px] text-muted-foreground font-medium mb-2">Vistas del Perfil</p>
              <h3 className="text-[48px] font-medium tracking-tighter leading-[1.0]">0</h3>
            </div>
          </div>

          {/* Propuestas Card - Pink Accent */}
          <div className="bg-card text-card-foreground border border-border/50 rounded-[24px] p-[32px] flex flex-col gap-8 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div className="h-14 w-14 rounded-full bg-[#e61e49]/10 text-[#e61e49] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
                <Send className="h-7 w-7" />
              </div>
              <span className="text-[13px] text-muted-foreground font-medium px-3 py-1 rounded-full border border-border">
                0 en revisión
              </span>
            </div>
            <div className="mt-auto pt-4">
              <p className="text-[16px] text-muted-foreground font-medium mb-2">Propuestas Enviadas</p>
              <h3 className="text-[48px] font-medium tracking-tighter leading-[1.0]">0</h3>
            </div>
          </div>

          {/* Ingresos Card - Blue Accent */}
          <div className="bg-card text-card-foreground border border-border/50 rounded-[24px] p-[32px] flex flex-col gap-8 shadow-sm hover:border-foreground/20 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start">
              <div className="h-14 w-14 rounded-full bg-[#007bc2]/10 text-[#007bc2] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out">
                <DollarSign className="h-7 w-7" />
              </div>
            </div>
            <div className="mt-auto pt-4">
              <p className="text-[16px] text-muted-foreground font-medium mb-2">Ingresos Estimados</p>
              <h3 className="text-[48px] font-medium tracking-tighter leading-[1.0]">$0</h3>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SERVICIOS ACTIVOS (Horizontal Scroll / Grid) */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[32px] md:text-[40px] font-medium text-foreground tracking-[-0.4px] leading-[1.2]">
            Servicios
          </h2>
          <Link href="/dashboard/pro/services">
            <Button variant="ghost" className="h-[36px] rounded-full px-4 text-[14px] font-semibold text-foreground hover:bg-muted">
              Ver todos
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-card text-card-foreground border border-border/50 rounded-[24px] p-6 shadow-sm hover:shadow-md hover:border-foreground/20 transition-all flex flex-col h-[320px]">
              <div className="bg-muted w-full h-[140px] rounded-[16px] mb-6 flex items-center justify-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-muted-foreground/10 to-transparent"></div>
                <Briefcase className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-[20px] font-medium text-foreground leading-[1.4] mb-2 line-clamp-2">
                {service.title}
              </h3>
              <div className="mt-auto flex items-end justify-between">
                <div>
                  <p className="text-[14px] text-muted-foreground">Desde</p>
                  <p className="text-[20px] font-medium tracking-tight">${service.price}</p>
                </div>
                <Link href="/dashboard/pro/services">
                  <Button variant="outline" className="rounded-full h-[36px] px-5 text-[14px] font-semibold border-border hover:bg-foreground hover:text-background transition-colors">
                    Editar
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          <Link href="/dashboard/pro/services" className="flex">
            <button className="bg-transparent border-2 border-dashed border-border/60 hover:border-foreground/30 rounded-[24px] p-6 flex flex-col items-center justify-center h-[320px] w-full transition-colors group">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-foreground mb-6 group-hover:scale-110 transition-transform duration-300">
                <PlusCircle className="h-8 w-8 opacity-70 group-hover:opacity-100" />
              </div>
              <h3 className="text-[20px] font-medium text-foreground tracking-tight">Crear Servicio</h3>
              <p className="text-[16px] text-muted-foreground mt-2">Empaqueta tus habilidades</p>
            </button>
          </Link>
        </div>
      </section>

      {/* 4. PRÓXIMOS PASOS (Action List) */}
      <section className="flex flex-col gap-8 mb-16">
        <h2 className="text-[32px] md:text-[40px] font-medium text-foreground tracking-[-0.4px] leading-[1.2]">
          Tareas Pendientes
        </h2>
        <div className="bg-card border border-border/50 rounded-[24px] overflow-hidden shadow-sm">
          
          <div className="flex items-center gap-6 p-8 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group">
            <div className="h-8 w-8 rounded-full border-[2px] border-foreground/20 flex items-center justify-center text-transparent group-hover:border-foreground transition-colors">
              <CheckCircle2 className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:text-foreground transition-opacity" />
            </div>
            <div className="flex-1">
              <h4 className="text-[20px] font-medium text-foreground leading-tight mb-2">Verificar Identidad</h4>
              <p className="text-[16px] text-muted-foreground">Requerido para retirar fondos y acceder a proyectos premium.</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
              <ArrowRight className="h-6 w-6 text-foreground" />
            </Button>
          </div>

          <div className="flex items-center gap-6 p-8 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer group">
            <div className="h-8 w-8 rounded-full border-[2px] border-foreground/20 flex items-center justify-center text-transparent group-hover:border-foreground transition-colors">
              <CheckCircle2 className="h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:text-foreground transition-opacity" />
            </div>
            <div className="flex-1">
              <h4 className="text-[20px] font-medium text-foreground leading-tight mb-2">Sube tu primer proyecto</h4>
              <p className="text-[16px] text-muted-foreground">Los profesionales con portafolio reciben 3x más propuestas.</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
              <ArrowRight className="h-6 w-6 text-foreground" />
            </Button>
          </div>

          <div className="flex items-center gap-6 p-8 bg-muted/20">
            <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-background">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-[20px] font-medium text-muted-foreground line-through leading-tight mb-2">Completar Perfil Básico</h4>
              <p className="text-[16px] text-muted-foreground">¡Listo! Has completado tu información principal.</p>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}

