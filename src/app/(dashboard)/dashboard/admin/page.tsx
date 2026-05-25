import * as React from "react";
import Link from "next/link";
import { 
  PlusCircle, 
  Mail, 
  BarChart3, 
  Users, 
  Plus, 
  Download,
  Clock,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getDashboardSession } from "@/modules/auth/services/dashboard-session";
import { AdminPlatformStats } from "@/modules/admin/components/admin-platform-stats";

export default async function AdminDashboard() {
  const { userName } = await getDashboardSession();

  return (
    <div className="flex-1 overflow-y-auto w-full p-6 md:p-10 lg:p-12 max-w-[1440px] mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Page Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-border/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Consola de Administración Central
            </Badge>
          </div>
          <h2 className="text-[32px] md:text-[48px] font-bold text-foreground tracking-tight leading-none">
            Panel Principal
          </h2>
          <p className="text-[16px] md:text-[18px] text-muted-foreground mt-2 max-w-xl">
            Control administrativo centralizado y métricas de rendimiento en tiempo real.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-11 px-6 rounded-full border-primary/20 text-primary hover:bg-primary/5 font-medium transition-all gap-2 text-[14px]">
            <Download className="h-4 w-4" />
            Descargar Reporte
          </Button>
          <Button className="flex-1 md:flex-none h-11 px-6 rounded-full bg-primary text-primary-foreground hover:opacity-90 font-medium transition-all shadow-lg shadow-primary/20 gap-2 text-[14px]">
            <Plus className="h-4 w-4" />
            Nueva Vacante
          </Button>
        </div>
      </section>

      {/* 4 Metric Cards */}
      <AdminPlatformStats />

      {/* Main Asymmetric Bento Grid Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Critical Activity Feed */}
        <Card className="lg:col-span-8 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] p-8 md:p-10 shadow-sm">
          <div className="flex justify-between items-center mb-8 border-b border-border/20 pb-4">
            <h4 className="text-[20px] md:text-[24px] font-bold text-foreground tracking-tight">
              Actividad Crítica
            </h4>
            <Link href="#" className="text-[14px] font-semibold text-primary hover:underline transition-colors flex items-center gap-1">
              Ver todo
            </Link>
          </div>
          <div className="space-y-6">
            
            {/* Feed Item 1 */}
            <div className="flex items-start gap-4 md:gap-6 p-4 rounded-[16px] hover:bg-muted/40 transition-colors group">
              <Avatar className="w-12 h-12 md:w-14 md:h-14 rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                <AvatarImage 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBp0-9VnZ4-Gz8CJ4bqOPLeFr861hWN9o8qSl-dRLZsL68fvAh2HP7ONje3Zjcp-IFh1HAsWe_S_PfPMZlzV-FdLW901S7Z-aALkWUKa2EuNDECZ8ObAuB8TvWMBLMX0UmZtP_5tQZl8mhwGLeE8C_rRhGp41YDisRnTKplDqsxG6wntDspfxHUT7HPUTfxduM8O1NOwOzvh5fCEYw0v0oR-M_LtouyDi2HRrTtmQSar7qlLuXSdJPfTFd-H1vXR7OkH9VWbYjnBeg" 
                  alt="Mariana Velázquez" 
                  className="object-cover"
                />
                <AvatarFallback>MV</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[14px] font-bold text-foreground">Mariana Velázquez</span>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider">
                    PRO PREMIUM
                  </Badge>
                </div>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Ha actualizado su portafolio para la vacante <span className="font-semibold text-foreground">UX Design Lead</span>.
                </p>
              </div>
              <span className="text-[12px] font-medium text-muted-foreground/60 whitespace-nowrap self-start mt-1">
                hace 5 min
              </span>
            </div>

            {/* Feed Item 2 */}
            <div className="flex items-start gap-4 md:gap-6 p-4 rounded-[16px] hover:bg-muted/40 transition-colors group">
              <Avatar className="w-12 h-12 md:w-14 md:h-14 rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                <AvatarImage 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHwJrniO9MroUHJ6f-JBtsGXQG3NAHGN1cT6WMqOLhhzlIrCT6wL6O5LrLTMbsKdnEiLhEl6QIJ5VLB15smo1Dgzg-cTmDIaIsZ3uJ8LfUa1MTBjX4nTSGOnCnr124W1qPotQX6nWKspJ7oKN1FRDHjvRtg46SLTPEDbH9X4ZYdtnrrTfPWMXEyWKLydOx_BIMUZoPbHTMXwYAuMyTwgwpgyrIPCi4FjB_fNPV1xrh7vXia_HiXZVd_nzeL8Lp4epzb_3eVVWbUlw" 
                  alt="Julian Arboleda" 
                  className="object-cover"
                />
                <AvatarFallback>JA</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[14px] font-bold text-foreground">Julian Arboleda</span>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider">
                    PRO PREMIUM
                  </Badge>
                </div>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Solicitó revisión de SLA para la postulación <span className="font-semibold text-foreground">Fullstack Dev</span>.
                </p>
              </div>
              <span className="text-[12px] font-medium text-muted-foreground/60 whitespace-nowrap self-start mt-1">
                hace 12 min
              </span>
            </div>

            {/* Feed Item 3 */}
            <div className="flex items-start gap-4 md:gap-6 p-4 rounded-[16px] hover:bg-muted/40 transition-colors group">
              <Avatar className="w-12 h-12 md:w-14 md:h-14 rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                <AvatarImage 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCic4VcNty7ZUcbxvCXrpenl9MK4EsoPgYPl6LRT45FiAkOlgJ2iSzgfW4UduFonQdgYnMfkELyCf_5FeyYKcs6FCjBJGHgBjTGJxFpP7A69Az8yLLrw-U9BTdq4U6EubS6B8DZPypS4sQ8iVHGj0xCkp7iRuZOAgG24_Os7cSJjUsQOFKsULk4TThXqz3HESxO9ix7-wLYHie6gP8-8cjZ4R5KhTdgR70rbuZ5nrx_fxkDMF3c6Wh7p-LiQZfP-Re8D-A_EFsDv_0" 
                  alt="Sofia Chen" 
                  className="object-cover"
                />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[14px] font-bold text-foreground">Sofia Chen</span>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider">
                    PRO PREMIUM
                  </Badge>
                </div>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Aceptó la propuesta económica para <span className="font-semibold text-foreground">Data Scientist II</span>.
                </p>
              </div>
              <span className="text-[12px] font-medium text-muted-foreground/60 whitespace-nowrap self-start mt-1">
                hace 1 h
              </span>
            </div>

            {/* Feed Item 4 */}
            <div className="flex items-start gap-4 md:gap-6 p-4 rounded-[16px] hover:bg-muted/40 transition-colors group">
              <Avatar className="w-12 h-12 md:w-14 md:h-14 rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                <AvatarImage 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIhOLP_3mEYRhKt4z2wDuo5pFpmRKIWk-04gsU_Ju4-qqRQR4sfVHJhLxTdUY4gtmvlj17Rvb3jeB_tV4uOoOnCCHK4zijlw4_-5FPqjhW4NhdUiy3oLCUmNJdkug-myk06ffvUYi5jqHe2E6_C2F2wIrNErNL7fug_uF98ue0GHmYsNUt9DFwsmQ9vpCiFjDHbkbLK9lzTs7H6H8-uoS6pK4fRJPHOnRzcBjtuz_dP3rtBD-SGwDJASDnm0It8a_kTFvCLHOlQFM" 
                  alt="Roberto Mejía" 
                  className="object-cover"
                />
                <AvatarFallback>RM</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[14px] font-bold text-foreground">Roberto Mejía</span>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wider">
                    PRO PREMIUM
                  </Badge>
                </div>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Nueva postulación entrante para <span className="font-semibold text-foreground">Product Manager</span>.
                </p>
              </div>
              <span className="text-[12px] font-medium text-muted-foreground/60 whitespace-nowrap self-start mt-1">
                hace 2 h
              </span>
            </div>

          </div>
        </Card>

        {/* Right: Quick Actions & Mini Calendar */}
        <div className="lg:col-span-4 space-y-8 w-full">
          
          {/* Quick Actions Card */}
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] p-8 md:p-10 shadow-sm">
            <h4 className="text-[20px] md:text-[24px] font-bold text-foreground tracking-tight mb-6">
              Acciones Rápidas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              
              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-28 rounded-2xl bg-zinc-50 dark:bg-zinc-800/20 hover:bg-primary/5 hover:border-primary/20 border-transparent transition-all gap-3 group shrink-0">
                <PlusCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                <span className="text-[14px] font-semibold text-foreground">Nueva</span>
              </Button>

              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-28 rounded-2xl bg-zinc-50 dark:bg-zinc-800/20 hover:bg-primary/5 hover:border-primary/20 border-transparent transition-all gap-3 group shrink-0">
                <Mail className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                <span className="text-[14px] font-semibold text-foreground">Mensajes</span>
              </Button>

              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-28 rounded-2xl bg-zinc-50 dark:bg-zinc-800/20 hover:bg-primary/5 hover:border-primary/20 border-transparent transition-all gap-3 group shrink-0">
                <BarChart3 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                <span className="text-[14px] font-semibold text-foreground">Analytics</span>
              </Button>

              <Button variant="outline" className="flex flex-col items-center justify-center p-6 h-28 rounded-2xl bg-zinc-50 dark:bg-zinc-800/20 hover:bg-primary/5 hover:border-primary/20 border-transparent transition-all gap-3 group shrink-0">
                <Users className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                <span className="text-[14px] font-semibold text-foreground">Candidatos</span>
              </Button>

            </div>
          </Card>

          {/* Mini Calendar / Agenda Card */}
          <Card className="bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[24px] p-8 md:p-10 shadow-sm">
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-border/20">
              <h4 className="text-[20px] md:text-[24px] font-bold text-foreground tracking-tight">
                Próximos Eventos
              </h4>
              <span className="text-[13px] font-medium text-muted-foreground">Mayo 2026</span>
            </div>
            <div className="space-y-5">
              
              {/* Event 1 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-14 bg-primary text-primary-foreground rounded-2xl shrink-0 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">MAY</span>
                  <span className="text-[18px] font-extrabold leading-none">24</span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">Entrevista: Luis Parra</p>
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                    10:30 AM · Zoom
                  </p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center justify-center w-12 h-14 bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-2xl shrink-0 border border-border/50">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">MAY</span>
                  <span className="text-[18px] font-extrabold leading-none text-foreground">25</span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">Revisión de SLA Semanal</p>
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                    02:00 PM · Sala 402
                  </p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex gap-4 opacity-60">
                <div className="flex flex-col items-center justify-center w-12 h-14 bg-zinc-100 dark:bg-zinc-800 text-foreground rounded-2xl shrink-0 border border-border/50">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">MAY</span>
                  <span className="text-[18px] font-extrabold leading-none text-foreground">26</span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">Cierre de Vacante: IT</p>
                  <p className="text-[13px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                    11:00 AM · K'anPro CRM
                  </p>
                </div>
              </div>

            </div>
            <Button variant="outline" className="w-full mt-6 h-11 rounded-full border-border hover:bg-muted text-[14px] font-semibold">
              Agendar Evento
            </Button>
          </Card>

        </div>
      </section>

      {/* FAB for Quick Access */}
      <Button 
        size="icon" 
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all z-50 cursor-pointer"
      >
        <Plus className="h-8 w-8" />
      </Button>

    </div>
  );
}
