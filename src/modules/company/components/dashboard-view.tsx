"use client"

import * as React from "react"
import { Briefcase, Users, Eye, Plus, ArrowRight, Mail, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardViewProps {
  companyName: string
}

export function DashboardView({ companyName }: DashboardViewProps) {
  // Datos mock para la maqueta
  const metrics = [
    { title: "Vacantes Activas", value: "12", icon: Briefcase, color: "bg-blue-500/10 text-blue-500" },
    { title: "Postulaciones", value: "48", icon: Users, color: "bg-purple-500/10 text-purple-500" },
    { title: "Visualizaciones", value: "1.2k", icon: Eye, color: "bg-emerald-500/10 text-emerald-500" },
  ]

  const recentApplicants = [
    {
      id: 1,
      name: "Alex Silva",
      headline: "Senior Frontend Developer",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
      tags: ["React", "TypeScript", "Next.js"],
    },
    {
      id: 2,
      name: "María Gómez",
      headline: "Product Designer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      tags: ["UI/UX", "Figma", "Design Systems"],
    },
    {
      id: 3,
      name: "Carlos Ruiz",
      headline: "Full Stack Engineer",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop",
      tags: ["Node.js", "Python", "AWS"],
    },
  ]

  return (
    <div className="flex flex-col gap-12 p-6 md:p-12 lg:p-16 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground rounded-[32px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-[800px]">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-[1px] bg-primary-foreground/30"></span>
            <span className="text-[13px] uppercase tracking-widest font-medium text-primary-foreground/80">Panel de Empresa</span>
          </div>
          <h1 className="text-[48px] md:text-[64px] font-medium tracking-tighter leading-[1.1] mb-4">
            Bienvenido,<br />{companyName}.
          </h1>
          <p className="text-[16px] text-primary-foreground/90 tracking-[-0.09px] leading-[1.56] mb-8 max-w-[500px]">
            Tu panel de control está listo. Aquí podrás buscar el mejor talento y gestionar tus proyectos abiertos.
          </p>
          
          {/* Glass Button */}
          <Link href="/dashboard/company/vacancies?create=true">
            <Button 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md rounded-full px-6 py-6 h-auto text-base font-medium flex items-center gap-2 transition-all duration-300 group"
            >
              <Plus className="size-5 transition-transform group-hover:rotate-90 duration-300" />
              Publicar Nueva Vacante
            </Button>
          </Link>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -right-[10%] -top-[20%] w-[60%] h-[150%] pointer-events-none opacity-[0.1] rotate-12 mix-blend-overlay">
          <div className="w-full h-full bg-primary-foreground rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* Bento Grid Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="bg-card border border-border/50 rounded-[24px] p-8 flex flex-col gap-4 hover:border-border transition-all duration-300 group cursor-pointer"
          >
            <div className={`size-12 rounded-full flex items-center justify-center ${metric.color}`}>
              <metric.icon className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium mb-1">{metric.title}</p>
              <h3 className="text-[36px] font-semibold tracking-tighter text-foreground">{metric.value}</h3>
            </div>
          </div>
        ))}
      </section>

      {/* Recent Activity & Applicants */}
      <section className="bg-card border border-border/50 rounded-[24px] p-8 md:p-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-[28px] font-medium tracking-tight text-foreground mb-1">Postulaciones Recientes</h2>
            <p className="text-[14px] text-muted-foreground">Los últimos profesionales que se han postulado a tus vacantes.</p>
          </div>
          <Button variant="ghost" className="text-primary hover:text-primary/80 flex items-center gap-2 p-0 h-auto font-medium">
            Ver todas <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {recentApplicants.map((applicant) => (
            <div 
              key={applicant.id} 
              className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-[20px] bg-background/50 border border-border/30 hover:border-border/80 transition-all duration-300 gap-4 group"
            >
              <div className="flex items-center gap-4">
                <div className="relative size-14 rounded-full overflow-hidden border-2 border-background shadow-sm">
                  <img src={applicant.avatar} alt={applicant.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">{applicant.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{applicant.headline}</p>
                  <div className="flex flex-wrap gap-2">
                    {applicant.tags.map((tag, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end md:self-auto">
                <Button size="icon" variant="outline" className="rounded-full size-10 text-muted-foreground hover:text-foreground">
                  <Mail className="size-4" />
                </Button>
                <Button size="icon" variant="outline" className="rounded-full size-10 text-muted-foreground hover:text-foreground">
                  <Globe className="size-4" />
                </Button>
                <Button className="rounded-full px-5 text-sm font-medium">
                  Ver Perfil
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
